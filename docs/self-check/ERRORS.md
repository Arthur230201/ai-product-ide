# Error Hotspots

Generated: 2026-02-05T14:15:00.621Z

## Details (first hits per file)
### `src/app/actions/generate-graph.ts`

- **RateLimit_429** @ L786

```
lResult: z.infer<typeof SingleCallResultSchema> | null = null;
    let aiCallSuccess = false;
    let aiError: { type: 'RATE_LIMIT' | 'NETWORK' | 'PROVIDER' | 'PARSE'; message: string; cooldownSeconds?: number } | null = null;

    // 合并系统提示和用户提示
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

    log('⏱️ [generateGraph] t2: S
```
- **RateLimit_429** @ L819

```
rror = {
        type: llmResult.type,
        message: llmResult.message,
        cooldownSeconds: llmResult.type === 'RATE_LIMIT' ? llmResult.cooldownSeconds : undefined,
      };
    } else {
      // Parse JSON from response using safeParseZodJson (可恢复解析)
      // 确保 llmResult.data 是 string 类型
      const responseText = typeof llmResu
```
- **RateLimit_429** @ L873

```
t2_end - t2,
      success: aiCallSuccess,
      errorType: aiError?.type,
      llmMetrics,
    });

    // 如果 AI 调用失败（429/网络错误/解析错误）
    if (!aiCallSuccess && aiError) {
      // ✅ Rate Limit 错误：直接返回错误，不使用降级图
      if (aiError.type === 'RATE_LIMIT') {
        const t2_end = Date.now();
        return {
          type: 'rate_limit',
    
```
- **RateLimit_429** @ L875

```
rror?.type,
      llmMetrics,
    });

    // 如果 AI 调用失败（429/网络错误/解析错误）
    if (!aiCallSuccess && aiError) {
      // ✅ Rate Limit 错误：直接返回错误，不使用降级图
      if (aiError.type === 'RATE_LIMIT') {
        const t2_end = Date.now();
        return {
          type: 'rate_limit',
          message: aiError.message,
          cooldownSeconds: aiEr
```
- **RateLimit_429** @ L876

```
（429/网络错误/解析错误）
    if (!aiCallSuccess && aiError) {
      // ✅ Rate Limit 错误：直接返回错误，不使用降级图
      if (aiError.type === 'RATE_LIMIT') {
        const t2_end = Date.now();
        return {
          type: 'rate_limit',
          message: aiError.message,
          cooldownSeconds: aiError.cooldownSeconds,
        };
      }
      
      // 
```
- **RateLimit_429** @ L879

```
，不使用降级图
      if (aiError.type === 'RATE_LIMIT') {
        const t2_end = Date.now();
        return {
          type: 'rate_limit',
          message: aiError.message,
          cooldownSeconds: aiError.cooldownSeconds,
        };
      }
      
      // 其他错误：使用降级图
      logWarn('⚠️ [generateGraph] AI 调用失败，使用降级图', {
        requestId,
  
```
- **uiCode.substring** @ L326

```
rror('❌ [analyzeInputClarity] Tagged block not found, using fallback', {
      requestId,
      rawPreview: result.data.substring(0, 200),
    });
    return {
      confidence: 45,
      isVague: true,
      detectedDomain: '',
      detectedBusinessObject: '',
      detectedAction: '',
    };
  }

  // 使用 safeParseZodJson 进行可恢复解析
  // 确
```
- **uiCode.substring** @ L360

```
led, using fallback', {
      requestId,
      error: parseResult.error,
      rawPreview: parseResult.raw || blockText.substring(0, 200),
    });
    return {
      confidence: 45,
      isVague: true,
      detectedDomain: '',
      detectedBusinessObject: '',
      detectedAction: '',
    };
  }

  // 解析成功，使用结果
  const analysisResult =
```
- **uiCode.substring** @ L475

```
raph] 开始生成图结构（单次调用）', {
      requestId,
        promptLength: input.prompt.length,
        promptPreview: input.prompt.substring(0, 100),
        hasMedia: !!input.mediaBase64,
        mediaType: input.mediaType,
      hasAttachment: !!input.attachmentContent,
      });

      // 检查环境变量
      if (!process.env.OPENAI_API_KEY) {
      logE
```
- **uiCode.substring** @ L853

```
 {
            requestId,
            error: parseResult.error,
            rawPreview: parseResult.raw || responseText.substring(0, 500),
            llmMetrics,
          });
          aiError = {
            type: 'PARSE',
            message: `JSON 解析失败: ${parseResult.error}`,
          };
        }
      }
    }

    const t2_end = D
```
### `src/app/actions/node-operations.ts`

- **RateLimit_429** @ L86

```
xport type ReverseGenerateSpecResult = 
  | { ok: true; title: string; requirements: string[] }
  | { ok: false; type: 'RATE_LIMIT' | 'NETWORK' | 'PROVIDER' | 'PARSE'; message: string; cooldownSeconds?: number };

export async function reverseGenerateSpec(input: {
  code: string;
  nodeLabel: string;
  projectMeta?: {
    projectName: str
```
- **RateLimit_429** @ L701

```
apiDuration,
            });
        
        // Map AIResult error types to return format
        if (result.type === 'RATE_LIMIT') {
            return {
              type: 'rate_limit' as const,
            cooldownSeconds: result.cooldownSeconds || 10,
              requestId,
            message: result.message,
          };
       
```
- **RateLimit_429** @ L703

