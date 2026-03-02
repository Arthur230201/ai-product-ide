/**
 * OpenAI Client Helper
 * 
 * Provides a reusable OpenAI client with extended timeouts for long-running requests.
 * Uses undici Agent to handle headersTimeout and bodyTimeout at the HTTP layer.
 */

import { createOpenAI } from '@ai-sdk/openai';
import { Agent } from 'undici';
import { ensureOpenAIKey } from '@/lib/ai-config';
import { log, logError } from './logger';

/**
 * Singleton undici Agent with extended timeouts
 * 
 * - headersTimeout: 10 minutes (600_000ms) - time to wait for response headers
 * - bodyTimeout: 10 minutes (600_000ms) - time to wait for response body
 * 
 * These timeouts are separate from the AbortController timeout which bounds total duration.
 */
let undiciAgent: Agent | null = null;

function getUndiciAgent(): Agent {
  if (!undiciAgent) {
    undiciAgent = new Agent({
      headersTimeout: 600_000, // 10 minutes
      bodyTimeout: 600_000, // 10 minutes
    });
  }
  return undiciAgent;
}

/**
 * Track request attempts for better error logging
 */
interface RequestContext {
  attemptNumber?: number;
  startTime: number;
  requestId: string;
}

const requestContexts = new Map<string, RequestContext>();

/**
 * Get custom fetch function with undici Agent for extended timeouts
 * This is used internally by getOpenAIClient and can be reused
 * 
 * NOTE: Cooldown gate is handled by llm.ts, not here.
 * This layer only handles transport-level concerns (timeout, network retry).
 */
function getCustomFetch() {
  return async (url: string | URL | Request, options?: RequestInit) => {
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    let attemptCount = 0;
    
    // CRITICAL: Respect options.signal from llm.ts (do not override)
    // If options.signal exists, use it; otherwise create a fallback controller for undici timeouts
    const externalSignal = options?.signal;
    const fallbackController = externalSignal ? null : new AbortController();
    const signalToUse = externalSignal || fallbackController!.signal;
    
    attemptCount++;
    
    // Store request context for error logging
    requestContexts.set(requestId, {
      startTime,
      requestId,
      attemptNumber: attemptCount,
    });

    // Only set fallback timeout if we created our own controller
    // If external signal exists, llm.ts controls the timeout
    let timeoutId: NodeJS.Timeout | null = null;
    if (!externalSignal && fallbackController) {
      // Fallback timeout: 5 minutes (only used if no external signal)
      const ABORT_TIMEOUT_MS = 300_000; // 5 minutes
      timeoutId = setTimeout(() => {
        fallbackController.abort();
        const elapsed = Date.now() - startTime;
        const context = requestContexts.get(requestId);
        logError('⏱️ [OpenAI Client] Fallback AbortController 超时', {
          requestId,
          elapsedMs: elapsed,
          timeoutMs: ABORT_TIMEOUT_MS,
          attemptNumber: context?.attemptNumber,
        });
        requestContexts.delete(requestId);
      }, ABORT_TIMEOUT_MS);
    }

    try {
      // Get undici Agent with extended timeouts
      const agent = getUndiciAgent();

      // Make request with undici Agent as dispatcher
      // CRITICAL: Use signalToUse (respects external signal from llm.ts)
      // Note: dispatcher is a Node.js/undici-specific option
      const fetchOptions: RequestInit & { dispatcher?: Agent } = {
        ...options,
        signal: signalToUse, // Respect external signal, don't override
        dispatcher: agent,
      };
      
      // Track attempt for retry logic
      const context = requestContexts.get(requestId);
      if (context) {
        context.attemptNumber = (context.attemptNumber || 0) + 1;
      }
      
      const response = await fetch(url, fetchOptions);

      // Check for 429 Rate Limit - pass through to llm.ts for handling
      // llm.ts is the single source of truth for cooldown gate
      if (response.status === 429) {
        if (timeoutId) clearTimeout(timeoutId);
        const elapsed = Date.now() - startTime;
        
        // Extract Retry-After header for llm.ts to use
        const retryAfter = response.headers.get('retry-after') || 
                          response.headers.get('Retry-After');
        let cooldownSeconds = 10; // Default
        if (retryAfter) {
          const parsed = parseInt(retryAfter, 10);
          if (!isNaN(parsed) && parsed > 0) {
            cooldownSeconds = parsed;
          }
        }
        
        logError('🚫 [OpenAI Client] 429 Rate Limit detected (will be handled by llm.ts)', {
          requestId,
          elapsedMs: elapsed,
          cooldownSeconds,
          retryAfter: retryAfter || 'not provided',
        });
        
        // Throw error with cooldown info - llm.ts will catch and handle
        const rateLimitError = new Error('Rate limit exceeded') as Error & {
          statusCode?: number;
          cooldownSeconds?: number;
        };
        rateLimitError.statusCode = 429;
        rateLimitError.cooldownSeconds = cooldownSeconds;
        requestContexts.delete(requestId);
        throw rateLimitError;
      }

      if (timeoutId) clearTimeout(timeoutId);
      requestContexts.delete(requestId);
      return response;
    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId);
      const elapsed = Date.now() - startTime;
      const context = requestContexts.get(requestId);
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Determine timeout type
      const isHeadersTimeout = errorMessage.includes('headersTimeout') || 
                               errorMessage.includes('Headers Timeout');
      const isAbortTimeout = errorMessage.includes('aborted') || 
                            errorMessage.includes('AbortError');
      const isBodyTimeout = errorMessage.includes('bodyTimeout');

      // 检测网络错误类型
      const isNetworkError = 
        errorMessage.includes('fetch failed') ||
        errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes('ENOTFOUND') ||
        errorMessage.includes('ETIMEDOUT') ||
        errorMessage.includes('network') ||
        errorMessage.includes('NetworkError') ||
        (error && typeof error === 'object' && 'cause' in error && 
         error.cause && typeof error.cause === 'object' &&
         ('code' in error.cause || 'errno' in error.cause));

      // 提取错误详情
      const errorDetails: any = {
        requestId,
        elapsedMs: elapsed,
        error: errorMessage,
        attemptNumber: context?.attemptNumber,
        url: typeof url === 'string' ? url : url.toString(),
      };
      
      // 如果是 Error 对象，提取更多信息
      if (error instanceof Error) {
        errorDetails.stack = error.stack;
        if ('cause' in error && error.cause) {
          errorDetails.cause = error.cause;
          if (typeof error.cause === 'object' && error.cause !== null) {
            if ('code' in error.cause) errorDetails.errorCode = error.cause.code;
            if ('errno' in error.cause) errorDetails.errno = error.cause.errno;
          }
        }
      }

      if (isHeadersTimeout || isBodyTimeout || isAbortTimeout) {
        logError('⏱️ [OpenAI Client] 请求超时', {
          ...errorDetails,
          timeoutType: isHeadersTimeout ? 'headersTimeout' : 
                      isBodyTimeout ? 'bodyTimeout' : 
                      'abort',
        });
      } else if (isNetworkError) {
        const errorCode = errorDetails.errorCode || 'UNKNOWN';
        logError('🌐 [OpenAI Client] 网络连接失败', {
          ...errorDetails,
          errorCode,
          suggestion: '请检查：1. 网络连接 2. API 服务器状态 3. 防火墙/代理设置',
        });
      } else {
        logError('❌ [OpenAI Client] 请求失败', errorDetails);
      }

      // Network error retry logic (max 1 retry with jitter)
      if (isNetworkError) {
        const context = requestContexts.get(requestId);
        const attemptNumber = context?.attemptNumber || 0;
        
        if (attemptNumber < 2) {
          // First attempt failed, retry once with jitter
          const jitterDelay = 200 + Math.floor(Math.random() * 400); // 200-600ms
          log('🔄 [OpenAI Client] Network error, retrying with jitter', {
            requestId,
            attemptNumber,
            jitterDelayMs: jitterDelay,
            elapsedMs: elapsed,
          });
          
          // Wait with jitter
          await new Promise(resolve => setTimeout(resolve, jitterDelay));
          
          try {
            // Retry the request
            const agent = getUndiciAgent();
            const fetchOptions: RequestInit & { dispatcher?: Agent } = {
              ...options,
              signal: signalToUse, // Use same signal as original request
              dispatcher: agent,
            };
            
            if (context) {
              context.attemptNumber = attemptNumber + 1;
            }
            
            const retryResponse = await fetch(url, fetchOptions);
            if (timeoutId) clearTimeout(timeoutId);
            requestContexts.delete(requestId);
            return retryResponse;
          } catch (retryError) {
            const totalElapsed = Date.now() - startTime;
            logError('🌐 [OpenAI Client] Network retry failed', {
              requestId,
              totalElapsedMs: totalElapsed,
              retryAttempt: attemptNumber + 1,
            });
            
            // Throw network error - llm.ts will catch and wrap
            const networkError = new Error('Network error after retry');
            requestContexts.delete(requestId);
            throw networkError;
          }
        } else {
          // Already retried, fail fast
          const networkError = new Error('Network error');
          requestContexts.delete(requestId);
          throw networkError;
        }
      }
      
      requestContexts.delete(requestId);
      throw error;
    }
  };
}

