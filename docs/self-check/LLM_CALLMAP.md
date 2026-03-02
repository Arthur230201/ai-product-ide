# LLM Call Map

Generated: 2026-02-05T14:15:00.621Z

## Top files by LLM-related hits

1. `src/lib/ai/llm.ts` — 30
2. `src/lib/openai-client.ts` — 24
3. `src/lib/ui-generation-helpers.ts` — 24
4. `src/app/actions/ui-pipeline-new.ts` — 15
5. `src/app/actions/ui-pipeline.ts` — 15
6. `src/components/canvas/HtmlSandboxRenderer.tsx` — 15
7. `src/app/actions/ui-pipeline-response.ts` — 10
8. `src/components/canvas/CommandBar.tsx` — 10
9. `src/utils/demo-router.ts` — 10
10. `src/utils/prdGenerator.ts` — 10
11. `src/app/actions/ui-pipeline-response.test.ts` — 6
12. `src/lib/ai/gateway-queue.ts` — 5
13. `src/app/page.tsx` — 4
14. `src/lib/ai/llm-mock.ts` — 4
15. `src/app/actions/node-operations.ts` — 3



## Details (first hits per file)
### `src/app/actions/generate-graph.ts`

- **Timeout** @ L299

```
ntent}"`;

  // Call LLM gateway with callText
  const result = await callText({
    model,
    prompt: userPrompt,
    timeoutMs: 30000, // 30s timeout for clarity analysis
    aiConfig,
  });

  // Handle errors - return fallback instead of throwing
  if (!result.ok) {
    logError('❌ [analyzeInputClarity] 分析失败，使用 fallback', {
      req
```
- **Timeout** @ L799

```
sedMs: t2 - t0,
    });

    const llmResult = await callText({
      model: textModel,
      prompt: fullPrompt,
      timeoutMs: 60000, // 60s timeout for graph generation
      aiConfig: input.aiConfig,
      actionName: 'generateGraph',
      attachments: input.attachmentContent || input.mediaBase64 || '',
      mode: 'single-call',
 
```
### `src/app/actions/node-operations.ts`

- **RetryBackoff** @ L714

```
              type: 'network_error' as const,
              requestId,
            message: result.message,
            retryable: true,
          };
        }
        // Other errors map to api_error
        return {
          type: 'api_error' as const,
          requestId,
          message: result.message,
        };
      }
      
  
```
- **RetryBackoff** @ L1125

```
n {
            type: 'network_error' as const,
            requestId,
            message: result.message,
            retryable: true,
          };
        }
        // Other errors map to api_error
        return {
          type: 'api_error' as const,
          requestId,
          message: result.message,
        };
      }
      
  
```
- **Timeout** @ L684

```
ta,
              },
            ],
          },
        ],
        temperature: 0.1, // 极低温度确保严格遵循指令，实现像素级精确复刻
        timeoutMs: 600000, // 10 minutes for vision API
        actionName: 'generateUIFromImage',
        mode: 'vision',
        aiConfig: input.aiConfig,
      });
      
      // Handle error result (return union, don't thro
```
### `src/app/actions/route.ts`

- **Timeout** @ L4

```
onds) for complex LLM tasks
// Increased from 5 minutes to handle large image processing and UI generation
export const maxDuration = 600;

// This is not a page route, only a config file for server actions
// Return 404 for any HTTP requests to /actions
export async function GET() {
  return new Response('Not Found', { status: 404 });
}

```
### `src/app/actions/ui-pipeline-new.ts`

- **RetryBackoff** @ L59

```
 {
        return {
          ok: false,
          type: 'PROVIDER',
          message: 'OPENAI_API_KEY 未配置',
          retryable: false,
        };
      }

      const textModel = getTextModel(input.aiConfig);
      
      const systemPrompt = `You are a product UI designer and senior frontend engineer.

TASK:
Create a single-file, runn
```
- **RetryBackoff** @ L180

```
,
          type: 'VALIDATION',
          message: `HTML validation failed: ${validation.errors.join('; ')}`,
          retryable: false,
        };
      }

      // Output size check
      const htmlLines = html.split('\n').length;
      const htmlSizeKB = html.length / 1024;
      if (htmlLines > 1000 || htmlSizeKB > 50) {
        logE
```
- **RetryBackoff** @ L196

```
type: 'VALIDATION',
          message: `生成的 HTML 超出长度限制（${htmlLines} 行，${htmlSizeKB.toFixed(2)}KB）。请简化页面内容。`,
          retryable: false,
        };
      }

      log('✅ [generateStaticUIFromText] 静态 HTML 生成完成', {
        htmlLength: html.length,
        htmlLines,
        meta: validation.meta,
      });

      return {
        ok: true
```
- **RetryBackoff** @ L222

```
,
        type: 'PROVIDER',
        message: `生成失败: ${error instanceof Error ? error.message : String(error)}`,
        retryable: false,
      };
    }
  });

// ==================== Stage 2: 美化 UI ====================

const BeautifyUIInputSchema = z.object({
  html: z.string().describe('当前 HTML 代码'),
  prompt: z.string().optional().des
```
- **RetryBackoff** @ L250

```
 {
        return {
          ok: false,
          type: 'PROVIDER',
          message: 'OPENAI_API_KEY 未配置',
          retryable: false,
        };
      }

      const textModel = getTextModel(input.aiConfig);
      
      const systemPrompt = `You are a senior UI visual designer and CSS expert.

TASK:
Beautify the provided HTML to look
```
- **RetryBackoff** @ L317

```
,
          type: 'VALIDATION',
          message: `HTML validation failed: ${validation.errors.join('; ')}`,
          retryable: false,
        };
      }

      // Structure preservation check
      const inputMainElements = (input.html.match(/<(header|nav|main|section|footer|article|aside)[\s>]/gi) || []).length;
      const outputMai