```
sult error types to return format
        if (result.type === 'RATE_LIMIT') {
            return {
              type: 'rate_limit' as const,
            cooldownSeconds: result.cooldownSeconds || 10,
              requestId,
            message: result.message,
          };
        }
        if (result.type === 'NETWORK') {
            r
```
- **RateLimit_429** @ L1112

```
Ms: apiDuration,
        });
        
        // Map AIResult error types to return format
        if (result.type === 'RATE_LIMIT') {
          return {
            type: 'rate_limit' as const,
            cooldownSeconds: result.cooldownSeconds || 10,
            requestId,
            message: result.message,
          };
        }
   
```
- **RateLimit_429** @ L1114

```
AIResult error types to return format
        if (result.type === 'RATE_LIMIT') {
          return {
            type: 'rate_limit' as const,
            cooldownSeconds: result.cooldownSeconds || 10,
            requestId,
            message: result.message,
          };
        }
        if (result.type === 'NETWORK') {
          retur
```
- **RateLimit_429** @ L1342

```
de',
        aiConfig: input.aiConfig,
      });

      if (!result.ok) {
        const errorMessage = result.type === 'RATE_LIMIT' 
          ? `请求过多，请在 ${result.cooldownSeconds || 10} 秒后重试`
          : result.message || 'PRD生成失败';
        throw new Error(errorMessage);
      }

      // 提取生成的 Markdown
      let markdown = result.data.tr
```
- **uiCode.substring** @ L222

```
// 限制最多50条需求

    if (requirements.length === 0) {
      // 如果没有解析到需求，将整个文本作为单个需求
      requirements.push(generatedText.substring(0, 200));
    }

    return {
      title: title || nodeLabel,
      requirements: requirements,
    };
  } catch (error) {
    logError('❌ [reverseGenerateSpec] Error:', error);
    const errorMessage = error 
```
- **uiCode.substring** @ L346

```
 限制最多20个测试用例

    if (cases.length === 0) {
      // 如果没有解析到测试用例，将整个文本作为单个测试用例
      const fallbackCase = generatedText.substring(0, 500);
      if (fallbackCase.length > 0) {
        cases.push(fallbackCase);
      } else {
        // 如果还是空的，返回默认测试用例
        cases.push('功能正常流程测试');
        cases.push('数据验证测试');
        cases.push('异常情况处理
```
- **uiCode.substring** @ L440

```
       inputLength: input.imageBase64.length,
        base64Length: base64Data.length,
        base64Prefix: base64Data.substring(0, 30),
      });

      // 构建设计系统约束（如果提供了主题配置）
      let designSystemEnforcement = '';
      if (input.themeConfig) {
        const theme = input.themeConfig;
        // 检查用户是否明确要求深色主题（通过检查背景色是否明确设置为深色）
      
```
- **uiCode.substring** @ L651

```
    log('💬 [generateUIFromImage] 用户提示词:', {
        promptLength: userPrompt.length,
        promptPreview: userPrompt.substring(0, 100),
      });

      // 调用 OpenAI 视觉模型生成代码
      // 获取模型配置
      const visionModel = getVisionModel(input.aiConfig);
      log(`🤖 [generateUIFromImage] 开始调用 OpenAI API (${visionModel})...`);
      log('⏱️
```

> …(4 more)

### `src/app/actions/ui-pipeline-response.test.ts`

- **RateLimit_429** @ L61

```
nse: already valid UIPipelineResponse (error)', () => {
  const valid: UIPipelineResponse = {
    ok: false,
    type: 'RATE_LIMIT',
    message: 'Too many requests',
    cooldownSeconds: 10,
    retryable: true,
  };

  const result = normalizeUIPipelineResponse(valid);
  assertEqual(result, valid);
  assertEqual(result.ok, false);
  ass
```
- **RateLimit_429** @ L62

```
neResponse (error)', () => {
  const valid: UIPipelineResponse = {
    ok: false,
    type: 'RATE_LIMIT',
    message: 'Too many requests',
    cooldownSeconds: 10,
    retryable: true,
  };

  const result = normalizeUIPipelineResponse(valid);
  assertEqual(result, valid);
  assertEqual(result.ok, false);
  assertEqual(result.type, 'RATE
```
- **RateLimit_429** @ L70

```
zeUIPipelineResponse(valid);
  assertEqual(result, valid);
  assertEqual(result.ok, false);
  assertEqual(result.type, 'RATE_LIMIT');
});

test('normalizeUIPipelineResponse: zsa-react tuple [data, null] (success case)', () => {
  const data: UIPipelineResponse = {
    ok: true,
    type: 'UI_HTML',
    stage: 'BEAUTIFY',
    html: '<html>
```
- **RateLimit_429** @ L112

```
test('normalizeUIPipelineResponse: zsa-react tuple [undefined, Error] (error case)', () => {
  const error = new Error('Rate limit exceeded');
  (error as any).cooldownSeconds = 15;
  const tuple: [undefined, Error] = [undefined, error];
  const result = normalizeUIPipelineResponse(tuple);

  assertEqual(result.ok, false);
  assertEqual(r
```
- **RateLimit_429** @ L118

```
or];
  const result = normalizeUIPipelineResponse(tuple);

  assertEqual(result.ok, false);
  assertEqual(result.type, 'RATE_LIMIT');
  if (!result.ok) {
    assertEqual(result.message, 'Rate limit exceeded');
    assertEqual(result.cooldownSeconds, 15);
    assertEqual(result.retryable, true);
  }
});

test('normalizeUIPipelineResponse: 
```
- **RateLimit_429** @ L120