/**
 * Get OpenAI client with custom fetch that uses undici Agent
 * 
 * Supports OPENAI_BASE_URL for OpenAI-compatible proxies (e.g., reelxai.com, llmxapi.com).
 * Base URL should end with /v1 (e.g., https://reelxai.com/v1).
 * 
 * @param aiConfig - Optional AI configuration (for future use)
 * @returns OpenAI client instance (createOpenAI result)
 */
export function getOpenAIClient(aiConfig?: { textModel?: string; visionModel?: string }) {
  const apiKey = ensureOpenAIKey();
  const config: Parameters<typeof createOpenAI>[0] = {
    apiKey,
    fetch: getCustomFetch(),
  };

  // 使用自定义 baseURL（支持 reelxai.com、llmxapi.com 等 OpenAI 兼容代理）
  const baseURL = process.env.OPENAI_BASE_URL?.trim();
  if (baseURL) {
    config.baseURL = baseURL.endsWith('/v1') ? baseURL : `${baseURL.replace(/\/$/, '')}/v1`;
  }

  return createOpenAI(config);
}

/**
 * Get OpenAI provider instance (for use with generateObject, etc.)
 * This is a convenience function that returns the provider function directly
 * 
 * @param aiConfig - Optional AI configuration (for future use)
 * @returns OpenAI provider function compatible with @ai-sdk/openai's `openai` export
 */
export function getOpenAIProvider(aiConfig?: { textModel?: string; visionModel?: string }) {
  const client = getOpenAIClient(aiConfig);
  // Return a function that creates model instances (same signature as openai from @ai-sdk/openai)
  return (modelId: string) => client(modelId);
}
