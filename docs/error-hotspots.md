# Error Hotspots 分析

生成时间: 2026-03-18T10:13:41.725Z

## 429 / Rate Limit 错误处理

共找到 241 处：

1. **app/actions/generate-graph.ts:606**
   - 匹配: `429`
   - 上下文: `generateGraph] t2_end: LLM call completed', {
      requestId,
      elapsedMs: t2_end - t2,
      success: aiCallSuccess,
      errorType: aiError?.t...`

2. **app/actions/generate-graph.ts:618**
   - 匹配: `429`
   - 上下文: `       const t2_end = Date.now();
        return {
          type: 'rate_limit',
          message: aiError.message,
          cooldownSeconds: aiErro...`

3. **app/actions/generate-graph.ts:540**
   - 匹配: `RATE_LIMIT`
   - 上下文: ` GraphResultSchema），从源头保证可解析，不做补丁解析
    const t2 = Date.now();
    let singleCallResult: z.infer<typeof SingleCallResultSchema> | null = null;
    let...`

4. **app/actions/generate-graph.ts:575**
   - 匹配: `RATE_LIMIT`
   - 上下文: `        errorMessage: llmResult.message,
        llmMetrics,
      });
      aiError = {
        type: llmResult.type,
        message: llmResult.mess...`

5. **app/actions/generate-graph.ts:608**
   - 匹配: `Rate Limit`
   - 上下文: `   elapsedMs: t2_end - t2,
      success: aiCallSuccess,
      errorType: aiError?.type,
      llmMetrics,
    });

    // 如果 AI 调用失败（429/网络错误/解析错误/超时...`

6. **app/actions/generate-graph.ts:609**
   - 匹配: `RATE_LIMIT`
   - 上下文: `
      errorType: aiError?.type,
      llmMetrics,
    });

    // 如果 AI 调用失败（429/网络错误/解析错误/超时）
    if (!aiCallSuccess && aiError) {
      // ✅ Rate L...`

7. **app/actions/generate-graph.ts:612**
   - 匹配: `rate_limit`
   - 上下文: `错误/解析错误/超时）
    if (!aiCallSuccess && aiError) {
      // ✅ Rate Limit 错误：直接返回错误，不使用降级图
      if (aiError.type === 'RATE_LIMIT') {
        const t2_en...`

8. **app/actions/generate-graph.ts:462**
   - 匹配: `cooldown`
   - 上下文: `ation',
    mode: 'clarification',
  });

  if (!result.ok) {
    // Return error union instead of throwing
    return {
      ok: false,
      type: ...`

9. **app/actions/generate-graph.ts:462**
   - 匹配: `cooldown`
   - 上下文: `fication',
  });

  if (!result.ok) {
    // Return error union instead of throwing
    return {
      ok: false,
      type: result.type,
      messa...`

10. **app/actions/generate-graph.ts:540**
   - 匹配: `cooldown`
   - 上下文: `  let singleCallResult: z.infer<typeof SingleCallResultSchema> | null = null;
    let aiCallSuccess = false;
    let aiError: { type: 'RATE_LIMIT' | '...`

11. **app/actions/generate-graph.ts:575**
   - 匹配: `cooldown`
   - 上下文: `,
        errorType: llmResult.type,
        errorMessage: llmResult.message,
        llmMetrics,
      });
      aiError = {
        type: llmResult....`

12. **app/actions/generate-graph.ts:575**
   - 匹配: `cooldown`
   - 上下文: `mResult.message,
        llmMetrics,
      });
      aiError = {
        type: llmResult.type,
        message: llmResult.message,
        cooldownSec...`

13. **app/actions/generate-graph.ts:614**
   - 匹配: `cooldown`
   - 上下文: ` Rate Limit 错误：直接返回错误，不使用降级图
      if (aiError.type === 'RATE_LIMIT') {
        const t2_end = Date.now();
        return {
          type: 'rate_limi...`

14. **app/actions/generate-graph.ts:614**
   - 匹配: `cooldown`
   - 上下文: `降级图
      if (aiError.type === 'RATE_LIMIT') {
        const t2_end = Date.now();
        return {
          type: 'rate_limit',
          message: ai...`

15. **app/actions/node-operations.ts:42**
   - 匹配: `rate_limit`
   - 上下文: `le' | 'desktop';
      /** 智能推荐成功时返回，供客户端持久化后锁定复用 */
      designSystemSnapshot?: DesignSystemSnapshot;
    }
  | { type: 'skeleton'; code: string; re...`

16. **app/actions/node-operations.ts:345**
   - 匹配: `RATE_LIMIT`
   - 上下文: `ge,
      metrics: { queuedMs: 0, dedupHit: false, totalMs: 0 },
    };
  }
}

export type ReverseGenerateSpecResult = 
  | { ok: true; title: string;...`

17. **app/actions/node-operations.ts:1118**
   - 匹配: `RATE_LIMIT`
   - 上下文: `     model: visionModel,
          errorType: result.type,
          elapsedMs: apiDuration,
            });
        
        // Map AIResult error ty...`

18. **app/actions/node-operations.ts:1120**
   - 匹配: `rate_limit`
   - 上下文: `,
          elapsedMs: apiDuration,
            });
        
        // Map AIResult error types to return format
        if (result.type === 'RATE_LI...`

19. **app/actions/node-operations.ts:1460**
   - 匹配: `RATE_LIMIT`
   - 上下文: `
          model: textModel,
          errorType: result.type,
          elapsedMs: apiDuration,
        });
        
        // Map AIResult error ty...`

20. **app/actions/node-operations.ts:1462**
   - 匹配: `rate_limit`
   - 上下文: `ult.type,
          elapsedMs: apiDuration,
        });
        
        // Map AIResult error types to return format
        if (result.type === 'RAT...`

21. **app/actions/node-operations.ts:1821**
   - 匹配: `RATE_LIMIT`
   - 上下文: `rPrompt}`,
        temperature: 0.5,
        actionName: 'generateAnalysisFromCode',
        aiConfig: input.aiConfig,
      });

      if (!result.ok...`

22. **app/actions/node-operations.ts:42**
   - 匹配: `cooldown`
   - 上下文: `p';
      /** 智能推荐成功时返回，供客户端持久化后锁定复用 */
      designSystemSnapshot?: DesignSystemSnapshot;
    }
  | { type: 'skeleton'; code: string; requestId?: str...`

23. **app/actions/node-operations.ts:345**
   - 匹配: `cooldown`
   - 上下文: `    };
  }
}