```
Equal(result.ok, false);
  assertEqual(result.type, 'RATE_LIMIT');
  if (!result.ok) {
    assertEqual(result.message, 'Rate limit exceeded');
    assertEqual(result.cooldownSeconds, 15);
    assertEqual(result.retryable, true);
  }
});

test('normalizeUIPipelineResponse: zsa-react tuple [data, Error] (error takes precedence)', () => {
  
```
### `src/app/actions/ui-pipeline-response.ts`

- **RateLimit_429** @ L28

```
neStage;
      html: string;
      meta: HTMLMeta;
      warnings?: string[];
    }
  | {
      ok: false;
      type: 'RATE_LIMIT' | 'NETWORK' | 'PROVIDER' | 'PARSE' | 'VALIDATION';
      message: string;
      cooldownSeconds?: number;
      retryable: boolean;
    };

/**
 * Map AIResult to UIPipelineResponse (error case only)
 */
expo
```
- **RateLimit_429** @ L42

```
  stage: UIPipelineStage
): UIPipelineResponse {
  // Map AI error types to UIPipeline error types
  let pipelineType: 'RATE_LIMIT' | 'NETWORK' | 'PROVIDER' | 'PARSE' | 'VALIDATION' = 'PROVIDER';
  let retryable = true;

  if ('type' in aiResult) {
    switch (aiResult.type) {
      case 'RATE_LIMIT':
        pipelineType = 'RATE_LIMIT';

```
- **RateLimit_429** @ L47

```
VALIDATION' = 'PROVIDER';
  let retryable = true;

  if ('type' in aiResult) {
    switch (aiResult.type) {
      case 'RATE_LIMIT':
        pipelineType = 'RATE_LIMIT';
        retryable = true;
        break;
      case 'NETWORK':
        pipelineType = 'NETWORK';
        retryable = true;
        break;
      case 'PROVIDER':
        p
```
- **RateLimit_429** @ L48

```
able = true;

  if ('type' in aiResult) {
    switch (aiResult.type) {
      case 'RATE_LIMIT':
        pipelineType = 'RATE_LIMIT';
        retryable = true;
        break;
      case 'NETWORK':
        pipelineType = 'NETWORK';
        retryable = true;
        break;
      case 'PROVIDER':
        pipelineType = 'PROVIDER';
        ret
```
- **RateLimit_429** @ L92

```
)) {
    // Check if it's already in the correct format
    if ('ok' in raw && (raw.type === 'UI_HTML' || raw.type === 'RATE_LIMIT' || raw.type === 'NETWORK' || raw.type === 'PROVIDER' || raw.type === 'PARSE' || raw.type === 'VALIDATION')) {
      return raw as UIPipelineResponse;
    }
    
    // Case 3: Wrapped format {result: ..., ...
```
- **RateLimit_429** @ L113

```
 (error as any)?.cooldownSeconds;
      
      // Determine error type from error message or structure
      let type: 'RATE_LIMIT' | 'NETWORK' | 'PROVIDER' | 'PARSE' | 'VALIDATION' = 'PROVIDER';
      if (errorMessage.toLowerCase().includes('rate') || errorMessage.toLowerCase().includes('limit')) {
        type = 'RATE_LIMIT';
      } el
```
- **RateLimit_429** @ L115

```
     if (errorMessage.toLowerCase().includes('rate') || errorMessage.toLowerCase().includes('limit')) {
        type = 'RATE_LIMIT';
      } else if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('fetch')) {
        type = 'NETWORK';
      }
      
      return {
        ok: false,
        type,
   
```
- **RateLimit_429** @ L125

```
{
        ok: false,
        type,
        message: errorMessage,
        cooldownSeconds,
        retryable: type === 'RATE_LIMIT' || type === 'NETWORK',
      };
    }
    
    // No error, normalize the data
    if (data) {
      return normalizeUIPipelineResponse(data);
    }
  }
  
  // Fallback: Invalid response format
  return {
  
```
### `src/components/canvas/CommandBar.tsx`

- **RateLimit_429** @ L39

```
tate(0);
  // 超时覆盖标志：当超时发生时，强制重置所有 loading 状态
  const [isTimeoutOverride, setIsTimeoutOverride] = useState(false);
  // RATE_LIMIT 冷却状态
  const [rateLimitCooldown, setRateLimitCooldown] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tex
```
- **RateLimit_429** @ L40

```
生时，强制重置所有 loading 状态
  const [isTimeoutOverride, setIsTimeoutOverride] = useState(false);
  // RATE_LIMIT 冷却状态
  const [rateLimitCooldown, setRateLimitCooldown] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTex
```
- **RateLimit_429** @ L40

```
 const [isTimeoutOverride, setIsTimeoutOverride] = useState(false);
  // RATE_LIMIT 冷却状态
  const [rateLimitCooldown, setRateLimitCooldown] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
 
```
- **RateLimit_429** @ L123

```
 未知的返回格式:', {
          result,
          resultType: typeof result,
        });
        return;
      }

      // ✅ 检查 Rate Limit 错误（扁平结构）
      // 可能被 zsa-react 包装，检查多种路径
      // 先尝试解包（如果被包装在 data 中）
      const unwrappedData = (resultData as any)?.data || resultData;
      
      // ✅ 立即检查 Rate Limit，如果匹配则提前返回
      const rateLimitTyp
```
- **RateLimit_429** @ L128

```
    // 先尝试解包（如果被包装在 data 中）
      const unwrappedData = (resultData as any)?.data || resultData;
      
      // ✅ 立即检查 Rate Limit，如果匹配则提前返回
      const rateLimitType = unwrappedData?.type;
      
      // ✅ 调试日志：确保 unwrappedData 已定义
      log('🔍 [CommandBar] Rate Limit 检查:', {
        hasUnwrappedData: !!unwrappedData,
        resultDat
```
- **RateLimit_429** @ L129