```

> …(9 more)

### `src/app/actions/ui-pipeline-response.test.ts`

- **RetryBackoff** @ L64

```
elineResponse = {
    ok: false,
    type: 'RATE_LIMIT',
    message: 'Too many requests',
    cooldownSeconds: 10,
    retryable: true,
  };

  const result = normalizeUIPipelineResponse(valid);
  assertEqual(result, valid);
  assertEqual(result.ok, false);
  assertEqual(result.type, 'RATE_LIMIT');
});

test('normalizeUIPipelineResponse:
```
- **RetryBackoff** @ L107

```
l(result.type, 'NETWORK');
  if (!result.ok) {
    assertEqual(result.message, 'Network error');
    assertEqual(result.retryable, true);
  }
});

test('normalizeUIPipelineResponse: zsa-react tuple [undefined, Error] (error case)', () => {
  const error = new Error('Rate limit exceeded');
  (error as any).cooldownSeconds = 15;
  const tup
```
- **RetryBackoff** @ L122

```
assertEqual(result.message, 'Rate limit exceeded');
    assertEqual(result.cooldownSeconds, 15);
    assertEqual(result.retryable, true);
  }
});

test('normalizeUIPipelineResponse: zsa-react tuple [data, Error] (error takes precedence)', () => {
  const data: UIPipelineResponse = {
    ok: true,
    type: 'UI_HTML',
    stage: 'STATIC',

```
- **RetryBackoff** @ L181

```
  const inner: UIPipelineResponse = {
    ok: false,
    type: 'VALIDATION',
    message: 'Invalid HTML structure',
    retryable: false,
  };

  const wrapped = { result: { result: inner } };
  const result = normalizeUIPipelineResponse(wrapped);

  assertEqual(result.ok, false);
  assertEqual(result.type, 'VALIDATION');
  if (!result.ok
```
- **RetryBackoff** @ L191

```
e, 'VALIDATION');
  if (!result.ok) {
    assertEqual(result.message, 'Invalid HTML structure');
    assertEqual(result.retryable, false);
  }
});

test('normalizeUIPipelineResponse: invalid format (fallback to PARSE error)', () => {
  const invalid = 'not an object';
  const result = normalizeUIPipelineResponse(invalid);

  assertEqual(r
```
- **RetryBackoff** @ L203

```
E');
  if (!result.ok) {
    assertEqual(result.message, 'Invalid response format from server');
    assertEqual(result.retryable, false);
  }
});

test('normalizeUIPipelineResponse: empty array (fallback)', () => {
  const result = normalizeUIPipelineResponse([]);

  assertEqual(result.ok, false);
  assertEqual(result.type, 'PARSE');
});
```
### `src/app/actions/ui-pipeline-response.ts`

- **RetryBackoff** @ L31

```
_LIMIT' | 'NETWORK' | 'PROVIDER' | 'PARSE' | 'VALIDATION';
      message: string;
      cooldownSeconds?: number;
      retryable: boolean;
    };

/**
 * Map AIResult to UIPipelineResponse (error case only)
 */
export function mapAIResultToUIPipelineResponse<T extends { ok: false; type: string; message: string; cooldownSeconds?: number }
```
- **RetryBackoff** @ L43

```
line error types
  let pipelineType: 'RATE_LIMIT' | 'NETWORK' | 'PROVIDER' | 'PARSE' | 'VALIDATION' = 'PROVIDER';
  let retryable = true;

  if ('type' in aiResult) {
    switch (aiResult.type) {
      case 'RATE_LIMIT':
        pipelineType = 'RATE_LIMIT';
        retryable = true;
        break;
      case 'NETWORK':
        pipelineTyp
```
- **RetryBackoff** @ L49

```
type' in aiResult) {
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
        retryable = false;
     
```
- **RetryBackoff** @ L53

```
 'RATE_LIMIT';
        retryable = true;
        break;
      case 'NETWORK':
        pipelineType = 'NETWORK';
        retryable = true;
        break;
      case 'PROVIDER':
        pipelineType = 'PROVIDER';
        retryable = false;
        break;
      case 'PARSE':
        pipelineType = 'PARSE';
        retryable = false;
        
```
- **RetryBackoff** @ L57

```
= 'NETWORK';
        retryable = true;
        break;
      case 'PROVIDER':
        pipelineType = 'PROVIDER';
        retryable = false;
        break;
      case 'PARSE':
        pipelineType = 'PARSE';
        retryable = false;
        break;
      default:
        pipelineType = 'PROVIDER';
        retryable = false;
    }
  }

  re
```
- **RetryBackoff** @ L61

```
ype = 'PROVIDER';
        retryable = false;
        break;
      case 'PARSE':
        pipelineType = 'PARSE';
        retryable = false;
        break;
      default:
        pipelineType = 'PROVIDER';
        retryable = false;
    }
  }

  return {
    ok: false,
    type: pipelineType,
    message: aiResult.message || 'Unknown error'
```

> …(4 more)

### `src/app/actions/ui-pipeline.ts`

- **RetryBackoff** @ L59

```
 {
        return {
          ok: false,
          type: 'PROVIDER',
          message: 'OPENAI_API_KEY 未配置',
          retryable: false,
        };
      }

      const textModel = getTextModel(input.aiConfig);
      
      const systemPrompt = `You are a senior product UI designer and frontend engineer. Your output must look like a real
```
- **RetryBackoff** @ L188

```
,
          type: 'VALIDATION',
          message: `HTML validation failed: ${validation.errors.join('; ')}`,
          retryable: false,
        };
      }

      // Output size check
      const htmlLines = html.split('\n').length;
      const htmlSizeKB = html.length / 1024;
      if (htmlLines > 1000 || htmlSizeKB > 50) {
        logE
```
- **RetryBackoff** @ L204

```
type: 'VALIDATION',
          message: `生成的 HTML 超出长度限制（${htmlLines} 行，${htmlSizeKB.toFixed(2)}KB）。请简化页面内容。`,
          retryable: false,
        };
      }

      log('✅ [generateStaticUIFromText] 静态 HTML 生成完成', {
        htmlLength: html.length,
        htmlLines,
        meta: validation.meta,
      });

      return {
        ok: true
```
- **RetryBackoff** @ L230

```
,
        type: 'PROVIDER',
        message: `生成失败: ${error instanceof Error ? error.message : String(error)}`,
        retryable: false,
      };
    }
  });

// ==================== Stage 2: 美化 UI ====================

const BeautifyUIInputSchema = z.object({
  html: z.string().describe('当前 HTML 代码'),
  prompt: z.string().optional().des
```
- **RetryBackoff** @ L253

```
e });
    if (!process.env.OPENAI_API_KEY) {
      return { ok: false, type: 'PROVIDER', message: 'OPENAI_API_KEY 未配置', retryable: false };
    }
    const textModel = getTextModel(input.aiConfig);
    const systemPrompt = `You are a senior UI visual designer and CSS expert.

TASK:
Beautify the provided HTML to look more production-ready.
```
- **RetryBackoff** @ L299

```
a });
      return { ok: false, type: 'VALIDATION', message: `HTML validation failed: ${validation.errors.join('; ')}`, retryable: false };
    }
    const inputMainElements = (input.html.match(/<(header|nav|main|section|footer|article|aside)[\s>]/gi) || []).length;
    const outputMainElements = (html.match(/<(header|nav|main|section|foo
```

> …(9 more)

### `src/app/api/extract-theme/route.ts`

- **AI_SDK_generateObject** @ L76

```
 [extract-theme] 图片数据准备完成，开始调用 ${visionModel} Vision`);

    // 使用 generateObject 强制返回结构化 JSON
    const result = await generateObject({
      model: openai(visionModel),
      schema: UIThemeConfigSchema,
      messages: [
        {
          role: 'system',
          content: `你是一个专业的UI设计专家。你的任务是分析用户上传的界面截图，提取设计令牌（Design Tokens）并转换为严格的结
```
### `src/app/api/generate-prd/route.ts`

- **AI_SDK_generateText** @ L133

```
 输出 Markdown 格式`;

    const openai = getOpenAIProvider();
    const modelId = getTextModel();
    const result = await generateText({
      model: openai(modelId),
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
 
```
- **Timeout** @ L6

```
'@/lib/openai-client';
import { getTextModel } from '@/lib/ai-config';
import { generateText } from 'ai';

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    // 检查环境变量
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY 未配置' },
        { statu
```
### `src/app/api/super-brain/route.ts`

- **AI_SDK_generateText** @ L59

```
     ? `## 用户/系统请求\n${query}\n\n## 附加上下文（供你综合判断）\n${context}`
      : `## 用户/系统请求\n${query}`;

    const result = await generateText({
      model: openai(modelId),
      messages: [
        { role: 'system', content: SUPER_BRAIN_SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      temperature: 0.3,
    });

   
```
- **Timeout** @ L6

```
'@/lib/openai-client';
import { getTextModel } from '@/lib/ai-config';
import { generateText } from 'ai';

export const maxDuration = 90;

const SUPER_BRAIN_SYSTEM_PROMPT = `你是**超级大脑（Super Brain）**：专家团队的治理与收敛角色，负责标准制定、裁决一致性与问责。你的输出必须**听懂指令、综合多视角、给出可执行结论**，不得敷衍或只做形式回应。

## 你必须综合的视角

1. **马斯克（第一性原理）**
   - 问题本质是什么？最小必要表述是什么？
   - 每条需求是否可验证、
```
### `src/app/page.tsx`

- **Timeout** @ L42

```

      setIsHydrated(true);
      if (isFirstLoad()) {
        setShowSuccessMessage(true);
        markSeen();
        setTimeout(() => setShowSuccessMessage(false), 1000);
      }
      return;
    }

    // 监听 hydration 完成事件
    const handleHydrated = () => {
      const loadTime = Date.now() - loadStartTime;
      console.log(`✅ [Page
```
- **Timeout** @ L55

```

      setIsHydrated(true);
      if (isFirstLoad()) {
        setShowSuccessMessage(true);
        markSeen();
        setTimeout(() => setShowSuccessMessage(false), 1000);
      }
    };

    window.addEventListener('canvas-store-hydrated', handleHydrated);

    // 如果短时间内没有事件，也标记为完成（避免无限等待）
    const timeout = setTimeout(() => {
      c
```
- **Timeout** @ L62

```
window.addEventListener('canvas-store-hydrated', handleHydrated);

    // 如果短时间内没有事件，也标记为完成（避免无限等待）
    const timeout = setTimeout(() => {
      const loadTime = Date.now() - loadStartTime;
      console.warn(`⚠️ [Page] Store hydration timeout, proceeding anyway (${loadTime}ms)`);
      setIsHydrated(true);
      if (isFirstLoad()) {
    
```
- **Timeout** @ L69

```

      setIsHydrated(true);
      if (isFirstLoad()) {
        setShowSuccessMessage(true);
        markSeen();
        setTimeout(() => setShowSuccessMessage(false), 1000);
      }
    }, 500);

    return () => {
      window.removeEventListener('canvas-store-hydrated', handleHydrated);
      clearTimeout(timeout);
    };
  }, [loadStar
```
### `src/components/canvas/AutoLayoutButton.tsx`

- **Timeout** @ L19

```
=> {
    if (layoutTriggeredRef.current && nodes.length > 0) {
      // 延迟执行 fitView，确保节点位置已更新到 DOM
      const timer = setTimeout(() => {
        try {
          fitView({ 
            padding: 0.2, // 20% 的边距
            duration: 500, // 动画时长
            maxZoom: 1.5, // 最大缩放级别
            minZoom: 0.1, // 最小缩放级别
          });
        
```
### `src/components/canvas/CommandBar.tsx`

- **Timeout** @ L558

```
  return;
      }

        // 添加节点后自动应用布局，避免节点重叠
      if (nodes && Array.isArray(nodes) && nodes.length > 0) {
        setTimeout(() => {
          layoutNodes();
          // 再次验证节点是否还在
          const nodesAfterLayout = useCanvasStore.getState().nodes.length;
          log('📊 [CommandBar] 布局后的节点数量:', {
            nodesCount: nodesAft
```
- **Timeout** @ L1055

```
ersRef.current)) {
      loadingTimersRef.current = [];
    }
    
    // 设置超时：600秒后自动重置（防止卡死）
    timeoutRef.current = setTimeout(() => {
      logWarn('操作超时，自动重置加载状态');
      forceResetLoading();
              toast.error('操作超时', {
                description: '请求已超过 10 分钟，已自动重置',
                duration: 5000,
              });
    },
```
- **Timeout** @ L1072

```
);
    
    // 立即设置第一步
    setLoadingStep('👀 正在观察需求...');
    setProgress(10);
    
    // 2秒后：深度推理
    const timer1 = setTimeout(() => {
      setLoadingStep('🧠 GPT-5.0 正在深度推理...');
      setProgress(30);
    }, 2000);
    loadingTimersRef.current.push(timer1);
    
    // 5秒后：构建组件
    const timer2 = setTimeout(() => {
      setLoading
```
- **Timeout** @ L1079

```
      setProgress(30);
    }, 2000);
    loadingTimersRef.current.push(timer1);
    
    // 5秒后：构建组件
    const timer2 = setTimeout(() => {
      setLoadingStep('🔨 正在构建 React 组件...');
      setProgress(60);
    }, 5000);
    loadingTimersRef.current.push(timer2);
    
    // 8秒后：打磨细节
    const timer3 = setTimeout(() => {
      setLoadingS
```
- **Timeout** @ L1086

```
      setProgress(60);
    }, 5000);
    loadingTimersRef.current.push(timer2);
    
    // 8秒后：打磨细节
    const timer3 = setTimeout(() => {
      setLoadingStep('💅 正在打磨 UI 细节...');
      setProgress(85);
    }, 8000);
    loadingTimersRef.current.push(timer3);
    
    // 进度条缓慢增长到 90%
    const progressInterval = setInterval(() => {
     
```
- **Timeout** @ L1723

```
const requestTimeout = 600000; // 600秒 (10分钟)
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error(`请求超时：超过 ${requestTimeout / 1000} 秒未收到服务器响应。请检查：1. 服务器是否正常运行 2. 终端是否有日志输出 3. 网络连接是否正常`));
            }, requestTimeout);
          });
          
          try {
       
```

> …(4 more)

### `src/components/canvas/EditMode.tsx`

- **Timeout** @ L121

```
iframe.contentWindow?.document;
      if (!iframeDoc || !iframeDoc.body) {
        // Retry after a short delay
        setTimeout(checkIframeReady, 100);
        return;
      }

      // Cleanup previous injection
      if (cleanupTextCaptureRef.current) {
        cleanupTextCaptureRef.current();
      }

      // Inject text capture sc
```
### `src/components/canvas/HtmlFirstPreview.tsx`

- **Timeout** @ L446

```
.addEventListener('message', handleMessage);

    // Request capture after a short delay to ensure script is loaded
    setTimeout(() => {
      const iframeWindow = iframe.contentWindow;
      if (iframeWindow) {
        iframeWindow.postMessage({ type: 'CAPTURE_REQUEST' }, '*');
      }
    }, 200);
  }, [pageName]);

  // Close export 
```
### `src/components/canvas/HtmlSandbox.tsx`

- **Timeout** @ L134

```
meRef.current;
    if (!iframe || !isLoaded) return;

    // Wait a bit for bootstrap to be ready
    const timeoutId = setTimeout(() => {
      try {
        const iframeWindow = iframe.contentWindow;
        if (!iframeWindow) return;

        // Inject editor injector script
        if (injectorScript) {
          iframeWindow.postMess
```
### `src/components/canvas/HtmlSandboxRenderer.tsx`

- **RetryBackoff** @ L216

```
rn;
    
    try {
      const iframeDoc = this.getDocument();
      if (!iframeDoc) {
        // Iframe not ready yet, retry
        setTimeout(() => this.inject(), 100);
        return;
      }

      const body = iframeDoc.body || iframeDoc.documentElement;

      // Step 1: Remove any inline event handlers from HTML
      this.removeI
```
- **RetryBackoff** @ L237

```
exposeUnifiedAPI(iframeDoc);
      
      this.injected = true;
    } catch (err) {
      // Cross-origin or not ready, retry
      console.warn('Behavior injector not ready, retrying...', err);
      setTimeout(() => this.inject(), 100);
    }
  }

  /**
   * Remove all inline event handlers from HTML
   * This ensures no behavior exists
```
- **RetryBackoff** @ L238

```
 = true;
    } catch (err) {
      // Cross-origin or not ready, retry
      console.warn('Behavior injector not ready, retrying...', err);
      setTimeout(() => this.inject(), 100);
    }
  }

  /**
   * Remove all inline event handlers from HTML
   * This ensures no behavior exists outside the injector
   */
  private removeInlineHandl
```
- **RetryBackoff** @ L885

```
 else {
          iframe.onload = handleLoad;
        }
      } else {
        // Iframe not accessible, wait a bit and retry
        setTimeout(() => {
          const retryDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (retryDoc) {
            retryDoc.open();
            retryDoc.write(fullHtml);
         
```
- **RetryBackoff** @ L887

```
     }
      } else {
        // Iframe not accessible, wait a bit and retry
        setTimeout(() => {
          const retryDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (retryDoc) {
            retryDoc.open();
            retryDoc.write(fullHtml);
            retryDoc.close();
            setTimeout(() =>
```
- **RetryBackoff** @ L888

```
  setTimeout(() => {
          const retryDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (retryDoc) {
            retryDoc.open();
            retryDoc.write(fullHtml);
            retryDoc.close();
            setTimeout(() => {
              // Run Render Guard first
              const guardResult = global
```

> …(9 more)

### `src/components/canvas/InfiniteCanvas.tsx`

- **Timeout** @ L119

```
      return;
      }

      // 第一次点击，设置定时器
      lastClickNodeIdRef.current = node.id;
      clickTimeoutRef.current = setTimeout(() => {
        // 检查是否是双击
        if (isDoubleClickRef.current && lastClickNodeIdRef.current === node.id) {
          console.log('✅ [InfiniteCanvas] 定时器执行时检测到双击，取消单击', { nodeId: node.id });
          isDoubl
```
- **Timeout** @ L162

```
执行双击：选中并打开详情面板', { nodeId: node.id });
      selectNode(node.id);
      openNodeDetail(node.id);

      // 延迟重置标志
      setTimeout(() => {
        isDoubleClickRef.current = false;
        lastClickNodeIdRef.current = null;
      }, 300);
    },
    [selectNode, openNodeDetail]
  );

  const handlePaneContextMenu = useCallback(
    (event
```
### `src/components/canvas/MermaidDiagram.tsx`

- **Timeout** @ L91

```
完成后的布局指标
  useEffect(() => {
    if (svg && wrapperRef.current && svgContainerRef.current) {
      // 等待 DOM 更新完成
      setTimeout(() => {
        const wrapper = wrapperRef.current;
        const svgContainer = svgContainerRef.current;
        if (wrapper && svgContainer) {
          // 查找 SVG 元素
          const svgElement = svgContainer
```
### `src/components/canvas/NodeDetailPanel.tsx`

- **Timeout** @ L395

```
nts: requirementsArray,
              },
            },
          });
          
          // 验证更新后UI代码是否仍然存在
          setTimeout(() => {
            const updatedNode = nodes.find(n => n.id === selectedNode.id);
            if (updatedNode) {
              const hasValidView = updatedNode.data.artifacts?.view?.code && 
                 
```
### `src/components/canvas/ProjectBlueprint.tsx`

- **Timeout** @ L134

```
dleTabChange = useCallback((tabId: TabType) => {
    if (tabId === activeTab) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(tabId);
      // 滚动到顶部
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
      setTimeout(() => setIsTransi
```
- **Timeout** @ L140

```
crollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
      setTimeout(() => setIsTransitioning(false), 150);
    }, 50);
  }, [activeTab]);

  // 键盘快捷键支持
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC 关闭
      if 
```
### `src/components/canvas/TopologyUploader.tsx`

- **Timeout** @ L190

```
     },
        } as Edge;
      });

      // 添加到画布
      addNodes(nodes);
      addEdges(edges);

      // 应用布局
      setTimeout(() => {
        layoutNodes();
      }, 100);

      toast.success(`已添加 ${nodes.length} 个节点和 ${edges.length} 条连接`);
      log('✅ [TopologyUploader] 拓扑图已应用到画布');

      if (onClose) {
        onClose();
      }
```
### `src/components/canvas/ViewWorkbench.tsx`

- **Timeout** @ L361

```
ssage({
      type: 'INJECT',
      script: captureScript,
    });

    // Request capture after script is injected
    setTimeout(() => {
      if (sandboxRef.current) {
        const iframe = sandboxRef.current.getIframe();
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({ type: 'CAPTURE_REQUEST'
```
- **Timeout** @ L371

```
;
        }
      }
    }, 500);

    // Set up a timeout to dismiss loading toast if no response
    const timeoutId = setTimeout(() => {
      toast.dismiss(loadingToast);
    }, 30000); // 30s timeout

    // Store timeout ID for cleanup (will be cleared when EXPORT_PNG message is received)
    (handleExportPNG as any).timeoutId = time
```
### `src/components/canvas/WordUploader.tsx`

- **Timeout** @ L159

```
请重试';
      toast.error(`文件 "${file.name}" 处理失败: ${errorMessage}`);
    } finally {
      // 延迟重置处理状态，给其他文件处理留出时间
      setTimeout(() => {
        setIsProcessing(false);
      }, 100);
    }
  }, [parseWordFile, onFileUploaded]);

  // 处理文件输入（支持多选）
  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {

```
### `src/lib/ai/gateway-queue.ts`

- **GatewayQueue** @ L25

```
Ms?: number;
}

/**
 * Gateway Queue Error (包装错误，携带 metrics)
 * 失败时也能精确知道 queuedMs（到底是排队慢还是 provider 慢）
 */
export type GatewayQueueError = {
  __gatewayQueueError: true;
  error: unknown;
  metrics: GatewayMetrics;
};

export function isGatewayQueueError(x: unknown): x is GatewayQueueError {
  return (
    !!x &&
    typeof x === 'object
```
- **GatewayQueue** @ L31

```
e GatewayQueueError = {
  __gatewayQueueError: true;
  error: unknown;
  metrics: GatewayMetrics;
};

export function isGatewayQueueError(x: unknown): x is GatewayQueueError {
  return (
    !!x &&
    typeof x === 'object' &&
    (x as any).__gatewayQueueError === true &&
    'metrics' in (x as any)
  );
}

type InFlightValue<T> = Promis
```
- **GatewayQueue** @ L31

```
ueueError: true;
  error: unknown;
  metrics: GatewayMetrics;
};

export function isGatewayQueueError(x: unknown): x is GatewayQueueError {
  return (
    !!x &&
    typeof x === 'object' &&
    (x as any).__gatewayQueueError === true &&
    'metrics' in (x as any)
  );
}

type InFlightValue<T> = Promise<{ result: T; queuedMs: number }>;

```
- **GatewayQueue** @ L138

```
_gatewayQueueError: true,
        error,
        metrics: { queuedMs, dedupHit: false, waitStartMs },
      } satisfies GatewayQueueError;
    } finally {
      const newCurrent = (providerConcurrency.get(provider) || 1) - 1;
      providerConcurrency.set(provider, newCurrent);
      
      // Process next task in queue
      processQueue
```
- **GatewayQueue** @ L206

```
: true,
        error,
        metrics: { queuedMs, dedupHit: false, waitStartMs: task.waitStartMs },
      } satisfies GatewayQueueError)
    )
    .finally(() => {
      const newCurrent = (providerConcurrency.get(provider) || 1) - 1;
      providerConcurrency.set(provider, newCurrent);
      processQueue(provider);
    });
}

/**
 * Ge
```
### `src/lib/ai/llm-mock.ts`

- **Timeout** @ L35

```
de,
    promptLength: params.prompt.length,
  });

  // Simulate network delay (10-50ms)
  await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 40));

  // For generateGraph, return JSON instead of HTML
  if (params.actionName === 'generateGraph' || params.actionName?.includes('generateGraph')) {
    const mockGraphJSON =
```
- **Timeout** @ L171

```
k callObject called', {
    actionName: params.actionName,
    mode: params.mode,
  });

  await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 40));

  // For generateGraph, return a simple graph structure
  if (params.actionName?.includes('generateGraph') || params.actionName?.includes('analyzeInputClarity')) {
    // R
```
- **Timeout** @ L888

```
 (action === 'button-click') {
        target.setAttribute('data-state', 'active');
        showToast('按钮已点击');
        setTimeout(() => {
          target.removeAttribute('data-state');
        }, 1000);
      } else if (action === 'nav-click') {
        e.preventDefault();
        showToast('导航: ' + target.textContent);
      }
    });

```
- **Timeout** @ L915

```
 
      toast.querySelector('p').textContent = message;
      toast.setAttribute('data-state', 'visible');
      
      setTimeout(() => {
        toast.setAttribute('data-state', 'hidden');
      }, 2000);
    }
  </script>
</body>
</html>`;
}


```
### `src/lib/ai/llm.ts`

- **AI_SDK_generateText** @ L266

```
xOutputTokens !== undefined) {
        generateOptions.maxTokens = maxOutputTokens;
      }

      const result = await generateText(generateOptions);

      clearTimeout(timeoutId);
      const elapsed = Date.now() - startTime;

      const rawText = result.text.trim();

      log('✅ [LLM Gateway] LLM call completed', {
        requestId
```
- **AI_SDK_generateObject** @ L542

```
    } else {
        throw new Error('Either messages or prompt must be provided');
      }

      const result = await generateObject(generateOptions);

      clearTimeout(timeoutId);
      const elapsed = Date.now() - startTime;

      const objectData = result.object;

      log('✅ [LLM Gateway] LLM object call completed', {
        re
```
- **GatewayQueue** @ L13

```
-client';
import { log, logError, logWarn } from '@/lib/logger';
import { runQueued, stableHash, type GatewayTaskKey, isGatewayQueueError } from './gateway-queue';
import { shouldUseMock, mockCallText, mockCallObject } from './llm-mock';
import type { CoreMessage } from 'ai';
import type { z } from 'zod';

/**
 * AI Error Type (统一错误类型)
 *
```
- **GatewayQueue** @ L13

```
rror, logWarn } from '@/lib/logger';
import { runQueued, stableHash, type GatewayTaskKey, isGatewayQueueError } from './gateway-queue';
import { shouldUseMock, mockCallText, mockCallObject } from './llm-mock';
import type { CoreMessage } from 'ai';
import type { z } from 'zod';

/**
 * AI Error Type (统一错误类型)
 * 全项目只使用这套类型，不再出现 'rate_limit
```
- **GatewayQueue** @ L397

```
 Math.max(0, totalMs - 1000);
    let dedupHit = false;

    // ✅ 如果是队列包装错误，拿到真实 metrics
    let error = err;
    if (isGatewayQueueError(err)) {
      queuedMs = err.metrics.queuedMs;
      dedupHit = err.metrics.dedupHit;
      error = err.error;
    }

    const errorObj = error as { type?: string; message?: string; cooldownSeconds?: n
```
- **GatewayQueue** @ L707

```
 Math.max(0, totalMs - 1000);
    let dedupHit = false;

    // ✅ 如果是队列包装错误，拿到真实 metrics
    let error = err;
    if (isGatewayQueueError(err)) {
      queuedMs = err.metrics.queuedMs;
      dedupHit = err.metrics.dedupHit;
      error = err.error;
    }

    const errorObj = error as { type?: string; message?: string; cooldownSeconds?: n
```

> …(24 more)

### `src/lib/openai-client.ts`

- **RetryBackoff** @ L48

```
TE: Cooldown gate is handled by llm.ts, not here.
 * This layer only handles transport-level concerns (timeout, network retry).
 */
function getCustomFetch() {
  return async (url: string | URL | Request, options?: RequestInit) => {
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime =
```
- **RetryBackoff** @ L104

```
ToUse, // Respect external signal, don't override
        dispatcher: agent,
      };
      
      // Track attempt for retry logic
      const context = requestContexts.get(requestId);
      if (context) {
        context.attemptNumber = (context.attemptNumber || 0) + 1;
      }
      
      const response = await fetch(url, fetchOptions
```
- **RetryBackoff** @ L119

```
 const elapsed = Date.now() - startTime;
        
        // Extract Retry-After header for llm.ts to use
        const retryAfter = response.headers.get('retry-after') || 
                          response.headers.get('Retry-After');
        let cooldownSeconds = 10; // Default
        if (retryAfter) {
          const parsed = parseInt
```
- **RetryBackoff** @ L119

```
Time;
        
        // Extract Retry-After header for llm.ts to use
        const retryAfter = response.headers.get('retry-after') || 
                          response.headers.get('Retry-After');
        let cooldownSeconds = 10; // Default
        if (retryAfter) {
          const parsed = parseInt(retryAfter, 10);
          if (!is
```
- **RetryBackoff** @ L122

```
                          response.headers.get('Retry-After');
        let cooldownSeconds = 10; // Default
        if (retryAfter) {
          const parsed = parseInt(retryAfter, 10);
          if (!isNaN(parsed) && parsed > 0) {
            cooldownSeconds = parsed;
          }
        }
        
        logError('🚫 [OpenAI Client] 429
```
- **RetryBackoff** @ L123

```
Retry-After');
        let cooldownSeconds = 10; // Default
        if (retryAfter) {
          const parsed = parseInt(retryAfter, 10);
          if (!isNaN(parsed) && parsed > 0) {
            cooldownSeconds = parsed;
          }
        }
        
        logError('🚫 [OpenAI Client] 429 Rate Limit detected (will be handled by llm.ts)
```

> …(18 more)

### `src/lib/ui/capture-injector.ts`

- **Timeout** @ L194

```
o(0, scrollY);
        
        // Wait for scroll to settle and content to render
        await new Promise(resolve => setTimeout(resolve, 150));
        
        // Get the visible viewport content
        const viewportContent = doc.createElement('div');
        viewportContent.style.width = viewportWidth + 'px';
        viewportConten
```
### `src/lib/ui/injector.ts`

- **Timeout** @ L215

```
else {
    initializeListeners();
  }
  
  // Also initialize after a short delay to catch dynamically added elements
  setTimeout(initializeListeners, 100);
  
  // Notify host that injector is ready
  postToHost('INJECTOR_READY', {});
})();
`.trim();
}



```
### `src/lib/ui/ui-compiler.ts`

- **AI_SDK_generateText** @ L90

```
 Output ONLY the <AI_JSON> block
- No other text outside the block
- JSON must be valid`;

    const specResult = await generateText({
      model: openaiClient(textModel),
      messages: [
        { role: 'system', content: 'You are a UI specification generator. Output only valid JSON in <AI_JSON> tags.' },
        { role: 'user', conte
```
- **AI_SDK_generateText** @ L160

```
lude inline event handlers (onclick, etc.)
- Preserve visual fidelity from user request`;

    const htmlResult = await generateText({
      model: openaiClient(textModel),
      messages: [
        { role: 'system', content: 'You are an HTML generator. Output only valid HTML in <AI_HTML> tags. Keep output reasonable (< 15000 tokens).' },
```
- **AI_SDK_generateText** @ L226

```
 based on interactions
- Do NOT modify text content or structure
- Keep output concise`;

    const patchResult = await generateText({
      model: openaiClient(textModel),
      messages: [
        { role: 'system', content: 'You are a patch generator. Output only valid JSON array in <AI_PATCH> tags. Keep output concise (< 2000 tokens).'
```
### `src/lib/ui-generation-helpers.ts`

- **RetryBackoff** @ L7

```
n with strict quality constraints:
 * - Precise stage timing (t0-t4)
 * - Rate limit fast-fail (<5s)
 * - Network error retry (max 1, with jitter)
 * - Output size limits
 */

import { log, logError } from './logger';

/**
 * Stage timing information for performance tracking
 */
export interface StageTiming {
  stage: 't0' | 't1' | 't2' |
```
- **RetryBackoff** @ L74

```
 ? error.response.headers : null;
      if (headers && typeof headers === 'object' && 'get' in headers) {
        const retryAfter = (headers as { get: (name: string) => string | null }).get('retry-after');
        if (retryAfter) {
          const seconds = parseInt(retryAfter, 10);
          if (!isNaN(seconds) && seconds > 0) {
       
```
- **RetryBackoff** @ L74

```
= 'object' && 'get' in headers) {
        const retryAfter = (headers as { get: (name: string) => string | null }).get('retry-after');
        if (retryAfter) {
          const seconds = parseInt(retryAfter, 10);
          if (!isNaN(seconds) && seconds > 0) {
            return seconds;
          }
        }
      }
    }
    
    // Che
```
- **RetryBackoff** @ L75

```
ers) {
        const retryAfter = (headers as { get: (name: string) => string | null }).get('retry-after');
        if (retryAfter) {
          const seconds = parseInt(retryAfter, 10);
          if (!isNaN(seconds) && seconds > 0) {
            return seconds;
          }
        }
      }
    }
    
    // Check for retryAfter in error 
```
- **RetryBackoff** @ L76

```
et: (name: string) => string | null }).get('retry-after');
        if (retryAfter) {
          const seconds = parseInt(retryAfter, 10);
          if (!isNaN(seconds) && seconds > 0) {
            return seconds;
          }
        }
      }
    }
    
    // Check for retryAfter in error object
    if ('retryAfter' in error && typeof er
```
- **RetryBackoff** @ L84

```
!isNaN(seconds) && seconds > 0) {
            return seconds;
          }
        }
      }
    }
    
    // Check for retryAfter in error object
    if ('retryAfter' in error && typeof error.retryAfter === 'number') {
      return error.retryAfter;
    }
  }
  
  return 10; // Default cooldown
}

/**
 * Checks if error is a rate limit (
```

> …(18 more)

### `src/utils/demo-router.ts`

- **RetryBackoff** @ L206

```
.forwardStack.length > 0;
  }

  /**
   * Attach navigation handler to intercept data-demo-nav clicks
   * Retries with exponential backoff (max 5 attempts)
   */
  private attachNavigationHandler(attempt: number = 0): void {
    const MAX_ATTEMPTS = 5;
    const RETRY_DELAY_MS = 100;

    const iframeDoc = this.iframe.contentDocument || 
```
- **RetryBackoff** @ L206

```
k.length > 0;
  }

  /**
   * Attach navigation handler to intercept data-demo-nav clicks
   * Retries with exponential backoff (max 5 attempts)
   */
  private attachNavigationHandler(attempt: number = 0): void {
    const MAX_ATTEMPTS = 5;
    const RETRY_DELAY_MS = 100;

    const iframeDoc = this.iframe.contentDocument || this.iframe.
```
- **RetryBackoff** @ L220

```
('Failed to attach navigation handler: iframe not ready');
        }
        return;
      }
      // Iframe not ready, retry with exponential backoff
      this.attachRetryTimeout = setTimeout(
        () => this.attachNavigationHandler(attempt + 1),
        RETRY_DELAY_MS * (attempt + 1)
      );
      return;
    }

    // Clear retry 
```
- **RetryBackoff** @ L220

```
 attach navigation handler: iframe not ready');
        }
        return;
      }
      // Iframe not ready, retry with exponential backoff
      this.attachRetryTimeout = setTimeout(
        () => this.attachNavigationHandler(attempt + 1),
        RETRY_DELAY_MS * (attempt + 1)
      );
      return;
    }

    // Clear retry timeout on 
```
- **RetryBackoff** @ L220

```
gation handler: iframe not ready');
        }
        return;
      }
      // Iframe not ready, retry with exponential backoff
      this.attachRetryTimeout = setTimeout(
        () => this.attachNavigationHandler(attempt + 1),
        RETRY_DELAY_MS * (attempt + 1)
      );
      return;
    }

    // Clear retry timeout on success
    
```
- **RetryBackoff** @ L228

```
attachNavigationHandler(attempt + 1),
        RETRY_DELAY_MS * (attempt + 1)
      );
      return;
    }

    // Clear retry timeout on success
    if (this.attachRetryTimeout) {
      clearTimeout(this.attachRetryTimeout);
      this.attachRetryTimeout = undefined;
    }

    this.clickHandler = (e: MouseEvent) => {
      const target =
```

> …(4 more)

### `src/utils/prdGenerator.ts`

- **Timeout** @ L1103

```
All dependencies loaded, calling callback');
            callback();
          } else if (maxRetries > 0) {
            setTimeout(() => waitForReact(callback, maxRetries - 1, delay), delay);
          } else {
            console.error('❌ [waitForReact] React/ReactDOM/Babel failed to load after timeout');
            console.error('💡 [w
```
- **Timeout** @ L1358

```
og('📄 [init] DOMContentLoaded fired');
            waitForReact(() => {
              mountComponents();
              setTimeout(mountComponents, 500);
              setTimeout(mountComponents, 1500);
              setTimeout(mountComponents, 3000);
            });
          });
        }
        
        // And on window load
        w
```
- **Timeout** @ L1359

```
    waitForReact(() => {
              mountComponents();
              setTimeout(mountComponents, 500);
              setTimeout(mountComponents, 1500);
              setTimeout(mountComponents, 3000);
            });
          });
        }
        
        // And on window load
        window.addEventListener('load', function() {
    
```
- **Timeout** @ L1360

```
nents();
              setTimeout(mountComponents, 500);
              setTimeout(mountComponents, 1500);
              setTimeout(mountComponents, 3000);
            });
          });
        }
        
        // And on window load
        window.addEventListener('load', function() {
          console.log('🌐 [init] Window load fired');
```
- **Timeout** @ L1370

```
  console.log('🌐 [init] Window load fired');
          waitForReact(() => {
            mountComponents();
            setTimeout(mountComponents, 500);
            setTimeout(mountComponents, 1500);
            setTimeout(mountComponents, 3000);
          });
        });
        
        // Also try immediately (in case scripts are alre
```
- **Timeout** @ L1371

```
          waitForReact(() => {
            mountComponents();
            setTimeout(mountComponents, 500);
            setTimeout(mountComponents, 1500);
            setTimeout(mountComponents, 3000);
          });
        });
        
        // Also try immediately (in case scripts are already loaded)
        waitForReact(() => {
     
```

> …(4 more)