export type ReverseGenerateSpecResult = 
  | { ok: true; title: string; requirements: string[] }
  | { ok: false; type: 'RATE_LIMIT' | '...`

24. **app/actions/node-operations.ts:1121**
   - 匹配: `cooldown`
   - 上下文: `,
            });
        
        // Map AIResult error types to return format
        if (result.type === 'RATE_LIMIT') {
            return {
     ...`

25. **app/actions/node-operations.ts:1121**
   - 匹配: `cooldown`
   - 上下文: `  
        // Map AIResult error types to return format
        if (result.type === 'RATE_LIMIT') {
            return {
              type: 'rate_lim...`

26. **app/actions/node-operations.ts:1463**
   - 匹配: `cooldown`
   - 上下文: `Duration,
        });
        
        // Map AIResult error types to return format
        if (result.type === 'RATE_LIMIT') {
          return {
   ...`

27. **app/actions/node-operations.ts:1463**
   - 匹配: `cooldown`
   - 上下文: `      
        // Map AIResult error types to return format
        if (result.type === 'RATE_LIMIT') {
          return {
            type: 'rate_lim...`

28. **app/actions/node-operations.ts:1822**
   - 匹配: `cooldown`
   - 上下文: `  actionName: 'generateAnalysisFromCode',
        aiConfig: input.aiConfig,
      });

      if (!result.ok) {
        const errorMessage = result.typ...`

29. **app/actions/ui-pipeline-response.test.ts:61**
   - 匹配: `RATE_LIMIT`
   - 上下文: `rue);
  assertEqual(result.type, 'UI_HTML');
});

test('normalizeUIPipelineResponse: already valid UIPipelineResponse (error)', () => {
  const valid:...`

30. **app/actions/ui-pipeline-response.test.ts:70**
   - 匹配: `RATE_LIMIT`
   - 上下文: `s',
    cooldownSeconds: 10,
    retryable: true,
  };

  const result = normalizeUIPipelineResponse(valid);
  assertEqual(result, valid);
  assertEqu...`

31. **app/actions/ui-pipeline-response.test.ts:112**
   - 匹配: `Rate limit`
   - 上下文: `lt.message, 'Network error');
    assertEqual(result.retryable, true);
  }
});

test('normalizeUIPipelineResponse: zsa-react tuple [undefined, Error] ...`

32. **app/actions/ui-pipeline-response.test.ts:118**
   - 匹配: `RATE_LIMIT`
   - 上下文: `s any).cooldownSeconds = 15;
  const tuple: [undefined, Error] = [undefined, error];
  const result = normalizeUIPipelineResponse(tuple);

  assertEqu...`

33. **app/actions/ui-pipeline-response.test.ts:120**
   - 匹配: `Rate limit`
   - 上下文: `ndefined, error];
  const result = normalizeUIPipelineResponse(tuple);

  assertEqual(result.ok, false);
  assertEqual(result.type, 'RATE_LIMIT');
  i...`

34. **app/actions/ui-pipeline-response.test.ts:62**
   - 匹配: `Too many requests`
   - 上下文: `type, 'UI_HTML');
});

test('normalizeUIPipelineResponse: already valid UIPipelineResponse (error)', () => {
  const valid: UIPipelineResponse = {
   ...`

35. **app/actions/ui-pipeline-response.test.ts:63**
   - 匹配: `cooldown`
   - 上下文: `est('normalizeUIPipelineResponse: already valid UIPipelineResponse (error)', () => {
  const valid: UIPipelineResponse = {
    ok: false,
    type: 'R...`

36. **app/actions/ui-pipeline-response.test.ts:113**
   - 匹配: `cooldown`
   - 上下文: `Equal(result.retryable, true);
  }
});

test('normalizeUIPipelineResponse: zsa-react tuple [undefined, Error] (error case)', () => {
  const error = n...`

37. **app/actions/ui-pipeline-response.test.ts:121**
   - 匹配: `cooldown`
   - 上下文: `PipelineResponse(tuple);

  assertEqual(result.ok, false);
  assertEqual(result.type, 'RATE_LIMIT');
  if (!result.ok) {
    assertEqual(result.messag...`

38. **app/actions/ui-pipeline-response.ts:28**
   - 匹配: `RATE_LIMIT`
   - 上下文: `ineResponse =
  | {
      ok: true;
      type: 'UI_HTML';
      stage: UIPipelineStage;
      html: string;
      meta: HTMLMeta;
      warnings?: st...`

39. **app/actions/ui-pipeline-response.ts:42**
   - 匹配: `RATE_LIMIT`
   - 上下文: `lse; type: string; message: string; cooldownSeconds?: number }>(
  aiResult: T,
  stage: UIPipelineStage
): UIPipelineResponse {
  // Map AI error typ...`

40. **app/actions/ui-pipeline-response.ts:47**
   - 匹配: `RATE_LIMIT`
   - 上下文: `or types
  let pipelineType: 'RATE_LIMIT' | 'NETWORK' | 'PROVIDER' | 'PARSE' | 'VALIDATION' = 'PROVIDER';
  let retryable = true;

  if ('type' in aiR...`

41. **app/actions/ui-pipeline-response.ts:48**
   - 匹配: `RATE_LIMIT`
   - 上下文: `MIT' | 'NETWORK' | 'PROVIDER' | 'PARSE' | 'VALIDATION' = 'PROVIDER';
  let retryable = true;

  if ('type' in aiResult) {
    switch (aiResult.type) {...`

42. **app/actions/ui-pipeline-response.ts:92**
   - 匹配: `RATE_LIMIT`
   - 上下文: `id UIPipelineResponse
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    // Check if it's already in the correct format
    if ('ok' i...`

43. **app/actions/ui-pipeline-response.ts:113**
   - 匹配: `RATE_LIMIT`
   - 上下文: `// Try to extract cooldown from error if available
      const cooldownSeconds = (error as any)?.cooldownSeconds;
      
      // Determine error type...`

44. **app/actions/ui-pipeline-response.ts:115**
   - 匹配: `RATE_LIMIT`
   - 上下文: `: 'RATE_LIMIT' | 'NETWORK' | 'PROVIDER' | 'PARSE' | 'VALIDATION' = 'PROVIDER';
      if (errorMessage.toLowerCase().includes('rate') || errorMessage.t...`

45. **app/actions/ui-pipeline-response.ts:125**
   - 匹配: `RATE_LIMIT`
   - 上下文: `se().includes('fetch')) {
        type = 'NETWORK';
      }
      
      return {
        ok: false,
        type,
        message: errorMessage,
    ...`

46. **app/actions/ui-pipeline-response.ts:30**
   - 匹配: `cooldown`
   - 上下文: `   html: string;
      meta: HTMLMeta;
      warnings?: string[];
    }
  | {
      ok: false;
      type: 'RATE_LIMIT' | 'NETWORK' | 'PROVIDER' | 'PA...`

47. **app/actions/ui-pipeline-response.ts:37**
   - 匹配: `cooldown`
   - 上下文: `      retryable: boolean;
    };

/**
 * Map AIResult to UIPipelineResponse (error case only)
 */
export function mapAIResultToUIPipelineResponse<T ex...`

48. **app/actions/ui-pipeline-response.ts:73**
   - 匹配: `cooldown`
   - 上下文: ` break;
      default:
        pipelineType = 'PROVIDER';
        retryable = false;
    }
  }

  return {
    ok: false,
    type: pipelineType,
    ...`

49. **app/actions/ui-pipeline-response.ts:73**
   - 匹配: `cooldown`
   - 上下文: `     pipelineType = 'PROVIDER';
        retryable = false;
    }
  }

  return {
    ok: false,
    type: pipelineType,
    message: aiResult.message ...`

50. **app/actions/ui-pipeline-response.ts:109**
   - 匹配: `cooldown`
   - 上下文: `aw;
    
    // If there's an error in the tuple, convert to error response
    if (error) {
      const errorMessage = error instanceof Error ? error...`

51. **app/actions/ui-pipeline-response.ts:110**
   - 匹配: `cooldown`
   - 上下文: `ple, convert to error response
    if (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      // Try to ext...`

52. **app/actions/ui-pipeline-response.ts:110**
   - 匹配: `cooldown`
   - 上下文: ` if (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      // Try to extract cooldown from error if availa...`

53. **app/actions/ui-pipeline-response.ts:124**
   - 匹配: `cooldown`
   - 上下文: `.includes('network') || errorMessage.toLowerCase().includes('fetch')) {
        type = 'NETWORK';
      }
      
      return {
        ok: false,
   ...`

54. **components/canvas/CommandBar.tsx:647**
   - 匹配: `429`
   - 上下文: `out') || error.message.includes('TIMEOUT')) {
          errorMessage = '请求超时，请检查网络连接';
        } else if (error.message.includes('quota') || error.mes...`

55. **components/canvas/CommandBar.tsx:1082**
   - 匹配: `429`
   - 上下文: `EOUT')) {
          errorMessage = '⏱️ 请求超时\n\n请检查网络连接，或稍后重试\n\n提示：可以尝试简化输入内容或减少附件大小';
        } else if (error.message.includes('quota') || error.mes...`

56. **components/canvas/CommandBar.tsx:2121**
   - 匹配: `rate_limit`
   - 上下文: `// Handle typed response
            if (uiResult && typeof uiResult === 'object' && 'type' in uiResult) {
              const response = uiResult;
  ...`

57. **components/canvas/CommandBar.tsx:3161**
   - 匹配: `rate_limit`
   - 上下文: `         
          const response = uiResult as UIGenerationResponse;
          
          // Handle all response types using discriminated union
   ...`

58. **components/canvas/CommandBar.tsx:2123**
   - 匹配: `cooldown`
   - 上下文: `sult) {
              const response = uiResult;
              
              if (response.type === 'rate_limit') {
                toast.error('请求过多'...`

59. **components/canvas/CommandBar.tsx:3163**
   - 匹配: `cooldown`
   - 上下文: `Handle all response types using discriminated union
          switch (response.type) {
            case 'rate_limit': {
              toast.error('请求过...`

60. **components/canvas/CommandBar.tsx:3164**
   - 匹配: `cooldown`
   - 上下文: ` (response.type) {
            case 'rate_limit': {
              toast.error('请求过多', {
                description: `请在 ${response.cooldownSeconds} 秒...`

61. **components/canvas/EditMode.tsx:120**
   - 匹配: `Retry after`
   - 上下文: `// Wait for iframe to load
    const checkIframeReady = () => {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    ...`

62. **lib/ai/llm.ts:7**
   - 匹配: `429`
   - 上下文: `/**
 * Unified LLM Gateway
 * 
 * Single entry point for all AI calls.
 * - maxRetries: 0 (no SDK retries)
 * - AbortSignal timeout for fast-fail
 * -...`

63. **lib/ai/llm.ts:50**
   - 匹配: `429`
   - 上下文: `((rateLimitUntilMs - now) / 1000);
    return { blocked: true, cooldownSeconds: remainingSeconds };
  }
  return { blocked: false, cooldownSeconds: 0 ...`

64. **lib/ai/llm.ts:91**
   - 匹配: `429`
   - 上下文: `rror: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const errorMessage = error instanceof Error ? error.message : Str...`

65. **lib/ai/llm.ts:94**
   - 匹配: `429`
   - 上下文: `Message.includes('429') ||
    errorMessage.includes('Too Many Requests') ||
    errorMessage.includes('rate limit') ||
    ('statusCode' in error && ...`

66. **lib/ai/llm.ts:95**
   - 匹配: `429`
   - 上下文: `
    errorMessage.includes('rate limit') ||
    ('statusCode' in error && (error as { statusCode: unknown }).statusCode === 429) ||
    ('status' in e...`

67. **lib/ai/llm.ts:314**
   - 匹配: `429`
   - 上下文: `ionName: actionName || 'unknown',
        });
        throw {
          type: 'PROVIDER',
          message: `请求超时（${timeoutMs}ms）`,
          raw: ''...`

68. **lib/ai/llm.ts:589**
   - 匹配: `429`
   - 上下文: `ionName: actionName || 'unknown',
        });
        throw {
          type: 'PROVIDER',
          message: `请求超时（${timeoutMs}ms）`,
          raw: ''...`

69. **lib/ai/llm.ts:20**
   - 匹配: `rate_limit`
   - 上下文: `eue';
import { shouldUseMock, mockCallText, mockCallObject } from './llm-mock';
import type { CoreMessage } from 'ai';
import type { z } from 'zod';

...`

70. **lib/ai/llm.ts:22**
   - 匹配: `RATE_LIMIT`
   - 上下文: ` './llm-mock';
import type { CoreMessage } from 'ai';
import type { z } from 'zod';

/**
 * AI Error Type (统一错误类型)
 * 全项目只使用这套类型，不再出现 'rate_limit'/'ne...`

71. **lib/ai/llm.ts:33**
   - 匹配: `rate limit`
   - 上下文: `an; totalMs: number } }
  | { ok: false; type: AIErrorType; message: string; cooldownSeconds?: number; raw?: string; metrics: { queuedMs: number; dedu...`

72. **lib/ai/llm.ts:35**
   - 匹配: `rateLimit`
   - 上下文: `: AIErrorType; message: string; cooldownSeconds?: number; raw?: string; metrics: { queuedMs: number; dedupHit: boolean; totalMs: number } };

/**
 * L...`

73. **lib/ai/llm.ts:38**
   - 匹配: `rate limit`
   - 上下文: `nSeconds?: number; raw?: string; metrics: { queuedMs: number; dedupHit: boolean; totalMs: number } };

/**
 * Local rate limit cooldown gate (in-memor...`

74. **lib/ai/llm.ts:42**
   - 匹配: `rateLimit`
   - 上下文: `/
let rateLimitUntilMs = 0;

/**
 * Check if rate limit cooldown gate is active
 */
function checkCooldownGate(): { blocked: boolean; cooldownSeconds:...`

75. **lib/ai/llm.ts:43**
   - 匹配: `rateLimit`
   - 上下文: `down gate is active
 */
function checkCooldownGate(): { blocked: boolean; cooldownSeconds: number } {
  const now = Date.now();
  if (now < rateLimitU...`

76. **lib/ai/llm.ts:53**
   - 匹配: `rateLimit`
   - 上下文: `Seconds: remainingSeconds };
  }
  return { blocked: false, cooldownSeconds: 0 };
}

/**
 * Update cooldown gate after receiving 429
 */
function upda...`

77. **lib/ai/llm.ts:56**
   - 匹配: `rateLimit`
   - 上下文: `ction updateCooldownGate(cooldownSeconds: number): void {
  rateLimitUntilMs = Date.now() + cooldownSeconds * 1000;
  log('🚫 [LLM Gateway] Cooldown g...`

78. **lib/ai/llm.ts:85**
   - 匹配: `rate limit`
   - 上下文: `cooldownSeconds: unknown }).cooldownSeconds === 'number') {
      return (error as { cooldownSeconds: number }).cooldownSeconds;
    }
  }
  return 10...`

79. **lib/ai/llm.ts:87**
   - 匹配: `RateLimit`
   - 上下文: `downSeconds === 'number') {
      return (error as { cooldownSeconds: number }).cooldownSeconds;
    }
  }
  return 10; // Default cooldown
}

/**
 * ...`

80. **lib/ai/llm.ts:93**
   - 匹配: `rate limit`
   - 上下文: `onst errorMessage = error instanceof Error ? error.message : String(error);
  return (
    errorMessage.includes('429') ||
    errorMessage.includes('...`

81. **lib/ai/llm.ts:96**
   - 匹配: `rate_limit`
   - 上下文: `&& (error as { statusCode: unknown }).statusCode === 429) ||
    ('status' in error && (error as { status: unknown }).status === 429) ||
    ('type' i...`

82. **lib/ai/llm.ts:204**
   - 匹配: `RATE_LIMIT`
   - 上下文: `eck.blocked) {
    log('🚫 [LLM Gateway] Request blocked by cooldown gate', {
      requestId,
      cooldownSeconds: cooldownCheck.cooldownSeconds,
 ...`

83. **lib/ai/llm.ts:314**
   - 匹配: `rate limit`
   - 上下文: `         actionName: actionName || 'unknown',
        });
        throw {
          type: 'PROVIDER',
          message: `请求超时（${timeoutMs}ms）`,
     ...`

84. **lib/ai/llm.ts:315**
   - 匹配: `RateLimit`
   - 上下文: `   });
        throw {
          type: 'PROVIDER',
          message: `请求超时（${timeoutMs}ms）`,
          raw: '',
        };
      }

      // Handle r...`

85. **lib/ai/llm.ts:319**
   - 匹配: `Rate limit`
   - 上下文: `yped error
      if (isRateLimitError(error)) {
        const cooldownSeconds = extractCooldownSeconds(error);
        updateCooldownGate(cooldownSeco...`

86. **lib/ai/llm.ts:327**
   - 匹配: `RATE_LIMIT`
   - 上下文: `   logError('🚫 [LLM Gateway] Rate limit error', {
          requestId,
          model,
          cooldownSeconds,
          elapsedMs: elapsed,
    ...`

87. **lib/ai/llm.ts:490**
   - 匹配: `RATE_LIMIT`
   - 上下文: `eck.blocked) {
    log('🚫 [LLM Gateway] Request blocked by cooldown gate', {
      requestId,
      cooldownSeconds: cooldownCheck.cooldownSeconds,
 ...`

88. **lib/ai/llm.ts:589**
   - 匹配: `rate limit`
   - 上下文: `         actionName: actionName || 'unknown',
        });
        throw {
          type: 'PROVIDER',
          message: `请求超时（${timeoutMs}ms）`,
     ...`

89. **lib/ai/llm.ts:590**
   - 匹配: `RateLimit`
   - 上下文: `   });
        throw {
          type: 'PROVIDER',
          message: `请求超时（${timeoutMs}ms）`,
          raw: '',
        };
      }

      // Handle r...`

90. **lib/ai/llm.ts:594**
   - 匹配: `Rate limit`
   - 上下文: `yped error
      if (isRateLimitError(error)) {
        const cooldownSeconds = extractCooldownSeconds(error);
        updateCooldownGate(cooldownSeco...`

91. **lib/ai/llm.ts:602**
   - 匹配: `RATE_LIMIT`
   - 上下文: `   logError('🚫 [LLM Gateway] Rate limit error', {
          requestId,
          model,
          cooldownSeconds,
          elapsedMs: elapsed,
    ...`

92. **lib/ai/llm.ts:92**
   - 匹配: `Too Many Requests`
   - 上下文: `or || typeof error !== 'object') return false;
  const errorMessage = error instanceof Error ? error.message : String(error);
  return (
    errorMess...`

93. **lib/ai/llm.ts:7**
   - 匹配: `cooldown`
   - 上下文: `/**
 * Unified LLM Gateway
 * 
 * Single entry point for all AI calls.
 * - maxRetries: 0 (no SDK retries)
 * - AbortSignal timeout for fast-fail
 * -...`

94. **lib/ai/llm.ts:30**
   - 匹配: `cooldown`
   - 上下文: `LM 调用返回类型
 */
export type AIResult<T> =
  | { ok: true; data: T; raw?: string; metrics: { queuedMs: number; dedupHit: boolean; totalMs: number } }
  |...`

95. **lib/ai/llm.ts:33**
   - 匹配: `cooldown`
   - 上下文: `: number } }
  | { ok: false; type: AIErrorType; message: string; cooldownSeconds?: number; raw?: string; metrics: { queuedMs: number; dedupHit: boole...`

96. **lib/ai/llm.ts:38**
   - 匹配: `cooldown`
   - 上下文: `number; raw?: string; metrics: { queuedMs: number; dedupHit: boolean; totalMs: number } };

/**
 * Local rate limit cooldown gate (in-memory)
 */
let ...`

97. **lib/ai/llm.ts:40**
   - 匹配: `Cooldown`
   - 上下文: ` number; dedupHit: boolean; totalMs: number } };

/**
 * Local rate limit cooldown gate (in-memory)
 */
let rateLimitUntilMs = 0;

/**
 * Check if rat...`

98. **lib/ai/llm.ts:40**
   - 匹配: `cooldown`
   - 上下文: ` number } };

/**
 * Local rate limit cooldown gate (in-memory)
 */
let rateLimitUntilMs = 0;

/**
 * Check if rate limit cooldown gate is active
 */
...`

99. **lib/ai/llm.ts:44**
   - 匹配: `cooldown`
   - 上下文: `ed: boolean; cooldownSeconds: number } {
  const now = Date.now();
  if (now < rateLimitUntilMs) {
    const remainingSeconds = Math.ceil((rateLimitUn...`

100. **lib/ai/llm.ts:46**
   - 匹配: `cooldown`
   - 上下文: ` if (now < rateLimitUntilMs) {
    const remainingSeconds = Math.ceil((rateLimitUntilMs - now) / 1000);
    return { blocked: true, cooldownSeconds: r...`

101. **lib/ai/llm.ts:50**
   - 匹配: `cooldown`
   - 上下文: `t remainingSeconds = Math.ceil((rateLimitUntilMs - now) / 1000);
    return { blocked: true, cooldownSeconds: remainingSeconds };
  }
  return { block...`

102. **lib/ai/llm.ts:52**
   - 匹配: `Cooldown`
   - 上下文: `w) / 1000);
    return { blocked: true, cooldownSeconds: remainingSeconds };
  }
  return { blocked: false, cooldownSeconds: 0 };
}

/**
 * Update coo...`

103. **lib/ai/llm.ts:52**
   - 匹配: `cooldown`
   - 上下文: `   return { blocked: true, cooldownSeconds: remainingSeconds };
  }
  return { blocked: false, cooldownSeconds: 0 };
}

/**
 * Update cooldown gate af...`

104. **lib/ai/llm.ts:53**
   - 匹配: `cooldown`
   - 上下文: `
  return { blocked: false, cooldownSeconds: 0 };
}

/**
 * Update cooldown gate after receiving 429
 */
function updateCooldownGate(cooldownSeconds: ...`

105. **lib/ai/llm.ts:54**
   - 匹配: `Cooldown`
   - 上下文: `;
}

/**
 * Update cooldown gate after receiving 429
 */
function updateCooldownGate(cooldownSeconds: number): void {
  rateLimitUntilMs = Date.now() ...`

106. **lib/ai/llm.ts:55**
   - 匹配: `cooldown`
   - 上下文: `te after receiving 429
 */
function updateCooldownGate(cooldownSeconds: number): void {
  rateLimitUntilMs = Date.now() + cooldownSeconds * 1000;
  lo...`

107. **lib/ai/llm.ts:61**
   - 匹配: `cooldown`
   - 上下文: `number): void {
  rateLimitUntilMs = Date.now() + cooldownSeconds * 1000;
  log('🚫 [LLM Gateway] Cooldown gate updated', {
    cooldownSeconds,
    u...`

108. **lib/ai/llm.ts:63**
   - 匹配: `Cooldown`
   - 上下文: `+ cooldownSeconds * 1000;
  log('🚫 [LLM Gateway] Cooldown gate updated', {
    cooldownSeconds,
    untilMs: rateLimitUntilMs,
  });
}

/**
 * Extrac...`

109. **lib/ai/llm.ts:77**
   - 匹配: `cooldown`
   - 上下文: `
        if (retryAfter) {
          const seconds = parseInt(retryAfter, 10);
          if (!isNaN(seconds) && seconds > 0) {
            return seco...`

110. **lib/ai/llm.ts:77**
   - 匹配: `cooldown`
   - 上下文: `ds = parseInt(retryAfter, 10);
          if (!isNaN(seconds) && seconds > 0) {
            return seconds;
          }
        }
      }
    }
    if ...`

111. **lib/ai/llm.ts:77**
   - 匹配: `cooldown`
   - 上下文: `);
          if (!isNaN(seconds) && seconds > 0) {
            return seconds;
          }
        }
      }
    }
    if ('cooldownSeconds' in error ...`

112. **lib/ai/llm.ts:78**
   - 匹配: `cooldown`
   - 上下文: `      return seconds;
          }
        }
      }
    }
    if ('cooldownSeconds' in error && typeof (error as { cooldownSeconds: unknown }).cooldow...`

113. **lib/ai/llm.ts:78**
   - 匹配: `cooldown`
   - 上下文: `     }
        }
      }
    }
    if ('cooldownSeconds' in error && typeof (error as { cooldownSeconds: unknown }).cooldownSeconds === 'number') {
  ...`

114. **lib/ai/llm.ts:81**
   - 匹配: `cooldown`
   - 上下文: `onds' in error && typeof (error as { cooldownSeconds: unknown }).cooldownSeconds === 'number') {
      return (error as { cooldownSeconds: number }).c...`

115. **lib/ai/llm.ts:195**
   - 匹配: `cooldown`
   - 上下文: `el}:${actionName}:${promptHash || messagesHash}:${attachmentsHash}:${mode}`;
  const keyHash = stableHash(keyInput);
  const taskKey: GatewayTaskKey =...`

116. **lib/ai/llm.ts:196**
   - 匹配: `cooldown`
   - 上下文: `sHash}:${attachmentsHash}:${mode}`;
  const keyHash = stableHash(keyInput);
  const taskKey: GatewayTaskKey = `${model}:${actionName}:${keyHash}`;

  ...`

117. **lib/ai/llm.ts:196**
   - 匹配: `Cooldown`
   - 上下文: `ash}:${mode}`;
  const keyHash = stableHash(keyInput);
  const taskKey: GatewayTaskKey = `${model}:${actionName}:${keyHash}`;

  // Check cooldown gat...`

118. **lib/ai/llm.ts:197**
   - 匹配: `cooldown`
   - 上下文: ` keyHash = stableHash(keyInput);
  const taskKey: GatewayTaskKey = `${model}:${actionName}:${keyHash}`;

  // Check cooldown gate (fast-fail, <= 2s)
 ...`

119. **lib/ai/llm.ts:198**
   - 匹配: `cooldown`
   - 上下文: `model}:${actionName}:${keyHash}`;

  // Check cooldown gate (fast-fail, <= 2s)
  const cooldownCheck = checkCooldownGate();
  if (cooldownCheck.blocke...`

120. **lib/ai/llm.ts:200**
   - 匹配: `cooldown`
   - 上下文: `heck cooldown gate (fast-fail, <= 2s)
  const cooldownCheck = checkCooldownGate();
  if (cooldownCheck.blocked) {
    log('🚫 [LLM Gateway] Request bl...`

121. **lib/ai/llm.ts:200**
   - 匹配: `cooldown`
   - 上下文: `e (fast-fail, <= 2s)
  const cooldownCheck = checkCooldownGate();
  if (cooldownCheck.blocked) {
    log('🚫 [LLM Gateway] Request blocked by cooldown...`

122. **lib/ai/llm.ts:200**
   - 匹配: `cooldown`
   - 上下文: `<= 2s)
  const cooldownCheck = checkCooldownGate();
  if (cooldownCheck.blocked) {
    log('🚫 [LLM Gateway] Request blocked by cooldown gate', {
    ...`

123. **lib/ai/llm.ts:205**
   - 匹配: `cooldown`
   - 上下文: `] Request blocked by cooldown gate', {
      requestId,
      cooldownSeconds: cooldownCheck.cooldownSeconds,
    });
    return {
      ok: false,
  ...`

124. **lib/ai/llm.ts:205**
   - 匹配: `cooldown`
   - 上下文: `ked by cooldown gate', {
      requestId,
      cooldownSeconds: cooldownCheck.cooldownSeconds,
    });
    return {
      ok: false,
      type: 'RAT...`

125. **lib/ai/llm.ts:206**
   - 匹配: `cooldown`
   - 上下文: ` requestId,
      cooldownSeconds: cooldownCheck.cooldownSeconds,
    });
    return {
      ok: false,
      type: 'RATE_LIMIT',
      message: `请求过多...`

126. **lib/ai/llm.ts:206**
   - 匹配: `cooldown`
   - 上下文: ` cooldownSeconds: cooldownCheck.cooldownSeconds,
    });
    return {
      ok: false,
      type: 'RATE_LIMIT',
      message: `请求过多，请在 ${cooldownChe...`

127. **lib/ai/llm.ts:206**
   - 匹配: `cooldown`
   - 上下文: `ds: cooldownCheck.cooldownSeconds,
    });
    return {
      ok: false,
      type: 'RATE_LIMIT',
      message: `请求过多，请在 ${cooldownCheck.cooldownSec...`

128. **lib/ai/llm.ts:316**
   - 匹配: `cooldown`
   - 上下文: `'PROVIDER',
          message: `请求超时（${timeoutMs}ms）`,
          raw: '',
        };
      }

      // Handle rate limit (429) - wrap as typed error
 ...`

129. **lib/ai/llm.ts:316**
   - 匹配: `Cooldown`
   - 上下文: `sage: `请求超时（${timeoutMs}ms）`,
          raw: '',
        };
      }

      // Handle rate limit (429) - wrap as typed error
      if (isRateLimitError...`

130. **lib/ai/llm.ts:317**
   - 匹配: `Cooldown`
   - 上下文: `  raw: '',
        };
      }

      // Handle rate limit (429) - wrap as typed error
      if (isRateLimitError(error)) {
        const cooldownSecon...`

131. **lib/ai/llm.ts:317**
   - 匹配: `cooldown`
   - 上下文: `      };
      }

      // Handle rate limit (429) - wrap as typed error
      if (isRateLimitError(error)) {
        const cooldownSeconds = extractC...`

132. **lib/ai/llm.ts:322**
   - 匹配: `cooldown`
   - 上下文: `nSeconds = extractCooldownSeconds(error);
        updateCooldownGate(cooldownSeconds);
        
        logError('🚫 [LLM Gateway] Rate limit error', ...`

133. **lib/ai/llm.ts:328**
   - 匹配: `cooldown`
   - 上下文: `ror', {
          requestId,
          model,
          cooldownSeconds,
          elapsedMs: elapsed,
        });
        
        throw {
          ...`

134. **lib/ai/llm.ts:329**
   - 匹配: `cooldown`
   - 上下文: `     model,
          cooldownSeconds,
          elapsedMs: elapsed,
        });
        
        throw {
          type: 'RATE_LIMIT',
          mess...`

135. **lib/ai/llm.ts:403**
   - 匹配: `cooldown`
   - 上下文: `atewayQueueError(err)) {
      queuedMs = err.metrics.queuedMs;
      dedupHit = err.metrics.dedupHit;
      error = err.error;
    }

    const error...`

136. **lib/ai/llm.ts:411**
   - 匹配: `cooldown`
   - 上下文: `&& 'type' in errorObj) {
      const errorType = errorObj.type as AIErrorType;
      return {
        ok: false,
        type: errorType,
        mess...`

137. **lib/ai/llm.ts:411**
   - 匹配: `cooldown`
   - 上下文: `     const errorType = errorObj.type as AIErrorType;
      return {
        ok: false,
        type: errorType,
        message: errorObj.message || '...`

138. **lib/ai/llm.ts:481**
   - 匹配: `cooldown`
   - 上下文: `el}:${actionName}:${promptHash || messagesHash}:${attachmentsHash}:${mode}`;
  const keyHash = stableHash(keyInput);
  const taskKey: GatewayTaskKey =...`

139. **lib/ai/llm.ts:482**
   - 匹配: `cooldown`
   - 上下文: `sHash}:${attachmentsHash}:${mode}`;
  const keyHash = stableHash(keyInput);
  const taskKey: GatewayTaskKey = `${model}:${actionName}:${keyHash}`;

  ...`

140. **lib/ai/llm.ts:482**
   - 匹配: `Cooldown`
   - 上下文: `ash}:${mode}`;
  const keyHash = stableHash(keyInput);
  const taskKey: GatewayTaskKey = `${model}:${actionName}:${keyHash}`;

  // Check cooldown gat...`

141. **lib/ai/llm.ts:483**
   - 匹配: `cooldown`
   - 上下文: ` keyHash = stableHash(keyInput);
  const taskKey: GatewayTaskKey = `${model}:${actionName}:${keyHash}`;

  // Check cooldown gate (fast-fail, <= 2s)
 ...`

142. **lib/ai/llm.ts:484**
   - 匹配: `cooldown`
   - 上下文: `model}:${actionName}:${keyHash}`;

  // Check cooldown gate (fast-fail, <= 2s)
  const cooldownCheck = checkCooldownGate();
  if (cooldownCheck.blocke...`

143. **lib/ai/llm.ts:486**
   - 匹配: `cooldown`
   - 上下文: `heck cooldown gate (fast-fail, <= 2s)
  const cooldownCheck = checkCooldownGate();
  if (cooldownCheck.blocked) {
    log('🚫 [LLM Gateway] Request bl...`

144. **lib/ai/llm.ts:486**
   - 匹配: `cooldown`
   - 上下文: `e (fast-fail, <= 2s)
  const cooldownCheck = checkCooldownGate();
  if (cooldownCheck.blocked) {
    log('🚫 [LLM Gateway] Request blocked by cooldown...`

145. **lib/ai/llm.ts:486**
   - 匹配: `cooldown`
   - 上下文: `<= 2s)
  const cooldownCheck = checkCooldownGate();
  if (cooldownCheck.blocked) {
    log('🚫 [LLM Gateway] Request blocked by cooldown gate', {
    ...`

146. **lib/ai/llm.ts:491**
   - 匹配: `cooldown`
   - 上下文: `] Request blocked by cooldown gate', {
      requestId,
      cooldownSeconds: cooldownCheck.cooldownSeconds,
    });
    return {
      ok: false,
  ...`

147. **lib/ai/llm.ts:491**
   - 匹配: `cooldown`
   - 上下文: `ked by cooldown gate', {
      requestId,
      cooldownSeconds: cooldownCheck.cooldownSeconds,
    });
    return {
      ok: false,
      type: 'RAT...`

148. **lib/ai/llm.ts:492**
   - 匹配: `cooldown`
   - 上下文: ` requestId,
      cooldownSeconds: cooldownCheck.cooldownSeconds,
    });
    return {
      ok: false,
      type: 'RATE_LIMIT',
      message: `请求过多...`

149. **lib/ai/llm.ts:492**
   - 匹配: `cooldown`
   - 上下文: ` cooldownSeconds: cooldownCheck.cooldownSeconds,
    });
    return {
      ok: false,
      type: 'RATE_LIMIT',
      message: `请求过多，请在 ${cooldownChe...`

150. **lib/ai/llm.ts:492**
   - 匹配: `cooldown`
   - 上下文: `ds: cooldownCheck.cooldownSeconds,
    });
    return {
      ok: false,
      type: 'RATE_LIMIT',
      message: `请求过多，请在 ${cooldownCheck.cooldownSec...`

151. **lib/ai/llm.ts:591**
   - 匹配: `cooldown`
   - 上下文: `'PROVIDER',
          message: `请求超时（${timeoutMs}ms）`,
          raw: '',
        };
      }

      // Handle rate limit (429) - wrap as typed error
 ...`

152. **lib/ai/llm.ts:591**
   - 匹配: `Cooldown`
   - 上下文: `sage: `请求超时（${timeoutMs}ms）`,
          raw: '',
        };
      }

      // Handle rate limit (429) - wrap as typed error
      if (isRateLimitError...`

153. **lib/ai/llm.ts:592**
   - 匹配: `Cooldown`
   - 上下文: `  raw: '',
        };
      }

      // Handle rate limit (429) - wrap as typed error
      if (isRateLimitError(error)) {
        const cooldownSecon...`

154. **lib/ai/llm.ts:592**
   - 匹配: `cooldown`
   - 上下文: `      };
      }

      // Handle rate limit (429) - wrap as typed error
      if (isRateLimitError(error)) {
        const cooldownSeconds = extractC...`

155. **lib/ai/llm.ts:597**
   - 匹配: `cooldown`
   - 上下文: `nSeconds = extractCooldownSeconds(error);
        updateCooldownGate(cooldownSeconds);
        
        logError('🚫 [LLM Gateway] Rate limit error', ...`

156. **lib/ai/llm.ts:603**
   - 匹配: `cooldown`
   - 上下文: `ror', {
          requestId,
          model,
          cooldownSeconds,
          elapsedMs: elapsed,
        });
        
        throw {
          ...`

157. **lib/ai/llm.ts:604**
   - 匹配: `cooldown`
   - 上下文: `     model,
          cooldownSeconds,
          elapsedMs: elapsed,
        });
        
        throw {
          type: 'RATE_LIMIT',
          mess...`

158. **lib/ai/llm.ts:713**
   - 匹配: `cooldown`
   - 上下文: `atewayQueueError(err)) {
      queuedMs = err.metrics.queuedMs;
      dedupHit = err.metrics.dedupHit;
      error = err.error;
    }

    const error...`

159. **lib/ai/llm.ts:721**
   - 匹配: `cooldown`
   - 上下文: `&& 'type' in errorObj) {
      const errorType = errorObj.type as AIErrorType;
      return {
        ok: false,
        type: errorType,
        mess...`

160. **lib/ai/llm.ts:721**
   - 匹配: `cooldown`
   - 上下文: `     const errorType = errorObj.type as AIErrorType;
      return {
        ok: false,
        type: errorType,
        message: errorObj.message || '...`

161. **lib/ai/llm.ts:68**
   - 匹配: `retryAfter = (headers as { get: (name: string) => string | null }).get('retry-after`
   - 上下文: `rs = 'headers' in error.response ? error.response.headers : null;
      if (headers != null && typeof headers === 'object' && typeof (headers as { get...`

162. **lib/ai/llm.ts:69**
   - 匹配: `retryAfter`
   - 上下文: `of headers === 'object' && typeof (headers as { get?: unknown }).get === 'function') {
        const retryAfter = (headers as { get: (name: string) =>...`

163. **lib/ai/llm.ts:70**
   - 匹配: `retryAfter`
   - 上下文: `et?: unknown }).get === 'function') {
        const retryAfter = (headers as { get: (name: string) => string | null }).get('retry-after');
        if ...`

164. **lib/graph/fallback-graph.ts:33**
   - 匹配: `429`
   - 上下文: `  name: string;
      trigger: string;
      outcome: string;
    }>;
  };
  nodes: FractalNode[];
  edges: Edge[];
  warnings: string[];
}

/**
 * Bu...`

165. **lib/graph/fallback-graph.ts:4**
   - 匹配: `rate-limit`
   - 上下文: `/**
 * Deterministic Fallback Graph Builder
 * 
 * Rule-based graph generation when AI fails or rate-limited.
 * Always returns valid schema with non-...`

166. **lib/openai-client.ts:113**
   - 匹配: `429`
   - 上下文: `ntexts.get(requestId);
      if (context) {
        context.attemptNumber = (context.attemptNumber || 0) + 1;
      }
      
      const response = aw...`

167. **lib/openai-client.ts:115**
   - 匹配: `429`
   - 上下文: ` await fetch(url, fetchOptions);

      // Check for 429 Rate Limit - pass through to llm.ts for handling
      // llm.ts is the single source of trut...`

168. **lib/openai-client.ts:130**
   - 匹配: `429`
   - 上下文: `       const parsed = parseInt(retryAfter, 10);
          if (!isNaN(parsed) && parsed > 0) {
            cooldownSeconds = parsed;
          }
      ...`

169. **lib/openai-client.ts:142**
   - 匹配: `429`
   - 上下文: `d handle
        const rateLimitError = new Error('Rate limit exceeded') as Error & {
          statusCode?: number;
          cooldownSeconds?: numbe...`

170. **lib/openai-client.ts:113**
   - 匹配: `Rate Limit`
   - 上下文: `ts.get(requestId);
      if (context) {
        context.attemptNumber = (context.attemptNumber || 0) + 1;
      }
      
      const response = await ...`

171. **lib/openai-client.ts:130**
   - 匹配: `Rate Limit`
   - 上下文: `   const parsed = parseInt(retryAfter, 10);
          if (!isNaN(parsed) && parsed > 0) {
            cooldownSeconds = parsed;
          }
        }
...`

172. **lib/openai-client.ts:138**
   - 匹配: `rateLimit`
   - 上下文: `Ms: elapsed,
          cooldownSeconds,
          retryAfter: retryAfter || 'not provided',
        });
        
        // Throw error with cooldown ...`

173. **lib/openai-client.ts:138**
   - 匹配: `Rate limit`
   - 上下文: `ownSeconds,
          retryAfter: retryAfter || 'not provided',
        });
        
        // Throw error with cooldown info - llm.ts will catch and...`

174. **lib/openai-client.ts:142**
   - 匹配: `rateLimit`
   - 上下文: ` info - llm.ts will catch and handle
        const rateLimitError = new Error('Rate limit exceeded') as Error & {
          statusCode?: number;
     ...`

175. **lib/openai-client.ts:143**
   - 匹配: `rateLimit`
   - 上下文: `    const rateLimitError = new Error('Rate limit exceeded') as Error & {
          statusCode?: number;
          cooldownSeconds?: number;
        };...`

176. **lib/openai-client.ts:145**
   - 匹配: `rateLimit`
   - 上下文: `       cooldownSeconds?: number;
        };
        rateLimitError.statusCode = 429;
        rateLimitError.cooldownSeconds = cooldownSeconds;
       ...`

177. **lib/openai-client.ts:48**
   - 匹配: `Cooldown`
   - 上下文: `estContexts = new Map<string, RequestContext>();

/**
 * Get custom fetch function with undici Agent for extended timeouts
 * This is used internally ...`

178. **lib/openai-client.ts:114**
   - 匹配: `cooldown`
   - 上下文: `) + 1;
      }
      
      const response = await fetch(url, fetchOptions);

      // Check for 429 Rate Limit - pass through to llm.ts for handling
...`

179. **lib/openai-client.ts:122**
   - 匹配: `cooldown`
   - 上下文: `header for llm.ts to use (guard: headers 可能为 null)
        const retryAfter = response?.headers?.get?.('retry-after') ||
                          res...`

180. **lib/openai-client.ts:126**
   - 匹配: `cooldown`
   - 上下文: `t?.('Retry-After');
        let cooldownSeconds = 10; // Default
        if (retryAfter) {
          const parsed = parseInt(retryAfter, 10);
        ...`

181. **lib/openai-client.ts:133**
   - 匹配: `cooldown`
   - 上下文: `onds = parsed;
          }
        }
        
        logError('🚫 [OpenAI Client] 429 Rate Limit detected (will be handled by llm.ts)', {
          r...`

182. **lib/openai-client.ts:137**
   - 匹配: `cooldown`
   - 上下文: `ndled by llm.ts)', {
          requestId,
          elapsedMs: elapsed,
          cooldownSeconds,
          retryAfter: retryAfter || 'not provided',...`

183. **lib/openai-client.ts:140**
   - 匹配: `cooldown`
   - 上下文: `        
        // Throw error with cooldown info - llm.ts will catch and handle
        const rateLimitError = new Error('Rate limit exceeded') as E...`

184. **lib/openai-client.ts:143**
   - 匹配: `cooldown`
   - 上下文: `imitError = new Error('Rate limit exceeded') as Error & {
          statusCode?: number;
          cooldownSeconds?: number;
        };
        rateLi...`

185. **lib/openai-client.ts:143**
   - 匹配: `cooldown`
   - 上下文: `ror('Rate limit exceeded') as Error & {
          statusCode?: number;
          cooldownSeconds?: number;
        };
        rateLimitError.statusCod...`

186. **lib/openai-client.ts:119**
   - 匹配: `Retry-After`
   - 上下文: `ngle source of truth for cooldown gate
      if (response.status === 429) {
        if (timeoutId) clearTimeout(timeoutId);
        const elapsed = Da...`

187. **lib/openai-client.ts:120**
   - 匹配: `retryAfter = response?.headers?.get?.('retry-after`
   - 上下文: `       if (timeoutId) clearTimeout(timeoutId);
        const elapsed = Date.now() - startTime;
        
        // Extract Retry-After header for llm....`

188. **lib/openai-client.ts:121**
   - 匹配: `Retry-After`
   - 上下文: `    // Extract Retry-After header for llm.ts to use (guard: headers 可能为 null)
        const retryAfter = response?.headers?.get?.('retry-after') ||
  ...`

189. **lib/openai-client.ts:123**
   - 匹配: `retryAfter`
   - 上下文: `null)
        const retryAfter = response?.headers?.get?.('retry-after') ||
                          response?.headers?.get?.('Retry-After');
       ...`

190. **lib/openai-client.ts:124**
   - 匹配: `retryAfter`
   - 上下文: `rs?.get?.('retry-after') ||
                          response?.headers?.get?.('Retry-After');
        let cooldownSeconds = 10; // Default
        if...`

191. **lib/openai-client.ts:134**
   - 匹配: `retryAfter: retryAfter`
   - 上下文: `        }
        
        logError('🚫 [OpenAI Client] 429 Rate Limit detected (will be handled by llm.ts)', {
          requestId,
          elapsed...`

192. **lib/ui-generation-helpers.ts:94**
   - 匹配: `429`
   - 上下文: `object
    if ('retryAfter' in error && typeof error.retryAfter === 'number') {
      return error.retryAfter;
    }
  }
  
  return 10; // Default co...`

193. **lib/ui-generation-helpers.ts:102**
   - 匹配: `429`
   - 上下文: `unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  
  const errorMessage = error instanceof Error ? error.message : String...`

194. **lib/ui-generation-helpers.ts:106**
   - 匹配: `429`
   - 上下文: `es('429') ||
    errorMessage.includes('Too Many Requests') ||
    errorMessage.includes('rate limit') ||
    errorMessage.includes('Rate limit') ||
 ...`

195. **lib/ui-generation-helpers.ts:107**
   - 匹配: `429`
   - 上下文: `quests') ||
    errorMessage.includes('rate limit') ||
    errorMessage.includes('Rate limit') ||
    ('statusCode' in error && error.statusCode === 4...`

196. **lib/ui-generation-helpers.ts:6**
   - 匹配: `Rate limit`
   - 上下文: `/**
 * UI Generation Helpers
 * 
 * Provides type-safe utilities for UI generation with strict quality constraints:
 * - Precise stage timing (t0-t4)
...`

197. **lib/ui-generation-helpers.ts:94**
   - 匹配: `rate limit`
   - 上下文: `er in error object
    if ('retryAfter' in error && typeof error.retryAfter === 'number') {
      return error.retryAfter;
    }
  }
  
  return 10; /...`

198. **lib/ui-generation-helpers.ts:96**
   - 匹配: `RateLimit`
   - 上下文: `ror && typeof error.retryAfter === 'number') {
      return error.retryAfter;
    }
  }
  
  return 10; // Default cooldown
}

/**
 * Checks if error ...`

199. **lib/ui-generation-helpers.ts:104**
   - 匹配: `rate limit`
   - 上下文: `t errorMessage = error instanceof Error ? error.message : String(error);
  
  return (
    errorMessage.includes('429') ||
    errorMessage.includes('...`

200. **lib/ui-generation-helpers.ts:105**
   - 匹配: `Rate limit`
   - 上下文: `rror.message : String(error);
  
  return (
    errorMessage.includes('429') ||
    errorMessage.includes('Too Many Requests') ||
    errorMessage.inc...`

201. **lib/ui-generation-helpers.ts:198**
   - 匹配: `RATE_LIMIT`
   - 上下文: `, just log the warning
}

/**
 * Constants for UI generation
 */
export const UI_GENERATION_CONSTANTS = {
  MAX_SKELETON_HTML_LENGTH: 50_000,
  MAX_FI...`

202. **lib/ui-generation-helpers.ts:204**
   - 匹配: `rate limit`
   - 上下文: `
  MAX_FINAL_HTML_LENGTH: 200_000,
  MAX_LIST_ITEMS: 50,
  RATE_LIMIT_FAST_FAIL_MS: 5_000,
  NETWORK_RETRY_DELAY_MS: 1_000,
  NETWORK_RETRY_JITTER_MS:...`

203. **lib/ui-generation-helpers.ts:222**
   - 匹配: `Rate limit`
   - 上下文: `omise<T>,
  requestId: string,
  model: string
): Promise<T> {
  const startTime = Date.now();
  
  try {
    // First attempt
    const result = awai...`

204. **lib/ui-generation-helpers.ts:225**
   - 匹配: `Rate limit`
   - 上下文: `
    const result = await Promise.race([
      generateTextFn(),
      // Rate limit fast-fail timeout
      new Promise<never>((_, reject) => {
     ...`

205. **lib/ui-generation-helpers.ts:226**
   - 匹配: `RATE_LIMIT`
   - 上下文: `
      // Rate limit fast-fail timeout
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Rate limit che...`

206. **lib/ui-generation-helpers.ts:234**
   - 匹配: `rate limit`
   - 上下文: `imeout'));
        }, UI_GENERATION_CONSTANTS.RATE_LIMIT_FAST_FAIL_MS);
      }),
    ]);
    
    return result;
  } catch (error) {
    const elapse...`

207. **lib/ui-generation-helpers.ts:235**
   - 匹配: `RateLimit`
   - 上下文: `NERATION_CONSTANTS.RATE_LIMIT_FAST_FAIL_MS);
      }),
    ]);
    
    return result;
  } catch (error) {
    const elapsed = Date.now() - startTime;...`

208. **lib/ui-generation-helpers.ts:237**
   - 匹配: `Rate Limit`
   - 上下文: `rror) {
    const elapsed = Date.now() - startTime;
    
    // Check for rate limit error
    if (isRateLimitError(error)) {
      const cooldown = e...`

209. **lib/ui-generation-helpers.ts:244**
   - 匹配: `rateLimit`
   - 上下文: `wnSeconds(error);
      logError('🚫 [Rate Limit] Fast-fail triggered', {
        requestId,
        model,
        elapsedMs: elapsed,
        cooldo...`

210. **lib/ui-generation-helpers.ts:244**
   - 匹配: `Rate limit`
   - 上下文: `rror('🚫 [Rate Limit] Fast-fail triggered', {
        requestId,
        model,
        elapsedMs: elapsed,
        cooldownSeconds: cooldown,
      }...`

211. **lib/ui-generation-helpers.ts:245**
   - 匹配: `rate_limit`
   - 上下文: `    requestId,
        model,
        elapsedMs: elapsed,
        cooldownSeconds: cooldown,
      });
      
      const rateLimitError = new Error('...`

212. **lib/ui-generation-helpers.ts:248**
   - 匹配: `rateLimit`
   - 上下文: `     cooldownSeconds: cooldown,
      });
      
      const rateLimitError = new Error('Rate limit exceeded') as Error & {
        type: 'rate_limit'...`

213. **lib/ui-generation-helpers.ts:248**
   - 匹配: `rate_limit`
   - 上下文: `ooldown,
      });
      
      const rateLimitError = new Error('Rate limit exceeded') as Error & {
        type: 'rate_limit';
        cooldownSecon...`

214. **lib/ui-generation-helpers.ts:249**
   - 匹配: `rateLimit`
   - 上下文: `      
      const rateLimitError = new Error('Rate limit exceeded') as Error & {
        type: 'rate_limit';
        cooldownSeconds: number;
      }...`

215. **lib/ui-generation-helpers.ts:250**
   - 匹配: `rateLimit`
   - 上下文: `it exceeded') as Error & {
        type: 'rate_limit';
        cooldownSeconds: number;
      };
      rateLimitError.type = 'rate_limit';
      rateL...`

216. **lib/ui-generation-helpers.ts:254**
   - 匹配: `RATE_LIMIT`
   - 上下文: `;
      rateLimitError.cooldownSeconds = cooldown;
      throw rateLimitError;
    }
    
    // Check for network error (retryable)
    if (isNetwork...`

217. **lib/ui-generation-helpers.ts:103**
   - 匹配: `Too Many Requests`
   - 上下文: `typeof error !== 'object') return false;
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  return (
    errorMess...`

218. **lib/ui-generation-helpers.ts:65**
   - 匹配: `cooldown`
   - 上下文: `ng,
  timing: StageTiming
): void {
  log(`⏱️ [${timing.stage}] ${timing.name}`, {
    requestId,
    model,
    elapsedMs: timing.elapsedMs,
    time...`

219. **lib/ui-generation-helpers.ts:68**
   - 匹配: `Cooldown`
   - 上下文: `psedMs: timing.elapsedMs,
    timestamp: timing.timestamp,
  });
}

/**
 * Extracts cooldown seconds from Retry-After header or error
 * Returns defau...`

220. **lib/ui-generation-helpers.ts:90**
   - 匹配: `cooldown`
   - 上下文: `  }
    }
    
    // Check for retryAfter in error object
    if ('retryAfter' in error && typeof error.retryAfter === 'number') {
      return error...`

221. **lib/ui-generation-helpers.ts:236**
   - 匹配: `cooldown`
   - 上下文: `IL_MS);
      }),
    ]);
    
    return result;
  } catch (error) {
    const elapsed = Date.now() - startTime;
    
    // Check for rate limit err...`

222. **lib/ui-generation-helpers.ts:236**
   - 匹配: `Cooldown`
   - 上下文: `    ]);
    
    return result;
  } catch (error) {
    const elapsed = Date.now() - startTime;
    
    // Check for rate limit error
    if (isRateL...`

223. **lib/ui-generation-helpers.ts:241**
   - 匹配: `cooldown`
   - 上下文: `imitError(error)) {
      const cooldown = extractCooldownSeconds(error);
      logError('🚫 [Rate Limit] Fast-fail triggered', {
        requestId,
 ...`

224. **lib/ui-generation-helpers.ts:241**
   - 匹配: `cooldown`
   - 上下文: ` {
      const cooldown = extractCooldownSeconds(error);
      logError('🚫 [Rate Limit] Fast-fail triggered', {
        requestId,
        model,
   ...`

225. **lib/ui-generation-helpers.ts:246**
   - 匹配: `cooldown`
   - 上下文: `  model,
        elapsedMs: elapsed,
        cooldownSeconds: cooldown,
      });
      
      const rateLimitError = new Error('Rate limit exceeded')...`

226. **lib/ui-generation-helpers.ts:249**
   - 匹配: `cooldown`
   - 上下文: `nst rateLimitError = new Error('Rate limit exceeded') as Error & {
        type: 'rate_limit';
        cooldownSeconds: number;
      };
      rateLim...`

227. **lib/ui-generation-helpers.ts:249**
   - 匹配: `cooldown`
   - 上下文: ` = new Error('Rate limit exceeded') as Error & {
        type: 'rate_limit';
        cooldownSeconds: number;
      };
      rateLimitError.type = 'ra...`

228. **lib/ui-generation-helpers.ts:65**
   - 匹配: `Retry-After`
   - 上下文: `ing
): void {
  log(`⏱️ [${timing.stage}] ${timing.name}`, {
    requestId,
    model,
    elapsedMs: timing.elapsedMs,
    timestamp: timing.timestam...`

229. **lib/ui-generation-helpers.ts:70**
   - 匹配: `Retry-After`
   - 上下文: `om Retry-After header or error
 * Returns default 10 if not available
 */
export function extractCooldownSeconds(error: unknown): number {
  if (error...`

230. **lib/ui-generation-helpers.ts:74**
   - 匹配: `retryAfter = (headers as { get: (name: string) => string | null }).get('retry-after`
   - 上下文: `rs = 'headers' in error.response ? error.response.headers : null;
      if (headers != null && typeof headers === 'object' && typeof (headers as { get...`

231. **lib/ui-generation-helpers.ts:75**
   - 匹配: `retryAfter`
   - 上下文: `of headers === 'object' && typeof (headers as { get?: unknown }).get === 'function') {
        const retryAfter = (headers as { get: (name: string) =>...`

232. **lib/ui-generation-helpers.ts:76**
   - 匹配: `retryAfter`
   - 上下文: `et?: unknown }).get === 'function') {
        const retryAfter = (headers as { get: (name: string) => string | null }).get('retry-after');
        if ...`

233. **lib/ui-generation-helpers.ts:84**
   - 匹配: `retryAfter`
   - 上下文: `retryAfter) {
          const seconds = parseInt(retryAfter, 10);
          if (!isNaN(seconds) && seconds > 0) {
            return seconds;
        ...`

234. **lib/ui-generation-helpers.ts:85**
   - 匹配: `retryAfter' in error && typeof error.retryAfter`
   - 上下文: `s = parseInt(retryAfter, 10);
          if (!isNaN(seconds) && seconds > 0) {
            return seconds;
          }
        }
      }
    }
    
   ...`

235. **lib/ui-generation-helpers.ts:86**
   - 匹配: `retryAfter`
   - 上下文: `       return seconds;
          }
        }
      }
    }
    
    // Check for retryAfter in error object
    if ('retryAfter' in error && typeof er...`

236. **lib/user-facing-messages.ts:20**
   - 匹配: `RATE_LIMIT`
   - 上下文: `
 * 不向用户展示原始 error.message；技术信息仅开发环境或日志。
 */
export function getUserFacingErrorDescription(
  type: AIErrorType | PipelineErrorType,
  cooldownSeconds...`

237. **lib/user-facing-messages.ts:17**
   - 匹配: `cooldown`
   - 上下文: `rorType | 'VALIDATION';

/**
 * 根据 AI 错误类型与可选冷却秒数，返回用户可见的一句可操作建议。
 * 不向用户展示原始 error.message；技术信息仅开发环境或日志。
 */
export function getUserFacingErrorDescri...`

238. **lib/user-facing-messages.ts:21**
   - 匹配: `cooldown`
   - 上下文: `发环境或日志。
 */
export function getUserFacingErrorDescription(
  type: AIErrorType | PipelineErrorType,
  cooldownSeconds?: number
): string {
  switch (t...`

239. **lib/user-facing-messages.ts:21**
   - 匹配: `cooldown`
   - 上下文: `serFacingErrorDescription(
  type: AIErrorType | PipelineErrorType,
  cooldownSeconds?: number
): string {
  switch (type) {
    case 'RATE_LIMIT':
  ...`

240. **lib/user-facing-messages.ts:22**
   - 匹配: `cooldown`
   - 上下文: `Type | PipelineErrorType,
  cooldownSeconds?: number
): string {
  switch (type) {
    case 'RATE_LIMIT':
      return typeof cooldownSeconds === 'num...`

241. **utils/prdGenerator.ts:1408**
   - 匹配: `Retry after`
   - 上下文: ` Also try immediately (in case scripts are already loaded)
        waitForReact(() => {
          console.log('⚡ [init] Immediate mount attempt');
   ...`


## ECONNRESET / Network Error 处理

共找到 28 处：

1. **app/actions/ui-pipeline-response.test.ts:99**
   - 匹配: `Network error`
   - 上下文: `rtEqual(result.html, data.html);
    assertEqual(result.stage, data.stage);
  }
});

test('normalizeUIPipelineResponse: zsa-react tuple [null, Error] ...`

2. **app/actions/ui-pipeline-response.test.ts:106**
   - 匹配: `Network error`
   - 上下文: `or] = [null, error];
  const result = normalizeUIPipelineResponse(tuple);

  assertEqual(result.ok, false);
  assertEqual(result.type, 'NETWORK');
  i...`

3. **lib/ai/llm.ts:112**
   - 匹配: `ECONNRESET`
   - 上下文: `   errorMessage.includes('fetch failed') ||
    errorMessage.includes('ECONNREFUSED') ||
    errorMessage.includes('ENOTFOUND') ||
    errorMessage.in...`

4. **lib/ai/llm.ts:109**
   - 匹配: `ECONNREFUSED`
   - 上下文: `) return false;
  const errorMessage = error instanceof Error ? error.message : String(error);

  const hasNetworkMessage = !!(
    errorMessage.inclu...`

5. **lib/ai/llm.ts:111**
   - 匹配: `ETIMEDOUT`
   - 上下文: `error);

  const hasNetworkMessage = !!(
    errorMessage.includes('fetch failed') ||
    errorMessage.includes('ECONNREFUSED') ||
    errorMessage.in...`

6. **lib/ai/llm.ts:108**
   - 匹配: `fetch failed`
   - 上下文: `n {
  if (!error || typeof error !== 'object') return false;
  const errorMessage = error instanceof Error ? error.message : String(error);

  const h...`

7. **lib/ai/llm.ts:101**
   - 匹配: `network error`
   - 上下文: `de === 429) ||
    ('status' in error && (error as { status: unknown }).status === 429) ||
    ('type' in error && (error as { type: unknown }).type =...`

8. **lib/ai/llm.ts:334**
   - 匹配: `network error`
   - 上下文: `ATE_LIMIT',
          message: `请求过多，请在 ${cooldownSeconds} 秒后重试`,
          cooldownSeconds,
          raw: error instanceof Error ? error.message : S...`

9. **lib/ai/llm.ts:336**
   - 匹配: `Network error`
   - 上下文: ` error instanceof Error ? error.message : String(error),
        };
      }

      // Handle network errors - wrap as typed error
      if (isNetworkE...`

10. **lib/ai/llm.ts:609**
   - 匹配: `network error`
   - 上下文: `ATE_LIMIT',
          message: `请求过多，请在 ${cooldownSeconds} 秒后重试`,
          cooldownSeconds,
          raw: error instanceof Error ? error.message : S...`

11. **lib/ai/llm.ts:611**
   - 匹配: `Network error`
   - 上下文: ` error instanceof Error ? error.message : String(error),
        };
      }

      // Handle network errors - wrap as typed error
      if (isNetworkE...`

12. **lib/openai-client.ts:167**
   - 匹配: `ECONNREFUSED`
   - 上下文: `r');
      const isBodyTimeout = errorMessage.includes('bodyTimeout');

      // 检测网络错误类型
      const isNetworkError = 
        errorMessage.includes(...`

13. **lib/openai-client.ts:169**
   - 匹配: `ETIMEDOUT`
   - 上下文: ` const isNetworkError = 
        errorMessage.includes('fetch failed') ||
        errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includ...`

14. **lib/openai-client.ts:166**
   - 匹配: `fetch failed`
   - 上下文: `                 errorMessage.includes('AbortError');
      const isBodyTimeout = errorMessage.includes('bodyTimeout');

      // 检测网络错误类型
      const...`

15. **lib/openai-client.ts:215**
   - 匹配: `Network error`
   - 上下文: `errorDetails,
          errorCode,
          suggestion: '请检查：1. 网络连接 2. API 服务器状态 3. 防火墙/代理设置',
        });
      } else {
        logError('❌ [OpenA...`

16. **lib/openai-client.ts:223**
   - 匹配: `Network error`
   - 上下文: ` if (attemptNumber < 2) {
          // First attempt failed, retry once with jitter
          const jitterDelay = 200 + Math.floor(Math.random() * 400...`

17. **lib/openai-client.ts:258**
   - 匹配: `network error`
   - 上下文: ` Client] Network retry failed', {
              requestId,
              totalElapsedMs: totalElapsed,
              retryAttempt: attemptNumber + 1,
...`

18. **lib/openai-client.ts:259**
   - 匹配: `Network error`
   - 上下文: `: totalElapsed,
              retryAttempt: attemptNumber + 1,
            });
            
            // Throw network error - llm.ts will catch and...`

19. **lib/openai-client.ts:265**
   - 匹配: `Network error`
   - 上下文: ` retry');
            requestContexts.delete(requestId);
            throw networkError;
          }
        } else {
          // Already retried, fa...`

20. **lib/ui-generation-helpers.ts:121**
   - 匹配: `ECONNREFUSED`
   - 上下文: `eturn false;
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  const hasNetworkMessage = (
    errorMessage.inclu...`

21. **lib/ui-generation-helpers.ts:123**
   - 匹配: `ETIMEDOUT`
   - 上下文: `error);
  
  const hasNetworkMessage = (
    errorMessage.includes('fetch failed') ||
    errorMessage.includes('ECONNREFUSED') ||
    errorMessage.in...`

22. **lib/ui-generation-helpers.ts:120**
   - 匹配: `fetch failed`
   - 上下文: `
  if (!error || typeof error !== 'object') return false;
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  const...`

23. **lib/ui-generation-helpers.ts:7**
   - 匹配: `Network error`
   - 上下文: `/**
 * UI Generation Helpers
 * 
 * Provides type-safe utilities for UI generation with strict quality constraints:
 * - Precise stage timing (t0-t4)
...`

24. **lib/ui-generation-helpers.ts:112**
   - 匹配: `network error`
   - 上下文: `te limit') ||
    errorMessage.includes('Rate limit') ||
    ('statusCode' in error && error.statusCode === 429) ||
    ('status' in error && error.st...`

25. **lib/ui-generation-helpers.ts:253**
   - 匹配: `network error`
   - 上下文: `te_limit';
        cooldownSeconds: number;
      };
      rateLimitError.type = 'rate_limit';
      rateLimitError.cooldownSeconds = cooldown;
      ...`

26. **lib/ui-generation-helpers.ts:255**
   - 匹配: `Network Error`
   - 上下文: `wn;
      throw rateLimitError;
    }
    
    // Check for network error (retryable)
    if (isNetworkError(error) && elapsed < UI_GENERATION_CONSTAN...`

27. **lib/ui-generation-helpers.ts:274**
   - 匹配: `Network Error`
   - 上下文: `  try {
        // Second attempt (no timeout for retry)
        return await generateTextFn();
      } catch (retryError) {
        const totalElapse...`

28. **lib/ui-generation-helpers.ts:281**
   - 匹配: `Network error`
   - 上下文: `[Network Error] Retry failed', {
          requestId,
          model,
          totalElapsedMs: totalElapsed,
          retryable: false,
        });...`


## NoObjectGeneratedError / JSON Parse Error

共找到 0 处：

无

## uiCode.substring 错误

共找到 75 处：

1. **app/actions/generate-graph.ts:328**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `onst block = extractTaggedBlock(result.data, 'AI_JSON');
  if (!block) {
    logError('❌ [analyzeInputClarity] Tagged block not found, using fallback'...`

2. **app/actions/generate-graph.ts:362**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `
  
  if (!parseResult.ok) {
    logWarn('⚠️ [analyzeInputClarity] JSON parse failed, using fallback', {
      requestId,
      error: parseResult.err...`

3. **app/actions/generate-graph.ts:493**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `trics = { queuedMs: 0, dedupHit: false, totalMs: 0 };
    
    log('🚀 [generateGraph] 开始生成图结构（单次调用）', {
      requestId,
        promptLength: input....`

4. **app/actions/node-operations.ts:477**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `'').trim();
      })
      .filter(line => line.length > 0)
      .slice(0, 50); // 限制最多50条需求

    if (requirements.length === 0) {
      // 如果没有解析到需求...`

5. **app/actions/node-operations.ts:623**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `h(/^(测试用例|用例|Case)/i) &&
            line.length > 5
        )
        .slice(0, 20);
      if (listCases.length > 0) {
        cases = listCases;
   ...`

6. **app/actions/node-operations.ts:893**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `数据格式无效或数据过短');
      }
      
      log('📸 [generateUIFromImage] 图片数据验证通过:', {
        inputLength: input.imageBase64.length,
        base64Length: b...`

7. **app/actions/node-operations.ts:1068**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `ode now.`;

      const userPrompt = input.prompt.trim() || defaultUserPrompt;
      log('💬 [generateUIFromImage] 用户提示词:', {
        promptLength: us...`

8. **app/actions/node-operations.ts:1150**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: ` generatedCode = result.data.trim();
      log('📝 [generateUIFromImage] 原始生成结果:', {
        textLength: result.data.length,
        trimmedLength: ge...`

9. **app/actions/node-operations.ts:1160**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `pt|javascript)?\n?/gm, '')
        .replace(/\n?```$/gm, '')
        .trim();
      log('🧹 [generateUIFromImage] 代码清理后:', {
        cleanedLength: ge...`

10. **app/actions/node-operations.ts:1498**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `t generatedCode = result.data.trim();
      log('📝 [generateUIFromText] 原始生成结果:', {
        textLength: result.data.length,
        trimmedLength: ge...`

11. **app/actions/node-operations.ts:1536**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `og('🖥️ [generateUIFromText] 已对生成代码做桌面布局后处理（替换移动端根宽度为桌面）');
        }
      }

      log('🧹 [generateUIFromText] 代码清理后:', {
        cleanedLength: ge...`

12. **app/actions/node-operations.ts:1615**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `  ];
      const isRefusal = refusalPatterns.some((re) => re.test(generatedCode));
      if (isRefusal) {
        logError('❌ [generateUIFromText] 模型返...`

13. **app/actions/node-operations.ts:1843**
   - 匹配: `.substring(`
   - 有类型检查: 是
   - 上下文: `
      ];
      if (clarificationPatterns.some((p) => p.test(markdown)) && !/^\s*\|?\s*功能ID\s*\|/m.test(markdown)) {
        logError('❌ [generateAnal...`

14. **components/canvas/CommandBar.tsx:3212**
   - 匹配: `uiCode.substring`
   - 有类型检查: 否
   - 上下文: `stId,
                stages: response.stages,
              });
              
              log('🔍 [CommandBar] 提取的UI代码:', {
                codeLe...`

15. **components/canvas/CommandBar.tsx:3223**
   - 匹配: `uiCode.substring`
   - 有类型检查: 否
   - 上下文: `     log('💾 [CommandBar] 准备更新节点:', {
                  nodeId: targetNodeId,
                  nodeLabel: targetNodeLabel,
                  codeLeng...`

16. **components/canvas/CommandBar.tsx:3257**
   - 匹配: `uiCode.substring`
   - 有类型检查: 否
   - 上下文: `ngth: savedCode.length,
                  savedCodePreview: savedCode.substring(0, 100),
                  isMatch: savedCode === uiCode,
            ...`

17. **components/canvas/CommandBar.tsx:248**
   - 匹配: `.substring(`
   - 有类型检查: 是
   - 上下文: ` hasData: !!(result as any)?.data,
        keys: result && typeof result === 'object' ? Object.keys(result as any) : [],
        // 尝试序列化查看完整结构（限制长度避免...`

18. **components/canvas/CommandBar.tsx:263**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `: Array.isArray((result as any)?.data?.edges) ? (result as any).data.edges.length : 'N/A',
        // 完整的数据结构（限制长度）
        fullDataString: (result as...`

19. **components/canvas/CommandBar.tsx:354**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `ray.isArray((resultData as any)?.data?.nodes) ? (resultData as any).data.nodes.length : 'N/A',
        dataNodesValue: (resultData as any)?.data?.node...`

20. **components/canvas/CommandBar.tsx:366**
   - 匹配: `.substring(`
   - 有类型检查: 是
   - 上下文: `    directEdgesType: typeof (resultData as any)?.edges,
        directEdgesIsArray: Array.isArray((resultData as any)?.edges),
        // 完整结构预览（限制长度）...`

21. **components/canvas/CommandBar.tsx:410**
   - 匹配: `.substring(`
   - 有类型检查: 是
   - 上下文: `      edgesValue: data.edges,
          edgesType: typeof data.edges,
          edgesIsArray: Array.isArray(data.edges),
          // 完整 data 对象的结构（限制...`

22. **components/canvas/CommandBar.tsx:438**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `g('✅ [CommandBar] 从 resultData.data.nodes 提取到节点:', { count: nodes?.length || 0 });
        } else if (!nodes) {
          const nodesStringified = dat...`

23. **components/canvas/CommandBar.tsx:452**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `og('✅ [CommandBar] 从 resultData.data.edges 提取到边:', { count: edges?.length || 0 });
        } else if (!edges) {
          const edgesStringified = dat...`

24. **components/canvas/CommandBar.tsx:2273**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `ommandBar] executeUI 解析后的结果:', {
            hasData: !!resultData,
            hasCode: !!codeFromResult,
            codeLength: codeFromResult?.len...`

25. **components/canvas/CommandBar.tsx:2297**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `     logError('❌ [CommandBar] UI generation failed: no valid code returned', {
              result: uiResult,
              resultData,
             ...`

26. **components/canvas/CommandBar.tsx:2312**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `('💾 [CommandBar] 立即保存UI代码到store:', {
            nodeId: targetNodeId,
            nodeLabel: targetNodeLabel,
            codeLength: accumulatedCod...`

27. **components/canvas/CommandBar.tsx:2344**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `证:', {
                nodeId: targetNodeId,
                savedCodeLength: savedNode.data.artifacts?.view?.code?.length || 0,
                saved...`

28. **components/canvas/CommandBar.tsx:2550**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `actClone,
              htmlContentLength: htmlContent.length,
            });
            
            // 增加HTML内容长度限制到100000字符，确保完整传递（支持大型HTML文件）
  ...`

29. **components/canvas/CommandBar.tsx:2734**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: ` [CommandBar] 准备调用 executeUIText...');
            log('📋 [CommandBar] executeUIText 调用参数:', {
              promptLength: htmlReferencePrompt.length...`

30. **components/canvas/CommandBar.tsx:3212**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `                stages: response.stages,
              });
              
              log('🔍 [CommandBar] 提取的UI代码:', {
                codeLength: ...`

31. **components/canvas/CommandBar.tsx:3223**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `og('💾 [CommandBar] 准备更新节点:', {
                  nodeId: targetNodeId,
                  nodeLabel: targetNodeLabel,
                  codeLength: ui...`

32. **components/canvas/CommandBar.tsx:3255**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `?.code || '';
                log('✅ [CommandBar] 节点更新验证:', {
                  nodeId: targetNodeId,
                  savedCodeLength: savedCode.len...`

33. **components/canvas/CommandBar.tsx:3257**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `           savedCodeLength: savedCode.length,
                  savedCodePreview: savedCode.substring(0, 100),
                  isMatch: savedCode ==...`

34. **components/canvas/CommandBar.tsx:3257**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `savedCode.length,
                  savedCodePreview: savedCode.substring(0, 100),
                  isMatch: savedCode === uiCode,
                  ...`

35. **components/canvas/CommandBar.tsx:3446**
   - 匹配: `.substring(`
   - 有类型检查: 是
   - 上下文: `ifacts.view?.previewUrl,
        previewUrlType: currentArtifacts.view?.previewUrl ? typeof currentArtifacts.view.previewUrl : 'undefined',
        pr...`

36. **components/canvas/CommandBar.tsx:3494**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: ` || att.mimeType?.includes('msword');
        
        if (att.type === 'text' || isPDF || isWord) {
          // 文本文件、PDF 或 Word 文档
          textAtt...`

37. **components/canvas/HtmlFirstPreview.tsx:586**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `: HtmlSandbox with edit injector
          // ⚠️ 重要：使用 htmlSource prop 而不是 ref，确保响应式更新
          <div className="w-full h-full relative">
            ...`

38. **components/canvas/HtmlFirstPreview.tsx:611**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `       // Preview Mode: 统一经 HtmlPreviewSurface → guard → HtmlSandboxRenderer
          <div className="w-full h-full relative">
            <HtmlPrevi...`

39. **components/canvas/ProjectBlueprint.tsx:458**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `nodes.forEach((node) => {
      const nodeStories = storiesByNode.get(node.id) || [];
      if (nodeStories.length > 0) {
        const nodeLabel = (n...`

40. **components/canvas/ProjectBlueprint.tsx:463**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `(0, 30);
        lines.push(`    section ${nodeLabel}`);
        
        // 为每个用户故事添加步骤
        nodeStories.forEach((item) => {
          const stepL...`

41. **components/canvas/ProjectBlueprint.tsx:465**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `> {
          const stepLabel = item.story.activity.replace(/"/g, '&quot;').substring(0, 40);
          const satisfaction = 75; // 默认满意度
          co...`

42. **components/canvas/WordUploader.tsx:105**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `不匹配但扩展名有效，给出警告但继续处理
    if (!isValidMimeType && file.type) {
      log('[WordUploader] MIME 类型不匹配，但扩展名有效，继续处理:', {
        fileName: file.name,
      ...`

43. **lib/ai/gateway-queue.ts:82**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `ult, queuedMs}
  const existingPromise = inFlightMap.get(key) as InFlightValue<T> | undefined;
  if (existingPromise) {
    log('🔄 [Gateway Queue] De...`

44. **lib/ai/gateway-queue.ts:167**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `aitStartMs: taskWaitStartMs,
    };
    queue.push(task as QueuedTask<unknown>);
    providerQueues.set(provider, queue);
    
    log('⏳ [Gateway Que...`

45. **lib/ai/gateway-queue.ts:195**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `rConcurrency.set(provider, current + 1);

  // ✅ 只算一次 queuedMs
  const queuedMs = Date.now() - task.waitStartMs;
  
  log('▶️ [Gateway Queue] Processi...`

46. **lib/ai/json-extract.ts:58**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `inString) {
      continue;
    }

    if (char === '{') {
      braceCount++;
    } else if (char === '}') {
      braceCount--;
      if (braceCount...`

47. **lib/ai/json-extract.ts:84**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `
    const jsonStr = extractFirstJsonObject(text);
    
    if (!jsonStr) {
      return {
        ok: false,
        error: 'No valid JSON object fou...`

48. **lib/ai/json-extract.ts:96**
   - 匹配: `.substring(`
   - 有类型检查: 是
   - 上下文: `parseError) {
      return {
        ok: false,
        error: `JSON parse error: ${parseError instanceof Error ? parseError.message : String(parseErr...`

49. **lib/ai/json-extract.ts:109**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: ` {
      return {
        ok: false,
        error: `Zod validation error: ${result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(';...`

50. **lib/ai/json-extract.ts:116**
   - 匹配: `.substring(`
   - 有类型检查: 是
   - 上下文: `sonStr,
      };
    }
  } catch (error) {
    return {
      ok: false,
      error: `Unexpected error: ${error instanceof Error ? error.message : St...`

51. **lib/ai/protocol.ts:34**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `l;
  }
  
  const closeIndex = text.indexOf(closeTag, openIndex + openTag.length);
  if (closeIndex === -1) {
    return null;
  }
  
  const start = ...`

52. **lib/preview-ui-prd-bundle.generated.ts:399**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `ength > 0 ? " " + result : result);
        continue;
      }
      let hasPostfixModifier = !!maybePostfixModifierPosition;
      let classGroupId = ...`

53. **lib/safe/preview.ts:19**
   - 匹配: `.substring(`
   - 有类型检查: 是
   - 上下文: `w(x: unknown, max: number = 200): string {
  if (x === null) return 'null';
  if (x === undefined) return 'undefined';
  
  if (typeof x === 'string')...`

54. **lib/safe/preview.ts:31**
   - 匹配: `.substring(`
   - 有类型检查: 是
   - 上下文: `) {
    return String(x);
  }
  
  // 对象类型：尝试 JSON.stringify
  if (typeof x === 'object') {
    try {
      const json = JSON.stringify(x);
      if (...`

55. **lib/ui/prompt-budget.ts:22**
   - 匹配: `.substring(`
   - 有类型检查: 是
   - 上下文: `xChars: number = 12000): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  if (input.length <= maxChars) {
    return inpu...`

56. **lib/ui/prompt-budget.ts:27**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `maxChars);
  const lastSpace = truncated.lastIndexOf(' ');
  const lastNewline = truncated.lastIndexOf('\n');
  const cutPoint = Math.max(lastSpace, l...`

57. **lib/ui/prompt-budget.ts:67**
   - 匹配: `.substring(`
   - 有类型检查: 是
   - 上下文: `x;
  }
  
  const type = x === null ? 'null' : x === undefined ? 'undefined' : typeof x;
  throw new Error(
    `[PromptBudget] ${name} must be string...`

58. **lib/ui/ui-compiler.ts:208**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `te patches for interactions.

UISpec Interactions:
${uiSpec.interactions.map(i => `- ${i.when} on ${i.selectorHint} -> ${i.action}(${i.payload})`).joi...`

59. **lib/ui-generation-helpers.ts:158**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `] HTML output exceeded limit, truncating', {
    originalLength: html.length,
    maxLength,
    truncated: true,
  });
  
  // Try to truncate at a s...`

60. **lib/ui-generation-helpers.ts:163**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `  const truncated = html.substring(0, maxLength);
  const lastTagEnd = truncated.lastIndexOf('>');
  
  if (lastTagEnd > maxLength * 0.9) {
    // Saf...`

61. **utils/codeToPrdTable.ts:23**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `tring): string {
  // 优先使用组件名
  if (componentName) {
    const match = componentName.match(/^[A-Z][a-z]+/);
    if (match) {
      return match[0].spl...`

62. **utils/codeToPrdTable.ts:33**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `(/\.(tsx|ts|jsx|js)$/, '');
  const words = nameWithoutExt.split(/[-_]/).filter(w => w.length > 0);
  
  if (words.length > 0) {
    // 取每个单词的首字母
    ...`

63. **utils/codeToPrdTable.ts:38**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `  return words.map(w => w[0].toUpperCase()).join('').substring(0, 3);
  }

  // 默认：取前3个大写字母
  const upperCase = nameWithoutExt.split('').filter(c => c...`

64. **utils/demo-router.ts:305**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `t might not be closed properly
        const bodyStart = html.indexOf('<body');
        const bodyOpenEnd = html.indexOf('>', bodyStart);
        if (...`

65. **utils/html-parser.ts:563**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: ` && !['img', 'input', 'br', 'hr', 'meta', 'link'].includes(tag)) {
      depth++;
    }
    
    // 检查闭合标签，减少深度
    const closingTagRegex = new RegExp...`

66. **utils/html-parser.ts:683**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `ce(/&lt;/g, '<') // 替换 &lt;
    .replace(/&gt;/g, '>') // 替换 &gt;
    .replace(/&quot;/g, '"') // 替换 &quot;
    .replace(/&#39;/g, "'") // 替换 &#39;
  ...`

67. **utils/html-parser.ts:891**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `t.cardContent) && textContent.cardContent.length > 0) {
      textSections.push(`**卡片内容示例（参考这些文字内容，确保使用相同的文字）：**
${textContent.cardContent.slice(0, 5)...`

68. **utils/prdGenerator.ts:1241**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `railing semicolon if present
                      if (componentCode[end] === ';') end++;
                      // Remove the entire type definition
 ...`

69. **utils/prdGenerator.ts:1241**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `               if (componentCode[end] === ';') end++;
                      // Remove the entire type definition
                      componentCode =...`

70. **utils/prdGenerator.ts:1253**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `o end of line
                  let lineEnd = componentCode.indexOf('\\n', start);
                  if (lineEnd === -1) lineEnd = componentCode.lengt...`

71. **utils/prdGenerator.ts:1253**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `lineEnd = componentCode.indexOf('\\n', start);
                  if (lineEnd === -1) lineEnd = componentCode.length;
                  componentCode =...`

72. **utils/ui-summary-extractor.ts:110**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `ectorAll('li');
    Array.from(listItems).slice(0, 10).forEach((li, index) => {
      const text = li.textContent?.trim() || '';
      if (text) {
   ...`

73. **utils/ui-summary-extractor.ts:124**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `tle"]');
      const title = titleEl?.textContent?.trim() || '';
      const content = card.textContent?.trim() || '';
      if (title || content) {
 ...`

74. **utils/ui-summary-extractor.ts:125**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `tent?.trim() || '';
      const content = card.textContent?.trim() || '';
      if (title || content) {
        summary.cards.push({
          title: ...`

75. **utils/ui-summary-extractor.ts:197**
   - 匹配: `.substring(`
   - 有类型检查: 否
   - 上下文: `<\/li>/gi);
    let liCount = 0;
    for (const match of liMatches) {
      if (liCount >= 10) break;
      const text = match[1]?.trim();
      if (t...`