```
 const unwrappedData = (resultData as any)?.data || resultData;
      
      // ✅ 立即检查 Rate Limit，如果匹配则提前返回
      const rateLimitType = unwrappedData?.type;
      
      // ✅ 调试日志：确保 unwrappedData 已定义
      log('🔍 [CommandBar] Rate Limit 检查:', {
        hasUnwrappedData: !!unwrappedData,
        resultDataType: resultData?.type,
        
```
- **RateLimit_429** @ L132

```
      const rateLimitType = unwrappedData?.type;
      
      // ✅ 调试日志：确保 unwrappedData 已定义
      log('🔍 [CommandBar] Rate Limit 检查:', {
        hasUnwrappedData: !!unwrappedData,
        resultDataType: resultData?.type,
        resultDataHasData: !!(resultData as any)?.data,
        resultDataDataKeys: (resultData as any)?.data ? Obje
```
- **RateLimit_429** @ L139

```
appedDataType: unwrappedData?.type,
        unwrappedDataKeys: unwrappedData ? Object.keys(unwrappedData) : [],
        rateLimitType,
        willMatch: rateLimitType === 'rate_limit',
        resultDataString: preview(JSON.stringify(resultData), 200),
      });
      
      // ✅ 立即检查 Rate Limit，如果匹配则提前返回
      if (rateLimitType === 'rat
```
- **RateLimit_429** @ L140

```
,
        unwrappedDataKeys: unwrappedData ? Object.keys(unwrappedData) : [],
        rateLimitType,
        willMatch: rateLimitType === 'rate_limit',
        resultDataString: preview(JSON.stringify(resultData), 200),
      });
      
      // ✅ 立即检查 Rate Limit，如果匹配则提前返回
      if (rateLimitType === 'rate_limit') {
        // 获取 cooldown
```
- **RateLimit_429** @ L140

```
DataKeys: unwrappedData ? Object.keys(unwrappedData) : [],
        rateLimitType,
        willMatch: rateLimitType === 'rate_limit',
        resultDataString: preview(JSON.stringify(resultData), 200),
      });
      
      // ✅ 立即检查 Rate Limit，如果匹配则提前返回
      if (rateLimitType === 'rate_limit') {
        // 获取 cooldownSeconds（从多个可能的路径）
 
```

> …(43 more)

### `src/components/canvas/HtmlFirstPreview.tsx`

- **uiCode.substring** @ L582

```
响应式更新
          <div className="w-full h-full relative">
            <HtmlSandbox
              key={`edit-${htmlSource.substring(0, 50)}`} // 使用 key 强制重新渲染
              html={htmlSource}
              mode="edit"
              injectorScript={buildEditorInjector({ mode: 'edit' }) + '\n' + buildInjectorScript({})}
              heightMod
```
- **uiCode.substring** @ L608

```
更新
          <div className="w-full h-full relative">
            <HtmlSandbox
              key={`preview-${htmlSource.substring(0, 50)}`} // 使用 key 强制重新渲染
              html={htmlSource}
              mode="preview"
              injectorScript={buildInjectorScript({})}
              heightMode="auto"
              className="w-full h-f
```
### `src/components/canvas/ProjectBlueprint.tsx`

- **uiCode.substring** @ L478

```
 [];
      if (nodeStories.length > 0) {
        const nodeLabel = (node.data.label || node.id).replace(/"/g, '&quot;').substring(0, 30);
        lines.push(`    section ${nodeLabel}`);
        
        // 为每个用户故事添加步骤
        nodeStories.forEach((item) => {
          const stepLabel = item.story.activity.replace(/"/g, '&quot;').substring(
```
- **uiCode.substring** @ L483

```
户故事添加步骤
        nodeStories.forEach((item) => {
          const stepLabel = item.story.activity.replace(/"/g, '&quot;').substring(0, 40);
          const satisfaction = 75; // 默认满意度
          const role = item.story.role.replace(/"/g, '&quot;').substring(0, 20);
          lines.push(`      ${stepLabel}: ${satisfaction}: ${role}`);
       
```
- **uiCode.substring** @ L485

```
ring(0, 40);
          const satisfaction = 75; // 默认满意度
          const role = item.story.role.replace(/"/g, '&quot;').substring(0, 20);
          lines.push(`      ${stepLabel}: ${satisfaction}: ${role}`);
        });
      }
    });

    return lines.join('\n');
  }, [generateUserJourneyTable, nodes]);

  // 为单个用户故事生成Mermaid序列图（基于业务事件）
```
### `src/components/canvas/WordUploader.tsx`

- **uiCode.substring** @ L105

```
ader] MIME 类型不匹配，但扩展名有效，继续处理:', {
        fileName: file.name,
        fileType: file.type,
        extension: fileName.substring(fileName.lastIndexOf('.'))
      });
    }

    // 验证文件大小（限制 10MB）
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('文件大小不能超过 10MB');
      return;
    }

    log('
```
### `src/lib/ai/gateway-queue.ts`

- **uiCode.substring** @ L82

```
 | undefined;
  if (existingPromise) {
    log('🔄 [Gateway Queue] Deduplication hit', {
      provider,
      key: key.substring(0, 50) + '...',
    });

    const { result } = await existingPromise;
    // ✅ 计算实际等待时间（dedup 的 caller 也可能等了几百 ms / 几秒）
    const queuedMs = Date.now() - waitStartMs;
    return {
      result,
      metrics: 
```
- **uiCode.substring** @ L167

