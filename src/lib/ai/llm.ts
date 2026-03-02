/**
 * Unified LLM Gateway
 * 
 * Single entry point for all AI calls.
 * - maxRetries: 0 (no SDK retries)
 * - AbortSignal timeout for fast-fail
 * - In-memory cooldown gate for 429
 */

import { generateText, generateObject } from 'ai';
import { getOpenAIClient } from '@/lib/openai-client';
import { log, logError, logWarn } from '@/lib/logger';
import { runQueued, stableHash, type GatewayTaskKey, isGatewayQueueError } from './gateway-queue';
import { shouldUseMock, mockCallText, mockCallObject } from './llm-mock';
import type { CoreMessage } from 'ai';
import type { z } from 'zod';

/**
 * AI Error Type (统一错误类型)
 * 全项目只使用这套类型，不再出现 'rate_limit'/'network_error' 等小写分支
 */
export type AIErrorType = 'RATE_LIMIT' | 'NETWORK' | 'PROVIDER' | 'PARSE';

/**
 * AI Result (Discriminated Union)
 * 统一的 LLM 调用返回类型
 */
export type AIResult<T> =
  | { ok: true; data: T; raw?: string; metrics: { queuedMs: number; dedupHit: boolean; totalMs: number } }
  | { ok: false; type: AIErrorType; message: string; cooldownSeconds?: number; raw?: string; metrics: { queuedMs: number; dedupHit: boolean; totalMs: number } };

/**
 * Local rate limit cooldown gate (in-memory)
 */
let rateLimitUntilMs = 0;

/**
 * Check if rate limit cooldown gate is active
 */
function checkCooldownGate(): { blocked: boolean; cooldownSeconds: number } {
  const now = Date.now();
  if (now < rateLimitUntilMs) {
    const remainingSeconds = Math.ceil((rateLimitUntilMs - now) / 1000);
    return { blocked: true, cooldownSeconds: remainingSeconds };
  }
  return { blocked: false, cooldownSeconds: 0 };
}

/**
 * Update cooldown gate after receiving 429
 */
function updateCooldownGate(cooldownSeconds: number): void {
  rateLimitUntilMs = Date.now() + cooldownSeconds * 1000;
  log('🚫 [LLM Gateway] Cooldown gate updated', {
    cooldownSeconds,
    untilMs: rateLimitUntilMs,
  });
}

/**
 * Extract cooldown seconds from error
 */
function extractCooldownSeconds(error: unknown): number {
  if (error && typeof error === 'object') {
    if ('response' in error && error.response && typeof error.response === 'object') {
      const headers = 'headers' in error.response ? error.response.headers : null;
      if (headers && typeof headers === 'object' && 'get' in headers) {
        const retryAfter = (headers as { get: (name: string) => string | null }).get('retry-after');
        if (retryAfter) {
          const seconds = parseInt(retryAfter, 10);
          if (!isNaN(seconds) && seconds > 0) {
            return seconds;
          }
        }
      }
    }
    if ('cooldownSeconds' in error && typeof (error as { cooldownSeconds: unknown }).cooldownSeconds === 'number') {
      return (error as { cooldownSeconds: number }).cooldownSeconds;
    }
  }
  return 10; // Default cooldown
}

/**
 * Check if error is rate limit error
 */
function isRateLimitError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const errorMessage = error instanceof Error ? error.message : String(error);
  return (
    errorMessage.includes('429') ||
    errorMessage.includes('Too Many Requests') ||
    errorMessage.includes('rate limit') ||
    ('statusCode' in error && (error as { statusCode: unknown }).statusCode === 429) ||
    ('status' in error && (error as { status: unknown }).status === 429) ||
    ('type' in error && (error as { type: unknown }).type === 'rate_limit')
  );
}

/**
 * Check if error is network error
 */
function isNetworkError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const errorMessage = error instanceof Error ? error.message : String(error);

  const hasNetworkMessage = !!(
    errorMessage.includes('fetch failed') ||
    errorMessage.includes('ECONNREFUSED') ||
    errorMessage.includes('ENOTFOUND') ||
    errorMessage.includes('ETIMEDOUT') ||
    errorMessage.includes('ECONNRESET') ||
    errorMessage.includes('network') ||
    errorMessage.includes('NetworkError')
  );

  const hasNetworkCause = !!(
    'cause' in error &&
    error.cause &&
    typeof error.cause === 'object' &&
    ('code' in error.cause || 'errno' in error.cause)
  );

  return hasNetworkMessage || hasNetworkCause;
}