```
    providerQueues.set(provider, queue);
    
    log('⏳ [Gateway Queue] Task queued', {
      provider,
      key: key.substring(0, 50) + '...',
      queueLength: queue.length,
    });
  });
}

/**
 * Process next task in provider queue
 */
function processQueue(provider: string): void {
  const queue = providerQueues.get(provider) || [
```
- **uiCode.substring** @ L195

```
 Date.now() - task.waitStartMs;
  
  log('▶️ [Gateway Queue] Processing queued task', {
    provider,
    key: task.key.substring(0, 50) + '...',
    queuedMs,
  });

  Promise.resolve(task.fn({ queuedMs, dedupHit: false }))
    .then((result) => task.resolve({ result, queuedMs }))
    .catch((error) =>
      task.reject({
        __gatew
```
### `src/lib/ai/json-extract.ts`

- **uiCode.substring** @ L58

```
  } else if (char === '}') {
      braceCount--;
      if (braceCount === 0) {
        // 找到完整对象
        return trimmed.substring(startPos, i + 1);
      }
    }
  }

  // 未找到完整对象
  return null;
}

/**
 * 安全解析 JSON 并验证 Zod Schema
 * 内部：extractFirstJsonObject -> JSON.parse -> schema.safeParse
 * 失败时返回 ok:false，不抛异常
 */
export function safe
```
- **uiCode.substring** @ L84

```
 return {
        ok: false,
        error: 'No valid JSON object found in text',
        raw: text.length > 200 ? text.substring(0, 200) + '...' : text,
      };
    }

    // 步骤2: 解析 JSON
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseError) {
      return {
        ok: false,
        error: `JS
```
- **uiCode.substring** @ L96

```
 ${parseError instanceof Error ? parseError.message : String(parseError)}`,
        raw: jsonStr.length > 200 ? jsonStr.substring(0, 200) + '...' : jsonStr,
      };
    }

    // 步骤3: Zod 验证
    const result = schema.safeParse(parsed);
    
    if (result.success) {
      return { ok: true, data: result.data };
    } else {
      return 
```
- **uiCode.substring** @ L109

```
lt.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')}`,
        raw: jsonStr.length > 200 ? jsonStr.substring(0, 200) + '...' : jsonStr,
      };
    }
  } catch (error) {
    return {
      ok: false,
      error: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
      raw: text.length > 2
```
- **uiCode.substring** @ L116

```
ror: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
      raw: text.length > 200 ? text.substring(0, 200) + '...' : text,
    };
  }
}


```
### `src/lib/ai/llm.ts`

- **RateLimit_429** @ L7

```
l AI calls.
 * - maxRetries: 0 (no SDK retries)
 * - AbortSignal timeout for fast-fail
 * - In-memory cooldown gate for 429
 */

import { generateText, generateObject } from 'ai';
import { getOpenAIClient } from '@/lib/openai-client';
import { log, logError, logWarn } from '@/lib/logger';
import { runQueued, stableHash, type GatewayTaskKe
```
- **RateLimit_429** @ L20

```
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
  | { ok: true; dat
```
- **RateLimit_429** @ L22

```
d';

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
  | { ok: true; data: T; raw?: string; metrics: { queuedMs: number; dedupHit: boolea
```
- **RateLimit_429** @ L33

```
ldownSeconds?: number; raw?: string; metrics: { queuedMs: number; dedupHit: boolean; totalMs: number } };

/**
 * Local rate limit cooldown gate (in-memory)
 */
let rateLimitUntilMs = 0;

/**
 * Check if rate limit cooldown gate is active
 */
function checkCooldownGate(): { blocked: boolean; cooldownSeconds: number } {
  const now = Date.
```
- **RateLimit_429** @ L35

```
 { queuedMs: number; dedupHit: boolean; totalMs: number } };

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
    co
```
- **RateLimit_429** @ L38

```
 totalMs: number } };

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
    const remainingSeconds = Math.ceil((rateL
```
- **RateLimit_429** @ L42

```
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
 *
```
- **RateLimit_429** @ L43

```
wnSeconds: number } {
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
function updat
```
- **RateLimit_429** @ L50

```
remainingSeconds };
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
    untilMs: rateLimit
```
- **RateLimit_429** @ L53

```
;
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
functi
```

> …(25 more)

### `src/lib/ai/protocol.ts`

- **uiCode.substring** @ L34

```
;
  if (closeIndex === -1) {
    return null;
  }
  
  const start = openIndex + openTag.length;
  const content = text.substring(start, closeIndex).trim();
  
  return content;
}



```
### `src/lib/graph/fallback-graph.ts`

- **RateLimit_429** @ L4

```
/**
 * Deterministic Fallback Graph Builder
 * 
 * Rule-based graph generation when AI fails or rate-limited.
 * Always returns valid schema with non-empty nodes.
 */

import type { FractalNode } from '@/types/fractal';
import type { Edge } from 'reactflow';

export interface FallbackGraphResult {
  global: {
    u
```
### `src/lib/openai-client.ts`

- **RateLimit_429** @ L112

```
text.attemptNumber || 0) + 1;
      }
      
      const response = await fetch(url, fetchOptions);

      // Check for 429 Rate Limit - pass through to llm.ts for handling
      // llm.ts is the single source of truth for cooldown gate
      if (response.status === 429) {
        if (timeoutId) clearTimeout(timeoutId);
        const elap
```
- **RateLimit_429** @ L112

```
.attemptNumber || 0) + 1;
      }
      
      const response = await fetch(url, fetchOptions);

      // Check for 429 Rate Limit - pass through to llm.ts for handling
      // llm.ts is the single source of truth for cooldown gate
      if (response.status === 429) {
        if (timeoutId) clearTimeout(timeoutId);
        const elapsed 
```
- **RateLimit_429** @ L114

```
gh to llm.ts for handling
      // llm.ts is the single source of truth for cooldown gate
      if (response.status === 429) {
        if (timeoutId) clearTimeout(timeoutId);
        const elapsed = Date.now() - startTime;
        
        // Extract Retry-After header for llm.ts to use
        const retryAfter = response.headers.get('ret
```
- **RateLimit_429** @ L129

```
parsed > 0) {
            cooldownSeconds = parsed;
          }
        }
        
        logError('🚫 [OpenAI Client] 429 Rate Limit detected (will be handled by llm.ts)', {
          requestId,
          elapsedMs: elapsed,
          cooldownSeconds,
          retryAfter: retryAfter || 'not provided',
        });
        
        // Th
```
- **RateLimit_429** @ L129

```
ed > 0) {
            cooldownSeconds = parsed;
          }
        }
        
        logError('🚫 [OpenAI Client] 429 Rate Limit detected (will be handled by llm.ts)', {
          requestId,
          elapsedMs: elapsed,
          cooldownSeconds,
          retryAfter: retryAfter || 'not provided',
        });
        
        // Throw 
```
- **RateLimit_429** @ L137

```
 provided',
        });
        
        // Throw error with cooldown info - llm.ts will catch and handle
        const rateLimitError = new Error('Rate limit exceeded') as Error & {
          statusCode?: number;
          cooldownSeconds?: number;
        };
        rateLimitError.statusCode = 429;
        rateLimitError.cooldownSeconds
```
- **RateLimit_429** @ L137

```
    
        // Throw error with cooldown info - llm.ts will catch and handle
        const rateLimitError = new Error('Rate limit exceeded') as Error & {
          statusCode?: number;
          cooldownSeconds?: number;
        };
        rateLimitError.statusCode = 429;
        rateLimitError.cooldownSeconds = cooldownSeconds;
        
```
- **RateLimit_429** @ L141

```
ate limit exceeded') as Error & {
          statusCode?: number;
          cooldownSeconds?: number;
        };
        rateLimitError.statusCode = 429;
        rateLimitError.cooldownSeconds = cooldownSeconds;
        requestContexts.delete(requestId);
        throw rateLimitError;
      }

      if (timeoutId) clearTimeout(timeoutId);
 
```
- **RateLimit_429** @ L141

```
r & {
          statusCode?: number;
          cooldownSeconds?: number;
        };
        rateLimitError.statusCode = 429;
        rateLimitError.cooldownSeconds = cooldownSeconds;
        requestContexts.delete(requestId);
        throw rateLimitError;
      }

      if (timeoutId) clearTimeout(timeoutId);
      requestContexts.delete(
```
- **RateLimit_429** @ L142

```
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
 
```

> …(4 more)

### `src/lib/safe/preview.ts`

- **uiCode.substring** @ L19

```
(x === undefined) return 'undefined';
  
  if (typeof x === 'string') {
    if (x.length <= max) return x;
    return x.substring(0, max) + '...';
  }
  
  if (typeof x === 'number' || typeof x === 'boolean') {
    return String(x);
  }
  
  // 对象类型：尝试 JSON.stringify
  if (typeof x === 'object') {
    try {
      const json = JSON.stringi
```
- **uiCode.substring** @ L31

```
object') {
    try {
      const json = JSON.stringify(x);
      if (json.length <= max) return json;
      return json.substring(0, max) + '...';
    } catch {
      return '[Object]';
    }
  }
  
  return String(x);
}

/**
 * 确保值为字符串类型，否则抛出错误
 * 用于需要强保证的地方（如业务逻辑中的 substring 调用）
 * @param x 输入值
 * @param name 变量名（用于错误信息）
 * @returns 字符串
```
### `src/lib/ui/prompt-budget.ts`

- **uiCode.substring** @ L22

```
  return '';
  }
  
  if (input.length <= maxChars) {
    return input;
  }
  
  // 尝试在单词边界截断
  const truncated = input.substring(0, maxChars);
  const lastSpace = truncated.lastIndexOf(' ');
  const lastNewline = truncated.lastIndexOf('\n');
  const cutPoint = Math.max(lastSpace, lastNewline, maxChars - 100);
  
  return truncated.substr
```
- **uiCode.substring** @ L27

```
truncated.lastIndexOf('\n');
  const cutPoint = Math.max(lastSpace, lastNewline, maxChars - 100);
  
  return truncated.substring(0, cutPoint) + '\n...<clamped>';
}

/**
 * 安全转换为字符串，非string类型返回fallback
 * @param x 输入值
 * @param fallback 默认值（默认空字符串）
 * @returns 字符串
 */
export function safeString(x: unknown, fallback: string = ''): string {
```
- **uiCode.substring** @ L67

```
peof x;
  throw new Error(
    `[PromptBudget] ${name} must be string, got ${type}. ` +
    `Value: ${JSON.stringify(x).substring(0, 100)}`
  );
}

/**
 * 估算token数（粗略：1 token ≈ 4 字符）
 */
export function estimateTokens(text: string): number {
  return Math.ceil((text || '').length / 4);
}

/**
 * Prompt 片段（用于预算控制）
 */
export interface Prom
```
### `src/lib/ui/ui-compiler.ts`

- **uiCode.substring** @ L208

```
 `- ${i.when} on ${i.selectorHint} -> ${i.action}(${i.payload})`).join('\n')}