/**
 * Call LLM with text prompt or messages (including image parts)
 * 
 * Single entry point for all AI calls. Uses generateText with maxRetries=0 and AbortSignal timeout.
 * All calls go through gateway queue for deduplication and concurrency control.
 * 
 * @param params Configuration for LLM call
 * @returns Discriminated union result (ok:true with data, or ok:false with error type)
 */
export async function callText(params: {
  model: string;
  prompt?: string;
  messages?: CoreMessage[];
  timeoutMs?: number;
  maxOutputTokens?: number;
  temperature?: number;
  aiConfig?: { visionModel?: string; textModel?: string };
  actionName?: string; // For task key generation
  attachments?: string; // For task key generation
  mode?: string; // For task key generation
}): Promise<AIResult<string>> {
  // Check if we should use mock mode
  if (shouldUseMock()) {
    return mockCallText({
      prompt: params.prompt || '',
      actionName: params.actionName,
      mode: params.mode,
    });
  }

  const {
    model,
    prompt,
    messages,
    timeoutMs = 180000, // Default 180s (3 minutes) timeout
    maxOutputTokens,
    temperature,
    aiConfig,
    actionName = 'callText',
    attachments = '',
    mode = '',
  } = params;

  // Validate: either prompt or messages must be provided
  if (!prompt && !messages) {
    return {
      ok: false,
      type: 'PROVIDER',
      message: 'Either prompt or messages must be provided',
      metrics: {
        queuedMs: 0,
        dedupHit: false,
        totalMs: 0,
      },
    };
  }

  const requestId = `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Generate stable task key: model + actionName + hash(prompt/messages) + hash(attachments) + mode
  // Avoid concatenating long prompt/messages into keyInput
  const promptHash = prompt ? stableHash(prompt) : '';
  const messagesHash = messages ? stableHash(JSON.stringify(messages)) : '';
  const attachmentsHash = attachments ? stableHash(attachments) : '';
  const keyInput = `${model}:${actionName}:${promptHash || messagesHash}:${attachmentsHash}:${mode}`;
  const keyHash = stableHash(keyInput);
  const taskKey: GatewayTaskKey = `${model}:${actionName}:${keyHash}`;

  // Check cooldown gate (fast-fail, <= 2s)
  const cooldownCheck = checkCooldownGate();
  if (cooldownCheck.blocked) {
    log('🚫 [LLM Gateway] Request blocked by cooldown gate', {
      requestId,
      cooldownSeconds: cooldownCheck.cooldownSeconds,
    });
    return {
      ok: false,
      type: 'RATE_LIMIT',
      message: `请求过多，请在 ${cooldownCheck.cooldownSeconds} 秒后重试`,
      cooldownSeconds: cooldownCheck.cooldownSeconds,
      metrics: {
        queuedMs: 0,
        dedupHit: false,
        totalMs: 0,
      },
    };
  }

  // Execute through gateway queue
  const queueStartMs = Date.now();
  
  try {
    const { result, metrics } = await runQueued('openai', taskKey, async (qm) => {
    
    // Initialize OpenAI client
    const openaiClient = getOpenAIClient(aiConfig);

    // Create AbortController for timeout
    const controller = new AbortController();
    const startTime = Date.now();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      log('🚀 [LLM Gateway] Starting LLM call', {
        requestId,
        model,
        timeoutMs,
        maxOutputTokens,
        hasMessages: !!messages,
        hasPrompt: !!prompt,
        queuedMs: qm.queuedMs,
        dedupHit: qm.dedupHit,
      });

      // Build generateText options
      const generateOptions: any = {
        model: openaiClient(model),
        maxRetries: 0, // Disable SDK retries, we handle errors ourselves
        abortSignal: controller.signal,
      };

      if (messages) {
        generateOptions.messages = messages;
      } else if (prompt) {
        generateOptions.prompt = prompt;
      }

      // Only set temperature if explicitly provided
      if (temperature !== undefined) {
        generateOptions.temperature = temperature;
      }

      // Only set maxOutputTokens if explicitly provided
      if (maxOutputTokens !== undefined) {
        generateOptions.maxTokens = maxOutputTokens;
      }

      const result = await generateText(generateOptions);

      clearTimeout(timeoutId);
      const elapsed = Date.now() - startTime;

      const rawText = result.text.trim();

      log('✅ [LLM Gateway] LLM call completed', {
        requestId,
        model,
        elapsedMs: elapsed,
        rawLength: rawText.length,
        queuedMs: qm.queuedMs,
        dedupHit: qm.dedupHit,
      });

      return {
        ok: true as const,
        data: rawText,
        raw: rawText,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      const elapsed = Date.now() - startTime;

      // Handle abort (timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        logError('⏱️ [LLM Gateway] Request timeout', {
          requestId,
          model,
          timeoutMs,
          elapsedMs: elapsed,
        });
        // Add warning log when timeout is exceeded
        logWarn('[LLM Timeout] Prompt likely too complex, consider shorter request.', {
          requestId,
          model,
          timeoutMs,
          elapsedMs: elapsed,
          actionName: actionName || 'unknown',
        });
        throw {
          type: 'PROVIDER',
          message: `请求超时（${timeoutMs}ms）`,
          raw: '',
        };
      }

      // Handle rate limit (429) - wrap as typed error
      if (isRateLimitError(error)) {
        const cooldownSeconds = extractCooldownSeconds(error);
        updateCooldownGate(cooldownSeconds);
        
        logError('🚫 [LLM Gateway] Rate limit error', {
          requestId,
          model,
          cooldownSeconds,
          elapsedMs: elapsed,
        });
        
        throw {
          type: 'RATE_LIMIT',
          message: `请求过多，请在 ${cooldownSeconds} 秒后重试`,
          cooldownSeconds,
          raw: error instanceof Error ? error.message : String(error),
        };
      }

      // Handle network errors - wrap as typed error
      if (isNetworkError(error)) {
        logError('🌐 [LLM Gateway] Network error', {
          requestId,
          model,
          error: error instanceof Error ? error.message : String(error),
          elapsedMs: elapsed,
        });
        
        throw {
          type: 'NETWORK',
          message: `网络连接失败: ${error instanceof Error ? error.message : String(error)}`,
          raw: error instanceof Error ? error.message : String(error),
        };
      }

      // Handle other provider errors
      logError('❌ [LLM Gateway] Provider error', {
        requestId,
        model,
        error: error instanceof Error ? error.message : String(error),
        elapsedMs: elapsed,
      });

      throw {
        type: 'PROVIDER',
        message: `AI 服务错误: ${error instanceof Error ? error.message : String(error)}`,
        raw: error instanceof Error ? error.message : String(error),
      };
    }
    });

    const totalMs = Date.now() - queueStartMs;

    // Log metrics
    log('📊 [LLM Gateway] Queue metrics', {
      requestId,
      queuedMs: metrics.queuedMs,
      dedupHit: metrics.dedupHit,
      totalMs,
    });

    // ✅ runQueued 成功时返回 { result: T, metrics: GatewayMetrics }
    // ✅ result 是 fn 的返回值，应该是 { ok: true, data: T, ... } 结构
    // ✅ 如果 fn 内部 throw，runQueued 会 reject（进入 catch 块），不会返回 error object
    // ✅ 所以这里只需要处理成功的情况，直接注入 metrics
    return {
      ...result,
      metrics: {
        queuedMs: metrics.queuedMs,
        dedupHit: metrics.dedupHit,
        totalMs,
      },
    } as AIResult<string>;
  } catch (err) {
    const totalMs = Date.now() - queueStartMs;

    // 默认值（理论上很少用到）
    let queuedMs = Math.max(0, totalMs - 1000);
    let dedupHit = false;

    // ✅ 如果是队列包装错误，拿到真实 metrics
    let error = err;
    if (isGatewayQueueError(err)) {
      queuedMs = err.metrics.queuedMs;
      dedupHit = err.metrics.dedupHit;
      error = err.error;
    }

    const errorObj = error as { type?: string; message?: string; cooldownSeconds?: number; raw?: string };

    if (errorObj && typeof errorObj === 'object' && 'type' in errorObj) {
      const errorType = errorObj.type as AIErrorType;
      return {
        ok: false,
        type: errorType,
        message: errorObj.message || 'Unknown error',
        cooldownSeconds: errorObj.cooldownSeconds,
        raw: errorObj.raw,
        metrics: { queuedMs, dedupHit, totalMs },
      };
    }

    logError('❌ [LLM Gateway] Unexpected error from runQueued', { error });
    return {
      ok: false,
      type: 'PROVIDER',
      message: `AI 服务错误: ${error instanceof Error ? error.message : String(error)}`,
      raw: error instanceof Error ? error.message : String(error),
      metrics: { queuedMs, dedupHit, totalMs },
    };
  }
}

/**
 * Call LLM with object schema (structured output)
 * 
 * Single entry point for all structured AI calls. Uses generateObject with maxRetries=0 and AbortSignal timeout.
 * All calls go through gateway queue for deduplication and concurrency control.
 * 
 * @param params Configuration for LLM call
 * @returns Discriminated union result (ok:true with data, or ok:false with error type)
 */
export async function callObject<T extends z.ZodTypeAny>(params: {
  model: string;
  schema: T;
  messages?: CoreMessage[];
  prompt?: string;
  timeoutMs?: number;
  aiConfig?: { visionModel?: string; textModel?: string };
  actionName?: string; // For task key generation
  attachments?: string; // For task key generation
  mode?: string; // For task key generation
}): Promise<AIResult<z.infer<T>>> {
  // Check if we should use mock mode
  if (shouldUseMock()) {
    return mockCallObject<T>({
      prompt: params.prompt || '',
      schema: params.schema,
      actionName: params.actionName,
      mode: params.mode,
    });
  }

  const {
    model,
    schema,
    messages,
    prompt,
    timeoutMs = 180000, // Default 180s (3 minutes) timeout
    aiConfig,
    actionName = 'callObject',
    attachments = '',
    mode = '',
  } = params;

  const requestId = `call-obj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Generate stable task key: model + actionName + hash(prompt/messages) + hash(attachments) + mode
  // Avoid concatenating long prompt/messages into keyInput
  const promptHash = prompt ? stableHash(prompt) : '';
  const messagesHash = messages ? stableHash(JSON.stringify(messages)) : '';
  const attachmentsHash = attachments ? stableHash(attachments) : '';
  const keyInput = `${model}:${actionName}:${promptHash || messagesHash}:${attachmentsHash}:${mode}`;
  const keyHash = stableHash(keyInput);
  const taskKey: GatewayTaskKey = `${model}:${actionName}:${keyHash}`;

  // Check cooldown gate (fast-fail, <= 2s)
  const cooldownCheck = checkCooldownGate();
  if (cooldownCheck.blocked) {
    log('🚫 [LLM Gateway] Request blocked by cooldown gate', {
      requestId,
      cooldownSeconds: cooldownCheck.cooldownSeconds,
    });
    return {
      ok: false,
      type: 'RATE_LIMIT',
      message: `请求过多，请在 ${cooldownCheck.cooldownSeconds} 秒后重试`,
      cooldownSeconds: cooldownCheck.cooldownSeconds,
      metrics: {
        queuedMs: 0,
        dedupHit: false,
        totalMs: 0,
      },
    };
  }

  // Execute through gateway queue
  const queueStartMs = Date.now();
  
  try {
    const { result, metrics } = await runQueued('openai', taskKey, async (qm) => {
    
    // Initialize OpenAI client
    const openaiClient = getOpenAIClient(aiConfig);

    // Create AbortController for timeout
    const controller = new AbortController();
    const startTime = Date.now();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      log('🚀 [LLM Gateway] Starting LLM object call', {
        requestId,
        model,
        timeoutMs,
        queuedMs: qm.queuedMs,
        dedupHit: qm.dedupHit,
      });

      // Build generateOptions with proper type handling
      const generateOptions: any = {
        model: openaiClient(model),
        schema,
        maxRetries: 0, // Disable SDK retries, we handle errors ourselves
        abortSignal: controller.signal,
      };

      if (messages) {
        generateOptions.messages = messages;
      } else if (prompt) {
        generateOptions.prompt = prompt;
      } else {
        throw new Error('Either messages or prompt must be provided');
      }

      const result = await generateObject(generateOptions);

      clearTimeout(timeoutId);
      const elapsed = Date.now() - startTime;

      const objectData = result.object;

      log('✅ [LLM Gateway] LLM object call completed', {
        requestId,
        model,
        elapsedMs: elapsed,
        queuedMs: qm.queuedMs,
        dedupHit: qm.dedupHit,
      });

      return {
        ok: true as const,
        data: objectData,
        raw: JSON.stringify(objectData),
      };
    } catch (error) {
      clearTimeout(timeoutId);
      const elapsed = Date.now() - startTime;

      // Handle abort (timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        logError('⏱️ [LLM Gateway] Request timeout', {
          requestId,
          model,
          timeoutMs,
          elapsedMs: elapsed,
        });
        // Add warning log when timeout is exceeded
        logWarn('[LLM Timeout] Prompt likely too complex, consider shorter request.', {
          requestId,
          model,
          timeoutMs,
          elapsedMs: elapsed,
          actionName: actionName || 'unknown',
        });
        throw {
          type: 'PROVIDER',
          message: `请求超时（${timeoutMs}ms）`,
          raw: '',
        };
      }

      // Handle rate limit (429) - wrap as typed error
      if (isRateLimitError(error)) {
        const cooldownSeconds = extractCooldownSeconds(error);
        updateCooldownGate(cooldownSeconds);
        
        logError('🚫 [LLM Gateway] Rate limit error', {
          requestId,
          model,
          cooldownSeconds,
          elapsedMs: elapsed,
        });
        
        throw {
          type: 'RATE_LIMIT',
          message: `请求过多，请在 ${cooldownSeconds} 秒后重试`,
          cooldownSeconds,
          raw: error instanceof Error ? error.message : String(error),
        };
      }

      // Handle network errors - wrap as typed error
      if (isNetworkError(error)) {
        logError('🌐 [LLM Gateway] Network error', {
          requestId,
          model,
          error: error instanceof Error ? error.message : String(error),
          elapsedMs: elapsed,
        });
        
        throw {
          type: 'NETWORK',
          message: `网络连接失败: ${error instanceof Error ? error.message : String(error)}`,
          raw: error instanceof Error ? error.message : String(error),
        };
      }

      // Handle parse errors (JSON schema validation)
      if (error instanceof Error && (
        error.message.includes('JSON') ||
        error.message.includes('parse') ||
        error.message.includes('schema') ||
        error.message.includes('validation')
      )) {
        logError('📄 [LLM Gateway] Parse error', {
          requestId,
          model,
          error: error.message,
          elapsedMs: elapsed,
        });
        
        throw {
          type: 'PARSE',
          message: `解析错误: ${error.message}`,
          raw: error.message,
        };
      }

      // Handle other provider errors
      logError('❌ [LLM Gateway] Provider error', {
        requestId,
        model,
        error: error instanceof Error ? error.message : String(error),
        elapsedMs: elapsed,
      });

      throw {
        type: 'PROVIDER',
        message: `AI 服务错误: ${error instanceof Error ? error.message : String(error)}`,
        raw: error instanceof Error ? error.message : String(error),
      };
    }
    });

    const totalMs = Date.now() - queueStartMs;

    // Log metrics
    log('📊 [LLM Gateway] Queue metrics', {
      requestId,
      queuedMs: metrics.queuedMs,
      dedupHit: metrics.dedupHit,
      totalMs,
    });

    // Add metrics to result
    // ✅ runQueued 成功时返回 { result: T, metrics: GatewayMetrics }
    // ✅ 如果 fn 内部 throw，runQueued 会 reject，不会返回 error object（会走到 catch 块）
    // ✅ 所以这里只需要处理成功的情况
    if (result && typeof result === 'object' && 'ok' in result && result.ok === true) {
      return {
        ...result,
        metrics: {
          queuedMs: metrics.queuedMs,
          dedupHit: metrics.dedupHit,
          totalMs,
        },
      } as AIResult<z.infer<T>>;
    }
    
    // Fallback: 如果 result 结构不符合预期（理论上不应该发生）
    return {
      ok: false,
      type: 'PROVIDER',
      message: 'Unexpected result structure from queue',
      metrics: {
        queuedMs: metrics.queuedMs,
        dedupHit: metrics.dedupHit,
        totalMs,
      },
    };
  } catch (err) {
    const totalMs = Date.now() - queueStartMs;

    // 默认值（理论上很少用到）
    let queuedMs = Math.max(0, totalMs - 1000);
    let dedupHit = false;

    // ✅ 如果是队列包装错误，拿到真实 metrics
    let error = err;
    if (isGatewayQueueError(err)) {
      queuedMs = err.metrics.queuedMs;
      dedupHit = err.metrics.dedupHit;
      error = err.error;
    }

    const errorObj = error as { type?: string; message?: string; cooldownSeconds?: number; raw?: string };

    if (errorObj && typeof errorObj === 'object' && 'type' in errorObj) {
      const errorType = errorObj.type as AIErrorType;
      return {
        ok: false,
        type: errorType,
        message: errorObj.message || 'Unknown error',
        cooldownSeconds: errorObj.cooldownSeconds,
        raw: errorObj.raw,
        metrics: { queuedMs, dedupHit, totalMs },
      };
    }

    logError('❌ [LLM Gateway] Unexpected error from runQueued', { error });
    return {
      ok: false,
      type: 'PROVIDER',
      message: `AI 服务错误: ${error instanceof Error ? error.message : String(error)}`,
      raw: error instanceof Error ? error.message : String(error),
      metrics: { queuedMs, dedupHit, totalMs },
    };
  }
}