Base HTML (first 2000 chars):
${baseHtml.substring(0, 2000)}...

# Output Format
Output ONLY one tagged block:
<AI_PATCH>
[
  {"op": "SET_ATTR", "selector": "button.submit", "name": "data-action", "value": "submit"},
  {"op": "SET_ATTR", "selector": "input.sear
```
### `src/lib/ui-generation-helpers.ts`

- **RateLimit_429** @ L6

```
 Provides type-safe utilities for UI generation with strict quality constraints:
 * - Precise stage timing (t0-t4)
 * - Rate limit fast-fail (<5s)
 * - Network error retry (max 1, with jitter)
 * - Output size limits
 */

import { log, logError } from './logger';

/**
 * Stage timing information for performance tracking
 */
export interfa
```
- **RateLimit_429** @ L94

```
'number') {
      return error.retryAfter;
    }
  }
  
  return 10; // Default cooldown
}

/**
 * Checks if error is a rate limit (429) error
 */
export function isRateLimitError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  
  const errorMessage = error instanceof Error ? error.message : String(er
```
- **RateLimit_429** @ L94

```
      return error.retryAfter;
    }
  }
  
  return 10; // Default cooldown
}

/**
 * Checks if error is a rate limit (429) error
 */
export function isRateLimitError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  r
```
- **RateLimit_429** @ L96

```
  }
  }
  
  return 10; // Default cooldown
}

/**
 * Checks if error is a rate limit (429) error
 */
export function isRateLimitError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  return (
    errorMessage.includes
```
- **RateLimit_429** @ L102

```
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  return (
    errorMessage.includes('429') ||
    errorMessage.includes('Too Many Requests') ||
    errorMessage.includes('rate limit') ||
    errorMessage.includes('Rate limit') ||
    ('statusCode' in error && error.statusCode === 429) ||
    ('status' in
```
- **RateLimit_429** @ L103

```
eof Error ? error.message : String(error);
  
  return (
    errorMessage.includes('429') ||
    errorMessage.includes('Too Many Requests') ||
    errorMessage.includes('rate limit') ||
    errorMessage.includes('Rate limit') ||
    ('statusCode' in error && error.statusCode === 429) ||
    ('status' in error && error.status === 429)
  );
```
- **RateLimit_429** @ L104

```
turn (
    errorMessage.includes('429') ||
    errorMessage.includes('Too Many Requests') ||
    errorMessage.includes('rate limit') ||
    errorMessage.includes('Rate limit') ||
    ('statusCode' in error && error.statusCode === 429) ||
    ('status' in error && error.status === 429)
  );
}

/**
 * Checks if error is a network error (ret
```
- **RateLimit_429** @ L105

```
    errorMessage.includes('Too Many Requests') ||
    errorMessage.includes('rate limit') ||
    errorMessage.includes('Rate limit') ||
    ('statusCode' in error && error.statusCode === 429) ||
    ('status' in error && error.status === 429)
  );
}

/**
 * Checks if error is a network error (retryable)
 */
export function isNetworkError(
```
- **RateLimit_429** @ L106

```
includes('rate limit') ||
    errorMessage.includes('Rate limit') ||
    ('statusCode' in error && error.statusCode === 429) ||
    ('status' in error && error.status === 429)
  );
}

/**
 * Checks if error is a network error (retryable)
 */
export function isNetworkError(error: unknown): boolean {
  if (!error || typeof error !== 'object
```
- **RateLimit_429** @ L107

```
('Rate limit') ||
    ('statusCode' in error && error.statusCode === 429) ||
    ('status' in error && error.status === 429)
  );
}

/**
 * Checks if error is a network error (retryable)
 */
export function isNetworkError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  
  const errorMessage = error in
```

> …(21 more)

### `src/lib/user-facing-messages.ts`

- **RateLimit_429** @ L20

```
escription(
  type: AIErrorType | PipelineErrorType,
  cooldownSeconds?: number
): string {
  switch (type) {
    case 'RATE_LIMIT':
      return typeof cooldownSeconds === 'number' && cooldownSeconds > 0
        ? `操作过于频繁，请 ${cooldownSeconds} 秒后重试`
        : '操作过于频繁，请稍后重试';
    case 'NETWORK':
      return '网络异常，请检查网络后重试。';
    case 'PRO
```
### `src/utils/codeToPrdTable.ts`

- **uiCode.substring** @ L23

```
ame.match(/^[A-Z][a-z]+/);
    if (match) {
      return match[0].split('').filter(c => c === c.toUpperCase()).join('').substring(0, 3).toUpperCase();
    }
  }

  // 从文件名提取
  const nameWithoutExt = fileName.replace(/\.(tsx|ts|jsx|js)$/, '');
  const words = nameWithoutExt.split(/[-_]/).filter(w => w.length > 0);
  
  if (words.length > 0
```
- **uiCode.substring** @ L33

```
 => w.length > 0);
  
  if (words.length > 0) {
    // 取每个单词的首字母
    return words.map(w => w[0].toUpperCase()).join('').substring(0, 3);
  }

  // 默认：取前3个大写字母
  const upperCase = nameWithoutExt.split('').filter(c => c === c.toUpperCase()).join('');
  return upperCase.substring(0, 3) || 'GEN';
}

/**
 * 识别UI区域
 */
function identifyZone(ele
```
- **uiCode.substring** @ L38

```
认：取前3个大写字母
  const upperCase = nameWithoutExt.split('').filter(c => c === c.toUpperCase()).join('');
  return upperCase.substring(0, 3) || 'GEN';
}

/**
 * 识别UI区域
 */
function identifyZone(element: string, context: string): string {
  const lowerElement = element.toLowerCase();
  const lowerContext = context.toLowerCase();

  // 顶部导航
  if
```
### `src/utils/demo-router.ts`

- **uiCode.substring** @ L305

```
       const bodyOpenEnd = html.indexOf('>', bodyStart);
        if (bodyOpenEnd !== -1) {
          bodyContent = html.substring(bodyOpenEnd + 1);
        }
      }
    }

    // Update body content
    if (iframeDoc.body) {
      iframeDoc.body.innerHTML = bodyContent;
    } else {
      // If body doesn't exist, create it
      const b
```
### `src/utils/html-parser.ts`

- **uiCode.substring** @ L563

```

    }
    
    // 检查闭合标签，减少深度
    const closingTagRegex = new RegExp(`</${tag}>`, 'gi');
    const nextMatch = cleaned.substring(match.index + match[0].length);
    if (closingTagRegex.test(nextMatch)) {
      // 找到闭合标签后，深度会自然减少
    }
  }

  return structure.join('\n'); // 移除数量限制，返回所有提取的结构
}

/**
 * 提取HTML中的所有可见文字内容
 * 这是确保AI使用正确文字的关键函数

```
- **uiCode.substring** @ L683

```
quot;/g, '"') // 替换 &quot;
    .replace(/&#39;/g, "'") // 替换 &#39;
    .replace(/\s+/g, ' ') // 合并多个空格
    .trim()
    .substring(0, 10000); // 限制长度，避免过长
  
  return {
    buttons: buttons.filter(Boolean),
    labels: labels.filter(Boolean),
    menuItems: menuItems.filter(Boolean),
    cardTitles: cardTitles.filter(Boolean),
    cardCont
```
- **uiCode.substring** @ L891

```
**卡片内容示例（参考这些文字内容，确保使用相同的文字）：**
${textContent.cardContent.slice(0, 5).map((content, idx) => `- 卡片${idx + 1}: "${content.substring(0, 200)}${content.length > 200 ? '...' : ''}"`).join('\n')}`);
    }
    
    if (textSections.length > 0) {
      sections.push(`**=== HTML文字内容（必须严格遵守） ===**

${textSections.join('\n\n')}

**文字使用要求（强制）：**
- **
```
### `src/utils/prdGenerator.ts`

- **uiCode.substring** @ L1244

```
) end++;
                      // Remove the entire type definition
                      componentCode = componentCode.substring(0, start) + componentCode.substring(end);
                      foundEnd = true;
                      break;
                    }
                  }
                  i++;
                }
                

```
- **uiCode.substring** @ L1244

```
move the entire type definition
                      componentCode = componentCode.substring(0, start) + componentCode.substring(end);
                      foundEnd = true;
                      break;
                    }
                  }
                  i++;
                }
                
                if (!foundEnd) {
   
```
- **uiCode.substring** @ L1256

```
;
                  if (lineEnd === -1) lineEnd = componentCode.length;
                  componentCode = componentCode.substring(0, start) + componentCode.substring(lineEnd);
                }
                
                // Reset regex lastIndex to avoid infinite loop
                typeRegex.lastIndex = start;
              }
    
```
- **uiCode.substring** @ L1256

```
-1) lineEnd = componentCode.length;
                  componentCode = componentCode.substring(0, start) + componentCode.substring(lineEnd);
                }
                
                // Reset regex lastIndex to avoid infinite loop
                typeRegex.lastIndex = start;
              }
              
              // Remove i
```
### `src/utils/ui-summary-extractor.ts`

- **uiCode.substring** @ L110

```
     const text = li.textContent?.trim() || '';
      if (text) {
        summary.listItems.push({
          text: text.substring(0, 100), // Limit length
          selector: `li:nth-of-type(${index + 1})`,
        });
      }
    });

    // Extract cards (divs with card-like classes or structure)
    const cards = body.querySelectorAll(
```
- **uiCode.substring** @ L124

```
ent = card.textContent?.trim() || '';
      if (title || content) {
        summary.cards.push({
          title: title.substring(0, 50),
          content: content.substring(0, 200),
          selector: card.id ? `#${card.id}` : `.card:nth-of-type(${index + 1})`,
        });
      }
    });
  } catch (error) {
    console.error('[extract
```
- **uiCode.substring** @ L125

```
f (title || content) {
        summary.cards.push({
          title: title.substring(0, 50),
          content: content.substring(0, 200),
          selector: card.id ? `#${card.id}` : `.card:nth-of-type(${index + 1})`,
        });
      }
    });
  } catch (error) {
    console.error('[extractUISummaryFromHTML] Error:', error);
  }

  re
```
- **uiCode.substring** @ L197

```
iCount >= 10) break;
      const text = match[1]?.trim();
      if (text) {
        summary.listItems.push({ text: text.substring(0, 100) });
        liCount++;
      }
    }
  } catch (error) {
    console.error('[extractUISummaryFromReact] Error:', error);
  }

  return summary;
}

/**
 * Format UI summary as context string for AI promp
```


## What to correlate with your logs
- 429 + cooldown gate means: single click still waits long (retries + sleeps).
- JSON parse error often means: model returned multiple JSON objects or extra text. Fix by strict extractor.
- uiCode.substring crash means: UI action returned non-string (object/union); must hard-validate.
