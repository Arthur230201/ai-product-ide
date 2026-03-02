# Prompt Hotspots

Generated: 2026-02-05T14:15:00.621Z

## Top files by prompt inflation signals

1. `src/components/canvas/CommandBar.tsx` — 96
2. `src/app/actions/generate-graph.ts` — 73
3. `src/app/actions/node-operations.ts` — 65
4. `src/utils/prdGenerator.ts` — 30
5. `src/lib/ai/llm.ts` — 28
6. `src/types/fractal.ts` — 25
7. `src/app/actions/ui-pipeline.ts` — 23
8. `src/app/actions/ui-pipeline-new.ts` — 20
9. `src/utils/codeToPrdTable.ts` — 20
10. `src/app/api/extract-theme/route.ts` — 18
11. `src/components/canvas/ProjectBlueprint.tsx` — 18
12. `src/app/actions/parse-topology.ts` — 16
13. `src/components/canvas/LivePreview.tsx` — 15
14. `src/lib/prompts/index.ts` — 14
15. `src/utils/wordGenerator.ts` — 14



## Details (first hits per file)
### `src/app/actions/generate-graph.ts`

- **PromptTemplateLiteral** @ L226

```
传了${mediaTypeText}文件（图片内容将作为视觉输入进行分析）。`;
    } else {
      analysisContent += `\n\n用户上传了${mediaTypeText}文件，请结合文件内容进行分析。`;
    }
    hasFileContent = true;
  }
  
  // 如果有图片，需要使用 vision 模型
  const useVisionModel = mediaBase64 && mediaType === 'image';
  const model = useVisionModel 
    ? getVisionModel(aiConfig)
    : textModel;
  
  log
```
- **PromptTemplateLiteral** @ L293

```
JSON must be valid and complete
- All required fields must be present

Analyze the following input: "${analysisContent}"`;

  // Call LLM gateway with callText
  const result = await callText({
    model,
    prompt: userPrompt,
    timeoutMs: 30000, // 30s timeout for clarity analysis
    aiConfig,
  });

  // Handle errors - return fall
```
- **PromptTemplateLiteral** @ L423

```
nting)
- Content Management (documents, media, publishing)

Generate appropriate scenarios based on the detected domain.`;

  const ClarificationGenerationSchema = z.object({
    message: z.string().describe('澄清消息，包含检测到的领域'),
    options: z.array(ClarificationOptionSchema).describe('3-4个不同的业务场景选项'),
    question: z.string().describe('引导用户
```
- **PromptTemplateLiteral** @ L467

```
}) => {
    const t0 = Date.now();
    const requestId = `graph-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    let warnings: string[] = [];
    let fallbackUsed = false;
    let llmMetrics = { queuedMs: 0, dedupHit: false, totalMs: 0 };
    
    log('🚀 [generateGraph] 开始生成图结构（单次调用）', {
      requestId,
        promptLengt
```
- **PromptTemplateLiteral** @ L507

```
'image' ? '图片' : '视频'}文件，请结合图片/视频内容进行分析。`;
    }

    // 构建系统提示词 - 单次调用，同时生成 clarity + graph
      const systemPrompt = `# Role
Product Solution Architect (Domain Driven Design Expert).

# Task
Analyze the User Input and generate BOTH:
1. **Clarity Analysis**: Assess input clarity (confidence, isVague, domain, object, action)
2. **Graph S
```
- **PromptTemplateLiteral** @ L574

```
e**: If the UI changes significantly or the URL changes, it is a Page Node.
- **Output**: \`nodes[].data.artifacts.view\`

## Step 2: Analyze Page Type (CRITICAL)
For each identified Page Node, determine its primary function:

### Type A (Action) Pages:
- **Characteristics**: Forms, Editors, Dialogs where data is **created/modified**
- **
```

> …(67 more)

### `src/app/actions/generate-tailwind-config.ts`

- **PromptTemplateLiteral** @ L69

```
nfig 里把 \`blue: { 600: '#您的深蓝HEX' }\` 进行覆盖。
  - 通过覆盖 Tailwind 默认色板，实现"换肤不换骨"。
- **输出格式**：只输出 JavaScript 对象，格式如下：
  \`\`\`javascript
  {
    theme: {
      extend: {
        colors: {
          // 覆盖默认蓝色，接管所有相关组件
          blue: {
            50: '#F0F9FF',
            600: '#1E3A8A', // 您的深蓝主色
          },
          // 定义语义化别名
          p
```
- **PromptTemplateLiteral** @ L94

```

    darkMode: 'class', // 强制手动模式，防止随系统变黑
  }
  \`\`\`

# 示例
用户需求："深蓝色主题"
HTML 中使用了：bg-blue-600, text-blue-500
输出：
\`\`\`javascript
{
  theme: {
    extend: {
      colors: {
        blue: {
          600: '#1E3A8A', // 覆盖默认 blue-600 为深蓝
          500: '#2563EB', // 覆盖默认 blue-500
        },
        primary: '#1E3A8A',
        background: 
```
- **PromptTemplateLiteral** @ L149

```
primary: '#1E3A8A',
        background: '#F3F4F6',
        surface: '#FFFFFF',
      }
    }
  },
  darkMode: 'class',
}`,
          success: false,
          error: result.message,
        };
      }

      let configCode = result.data.trim();

      // 清理输出：移除可能的 markdown 代码块标记
      configCode = configCode.replace(/^```(?:javascript|js
```
- **PromptTemplateLiteral** @ L181

```
primary: '#1E3A8A',
        background: '#F3F4F6',
        surface: '#FFFFFF',
      }
    }
  },
  darkMode: 'class',
}`;
      }

      log('✅ [generateTailwindConfig] 配置生成成功', {
        configLength: configCode.length,
      });

      return {
        config: configCode,
        success: true,
      };
    } catch (error) {
      logE
```
- **JSON_in_prompt** @ L4

```
'use server';

import { createServerAction } from 'zsa';
import { z } from 'zod';
import { log, logError } from '@/lib/logger';
import { getTextModel } from '@/lib/ai-config';
import { callText } from '@/lib/ai/llm';

const generateTailwindConfigSchema = z.object({
  designRequirement: z.string(
```
- **JSON_in_prompt** @ L9

```
{ getTextModel } from '@/lib/ai-config';
import { callText } from '@/lib/ai/llm';

const generateTailwindConfigSchema = z.object({
  designRequirement: z.string().describe('用户的设计需求描述（如"深蓝/淡蓝"、"深色主题"等）'),
  existingConfig: z.string().optional().describe('现有的 tailwind.config 对象（JSON 字符串）'),
  htmlContext: z.string().optional().describe('HTM
```

> …(6 more)

### `src/app/actions/node-operations.ts`

- **PromptTemplateLiteral** @ L28

```
: 0, dedupHit: false, totalMs: 0 },
      };
    }

    const textModel = getTextModel();
    
    const systemPrompt = `You are a UI code refinement expert. Your task is to refine and improve HTML/React code based on user feedback.

Requirements:
1. Maintain the original functionality
2. Improve styling consistency
3. Fix any layout issu
```
- **PromptTemplateLiteral** @ L49

```
t 统一 gateway
    const result = await callText({
      model: textModel,
      prompt: `${systemPrompt}\n\n${userPrompt}`,
      temperature: 0.3,
      actionName: 'refineUI',
      aiConfig: {},
    });

    if (!result.ok) {
      return result;
    }

    const refinedCode = result.data.trim();
    
    // Remove markdown code blocks 
```
- **PromptTemplateLiteral** @ L64

```
ocks if present
    const cleanedCode = refinedCode
      .replace(/^```(?:tsx|jsx|ts|js)?\n?/gm, '')
      .replace(/```$/gm, '')
      .trim();

    return {
      ok: true,
      data: { code: cleanedCode },
      metrics: result.metrics,
    };
  } catch (error) {
    logError('❌ [refineUI] Error:', error);
    const errorMessage = er
```
- **PromptTemplateLiteral** @ L177

```
t 统一 gateway
    const result = await callText({
      model: textModel,
      prompt: `${systemPrompt}\n\n${userPrompt}`,
      temperature: 0.5,
      actionName: 'reverseGenerateSpec',
      aiConfig: input.aiConfig,
    });

    if (!result.ok) {
      throw new Error(result.message || '需求生成失败');
    }

    // 解析生成的文本，提取标题和需求列表
    co
```
- **PromptTemplateLiteral** @ L232

```
const errorMessage = error instanceof Error ? error.message : '需求文档生成失败';
    throw new Error(`需求文档生成失败: ${errorMessage}`);
  }
}

export async function generateImplementation(input: {
  title: string;
  requirements: string[];
}): Promise<{ apiEndpoints: string[]; dbSchema: string }> {
  // TODO: 实现生成实现逻辑
      return {
    apiEndpoints:
```
- **PromptTemplateLiteral** @ L308

```
t 统一 gateway
    const result = await callText({
      model: textModel,
      prompt: `${systemPrompt}\n\n${userPrompt}`,
      temperature: 0.7, // 稍微高一点的温度，鼓励创造性
      actionName: 'generateTestCases',
      aiConfig: {},
    });

    if (!result.ok) {
      return {
        ok: false,
        type: result.type,
        message: result.
```

> …(59 more)

### `src/app/actions/parse-topology.ts`

- **PromptTemplateLiteral** @ L67

```
'='.repeat(80));
    log(`🗺️ [parseTopology] 开始解析拓扑图 [${requestId}]`);
    log(`📋 [parseTopology] 输入参数 [${requestId}]:`, {
      imageBase64Length: input.imageBase64?.length || 0,
      hasPrompt: !!input.prompt,
      promptLength: input.prompt?.length || 0,
    });
    log('='.repeat(80));

    try {
      // 检查环境变量
      if (!process
```
- **PromptTemplateLiteral** @ L96

```
   const visionModel = getVisionModel(input.aiConfig);
      log(`📸 [parseTopology] 图片数据验证通过，开始调用 ${visionModel} Vision`);

      // 构建用户提示词
      const userPrompt = input.prompt?.trim() || '请分析这张拓扑图，识别所有节点和它们之间的连接关系。';

      // 使用统一 LLM 网关调用 generateObject
      const result = await callObject({
        model: visionModel,
        sche
```
- **PromptTemplateLiteral** @ L143

```
详细信息**：
   - 提取节点的所有可见文字信息作为 label
   - 提取节点的描述性信息作为 description

输出格式必须严格匹配提供的 Schema 结构。确保提取所有可见的企业级信息（IP地址、服务列表、分组等）。`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: userPrompt,
              },
              {
                type: 'image',
```
- **PromptTemplateLiteral** @ L172

```
 ${duration}ms`);
      log(`📊 [parseTopology] 解析结果: ${topologyData.nodes.length} 个节点, ${topologyData.edges.length} 条连接`);

      return {
        nodes: topologyData.nodes,
        edges: topologyData.edges,
        description: topologyData.description,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
     
```
- **JSON_in_prompt** @ L4

```
'use server';

import { createServerAction } from 'zsa';
import { z } from 'zod';
import { log, logError } from '@/lib/logger';
import { getVisionModel } from '@/lib/ai-config';
import { callObject } from '@/lib/ai/llm';
import type { FractalNode } from '@/types/fractal';
// 注意：parse-topology 不返
```
- **JSON_in_prompt** @ L14

```
actal';
// 注意：parse-topology 不返回 Edge 类型，只返回拓扑图数据，所以不需要导入 reactflow

/**
 * 拓扑图节点 Schema
 */
const TopologyNodeSchema = z.object({
  id: z.string().describe('节点唯一标识符'),
  label: z.string().describe('节点标签/名称'),
  type: z.enum(['page', 'service', 'database', 'middleware', 'firewall', 'internet', 'user']).describe('节点类型：page（页面）、service（应用服务
```

> …(10 more)

### `src/app/actions/ui-pipeline-new.ts`

- **PromptTemplateLiteral** @ L33

```
 No Markdown, no code fences, no explanations.
- Output the actual HTML code.
- Append this marker at the end: ${marker}`;
};

// ==================== Stage 1: 静态 HTML 生成 ====================

const GenerateStaticUIInputSchema = z.object({
  prompt: z.string().describe('页面描述'),
  nodeLabel: z.string().optional().describe('节点标签'),
  aiConf
```
- **PromptTemplateLiteral** @ L114

```
t({
        model: textModel,
        prompt: `${systemPrompt}\n\n[USER REQUEST]\n${userPrompt}${getOutputFooter(stage)}`,
        timeoutMs: 360000, // 360s (6 minutes) - UI 生成耗时较长
        maxOutputTokens: 8000, // Limit output size
        aiConfig: input.aiConfig,
        actionName: 'generateStaticUI',
        mode: 'static',
      })
```
- **PromptTemplateLiteral** @ L165

```
e marker is present
        if (!html.includes(STAGE_MARKER_STATIC)) {
          html = `${html}\n${STAGE_MARKER_STATIC}`;
        }
      }

      // Validate HTML
      const validation = validateHTML(html, stage);
      if (!validation.valid) {
        logError('❌ [generateStaticUIFromText] HTML validation failed', {
          errors: 
```
- **PromptTemplateLiteral** @ L179

```
    ok: false,
          type: 'VALIDATION',
          message: `HTML validation failed: ${validation.errors.join('; ')}`,
          retryable: false,
        };
      }

      // Output size check
      const htmlLines = html.split('\n').length;
      const htmlSizeKB = html.length / 1024;
      if (htmlLines > 1000 || htmlSizeKB > 50) {
```
- **PromptTemplateLiteral** @ L195

```
e,
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
   
```
- **PromptTemplateLiteral** @ L221

```
  ok: false,
        type: 'PROVIDER',
        message: `生成失败: ${error instanceof Error ? error.message : String(error)}`,
        retryable: false,
      };
    }
  });

// ==================== Stage 2: 美化 UI ====================

const BeautifyUIInputSchema = z.object({
  html: z.string().describe('当前 HTML 代码'),
  prompt: z.string().opt
```

> …(14 more)

### `src/app/actions/ui-pipeline-response.test.ts`

- **PromptTemplateLiteral** @ L16

```
ing, fn: () => void) {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    console.error(`❌ ${name}:`, error);
    throw error;
  }
}

function assertEqual<T>(actual: T, expected: T, message?: string) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expec
```
- **JSON_in_prompt** @ L22

```
error);
    throw error;
  }
}

function assertEqual<T>(actual: T, expected: T, message?: string) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(
      `${message || 'Assertion failed'}: expected ${expectedStr}, got ${actualStr}`
    );
 
```
- **JSON_in_prompt** @ L23

```
tEqual<T>(actual: T, expected: T, message?: string) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(
      `${message || 'Assertion failed'}: expected ${expectedStr}, got ${actualStr}`
    );
  }
}

function assertType<T>(value: unknown, g
```
- **JSON_in_prompt** @ L33

```
ard: (v: unknown) => v is T): asserts value is T {
  if (!guard(value)) {
    throw new Error(`Type assertion failed: ${JSON.stringify(value)}`);
  }
}

// Test cases
test('normalizeUIPipelineResponse: already valid UIPipelineResponse (success)', () => {
  const valid: UIPipelineResponse = {
    ok: true,
    type: 'UI_HTML',
    stage: '
```
### `src/app/actions/ui-pipeline.ts`

- **PromptTemplateLiteral** @ L33

```
 No Markdown, no code fences, no explanations.
- Output the actual HTML code.
- Append this marker at the end: ${marker}`;
};

// ==================== Stage 1: 静态 HTML 生成 ====================

const GenerateStaticUIInputSchema = z.object({
  prompt: z.string().describe('页面描述'),
  nodeLabel: z.string().optional().describe('节点标签'),
  aiConf
```
- **PromptTemplateLiteral** @ L112

```
ssible, ~800 lines max).
- All text content must be in Chinese (中文).`;

      const userPrompt = input.prompt.trim() || `请为"${input.nodeLabel || '页面'}"生成静态 HTML 页面。

要求：
1. 根据描述设计合理的 UI 布局，具备清晰的视觉层次与信息层次
2. 使用有审美的现代化设计：明确的字体层级、间距节奏、配色与留白，像真实产品界面而非占位 demo
3. 示例内容要符合业务场景（如购物用真实感商品名与价格），禁止「示例商品 A/B」式占位
4. 确保代码可直接在浏览器中打开查看，所有文本使用中文`;

      c
```
- **PromptTemplateLiteral** @ L122

```
t({
        model: textModel,
        prompt: `${systemPrompt}\n\n[USER REQUEST]\n${userPrompt}${getOutputFooter(stage)}`,
        timeoutMs: 360000, // 360s (6 minutes) - UI 生成耗时较长
        maxOutputTokens: 8000, // Limit output size
        aiConfig: input.aiConfig,
        actionName: 'generateStaticUI',
        mode: 'static',
      })
```
- **PromptTemplateLiteral** @ L173

```
e marker is present
        if (!html.includes(STAGE_MARKER_STATIC)) {
          html = `${html}\n${STAGE_MARKER_STATIC}`;
        }
      }

      // Validate HTML
      const validation = validateHTML(html, stage);
      if (!validation.valid) {
        logError('❌ [generateStaticUIFromText] HTML validation failed', {
          errors: 
```
- **PromptTemplateLiteral** @ L187

```
    ok: false,
          type: 'VALIDATION',
          message: `HTML validation failed: ${validation.errors.join('; ')}`,
          retryable: false,
        };
      }

      // Output size check
      const htmlLines = html.split('\n').length;
      const htmlSizeKB = html.length / 1024;
      if (htmlLines > 1000 || htmlSizeKB > 50) {
```
- **PromptTemplateLiteral** @ L203

```
e,
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
   
```

> …(17 more)

### `src/app/api/extract-theme/route.ts`

- **PromptTemplateLiteral** @ L73

```
获取模型配置
    const visionModel = getVisionModel(aiConfig);
    log(`📸 [extract-theme] 图片数据准备完成，开始调用 ${visionModel} Vision`);

    // 使用 generateObject 强制返回结构化 JSON
    const result = await generateObject({
      model: openai(visionModel),
      schema: UIThemeConfigSchema,
      messages: [
        {
          role: 'system',
          co
```
- **PromptTemplateLiteral** @ L93

```
e），用简洁的中文或英文描述
6. 密度（density）根据元素间距判断：紧凑=compact，正常=normal，宽松=spacious
7. 只返回JSON对象，不要包含任何解释文字

输出格式必须严格匹配提供的 Schema 结构。`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: '请分析这张UI截图，提取设计令牌并返回结构化JSON。',
            },
            {
              type: 'image',

```
- **PromptTemplateLiteral** @ L113

```
 较低温度以确保输出稳定
    });

    const duration = Date.now() - startTime;
    log(`✅ [extract-theme] UI风格提取成功，耗时: ${duration}ms`);
    log('📊 [extract-theme] 提取的主题:', result.object);

    return Response.json({
      theme: result.object as UIThemeConfig,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logError(`❌ [
```
- **JSON_in_prompt** @ L5

```
'use server';

import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { log, logError } from '@/lib/logger';
import { getVisionModel } from '@/lib/ai-config';
import type { UIThemeConfig } from '@/types/theme';

/**
 * UI Theme 提取 Schema - 严格匹配 UIThemeConfig 结构
 */
const UIThe
```
- **JSON_in_prompt** @ L13

```
IThemeConfig } from '@/types/theme';

/**
 * UI Theme 提取 Schema - 严格匹配 UIThemeConfig 结构
 */
const UIThemeConfigSchema = z.object({
  colors: z.object({
    primary: z.string().describe('主色调（Tailwind 类名，如 blue-500）'),
    secondary: z.string().describe('次要色调（Tailwind 类名，如 purple-500）'),
    background: z.object({
      light: z.string().de
```
- **JSON_in_prompt** @ L14

```
@/types/theme';

/**
 * UI Theme 提取 Schema - 严格匹配 UIThemeConfig 结构
 */
const UIThemeConfigSchema = z.object({
  colors: z.object({
    primary: z.string().describe('主色调（Tailwind 类名，如 blue-500）'),
    secondary: z.string().describe('次要色调（Tailwind 类名，如 purple-500）'),
    background: z.object({
      light: z.string().describe('浅色背景（Tailwind
```

> …(12 more)

### `src/app/api/generate-prd/route.ts`

- **PromptTemplateLiteral** @ L68

```
spec.title || node.label,
        requirements: requirements,
      };
    });

    // 构建系统提示词
    const systemPrompt = `# Role
You are a Senior Product Manager specializing in the **${industry}** industry.
Your target audience is **${targetAudience}**.

# Project Context
Project Name: "${projectName}"
Core Value: ${description || '未指定'}

```
- **PromptTemplateLiteral** @ L110

```
 || ''}
错误处理: ${globalRules.errorHandling || ''}
数据追踪: ${globalRules.dataTracking || ''}` : '';

    const userPrompt = `请基于以下信息生成完整的 PRD 文档：

项目画像：
- 项目名称: ${projectName}
- 行业: ${industry}
- 目标用户: ${targetAudience}
- 项目简介: ${description || '未指定'}

节点列表：
${nodesContent}

全局规则：
${globalRulesContent}

要求：
1. 生成完整的 PRD 文档，包含概述、用户角色、模块详情和非功能性
```
### `src/app/api/super-brain/route.ts`

- **PromptTemplateLiteral** @ L8

```
@/lib/ai-config';
import { generateText } from 'ai';

export const maxDuration = 90;

const SUPER_BRAIN_SYSTEM_PROMPT = `你是**超级大脑（Super Brain）**：专家团队的治理与收敛角色，负责标准制定、裁决一致性与问责。你的输出必须**听懂指令、综合多视角、给出可执行结论**，不得敷衍或只做形式回应。

## 你必须综合的视角

1. **马斯克（第一性原理）**
   - 问题本质是什么？最小必要表述是什么？
   - 每条需求是否可验证、可测试？目标能否一句话说清？
   - 激进简化：能删则删；不做「大而全」的罗列。

2. **乔布斯（用
```
### `src/app/page.tsx`

- **PromptTemplateLiteral** @ L37

```
reHydrated) {
      const loadTime = Date.now() - loadStartTime;
      console.log(`✅ [Page] 加载完成（已缓存），耗时: ${loadTime}ms`);
      setIsHydrated(true);
      if (isFirstLoad()) {
        setShowSuccessMessage(true);
        markSeen();
        setTimeout(() => setShowSuccessMessage(false), 1000);
      }
      return;
    }

    // 监听 hydr
```
- **PromptTemplateLiteral** @ L50

```
Hydrated = () => {
      const loadTime = Date.now() - loadStartTime;
      console.log(`✅ [Page] 加载完成，耗时: ${loadTime}ms`);
      setIsHydrated(true);
      if (isFirstLoad()) {
        setShowSuccessMessage(true);
        markSeen();
        setTimeout(() => setShowSuccessMessage(false), 1000);
      }
    };

    window.addEventListener
```
### `src/components/InstructionCard.tsx`

- **PromptTemplateLiteral** @ L54

```
e on every card */}
      <div 
        className={`absolute left-0 top-0 h-full w-2 ${getIndicatorColor()} rounded-l-lg`}
      />

      {/* Card Body - Vertical Column */}
      {/* Add left padding to prevent content overlap with indicator bar */}
      <div className="flex flex-col pl-5 pr-4 pt-3 pb-3">
        {/* Header Row: Title 
```
### `src/components/canvas/ArchitectureTopology.tsx`

- **PromptTemplateLiteral** @ L87

```
系统架构图、流程图或网络拓扑图，系统将直接展示您上传的图片。
      </div>

      {/* 上传区域 */}
      {!imageUrl && (
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-all
            ${isDragging 
              ? 'border-cyan-500 bg-cyan-500/10' 
              : 'border-zinc-700 hover:border-zinc-600'
         
```
### `src/components/canvas/BabelExecutor.tsx`

- **PromptTemplateLiteral** @ L63

```
        }
      }

      // Step 2: Wrap code in React component template with injected logic
      const wrappedCode = `
        const GeneratedApp = () => {
          // Standard State Hooks
          const [activeTab, setActiveTab] = React.useState('首页');
          const [showModal, setShowModal] = React.useState(false);
          cons
```
- **PromptTemplateLiteral** @ L99

```
              }
            } else if (type === 'btn' || type === 'link') {
              alert(\`【交互演示】功能已触发: \${text}\`);
            }
          };

          // The JSX Return (User HTML goes here)
          return (
            <div className="relative isolate w-full h-full bg-white overflow-hidden">
              ${codeString}
     
```
- **PromptTemplateLiteral** @ L156

```
  
        // Display error in container
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <div style="padding: 20px; color: #ef4444; background: #fee2e2; border-radius: 8px;">
              <h3 style="margin: 0 0 10px 0;">编译错误</h3>
              <pre style="margin: 0; font-size: 12px; white-spac
```
### `src/components/canvas/CommandBar.tsx`

- **PromptTemplateLiteral** @ L70

```
wHeight = Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight));
      textarea.style.height = `${newHeight}px`;
    }
  }, []);

  // 创建模式的 action（必须在所有使用它的函数之前定义）
  const { execute: executeCreate, isPending: isCreating } = useServerAction(generateGraph, {
    onSuccess: (result) => {
      log('📥 [CommandBar] executeCreate 原始
```
- **PromptTemplateLiteral** @ L155

```
ultData as any).data) : [],
        });
        toast.error('请求过多', {
          description: `请在 ${cooldownSeconds} 秒后重试`,
          duration: cooldownSeconds * 1000,
        });
        setIsProcessingVideo(false);
        setIsTimeoutOverride(false);
        clearLoadingTimers();
        setProgress(0);
        setLoadingStep('');
     
```
- **PromptTemplateLiteral** @ L654

```
nse.type) {
          case 'rate_limit':
            errorMessage = `请求过多，请在 ${errorResponse.cooldownSeconds || 10} 秒后重试`;
            break;
          case 'network_error':
            errorMessage = '网络连接失败，请检查网络后重试';
            break;
          case 'timeout':
            errorMessage = '请求超时，请稍后重试';
            break;
          case 
```
- **PromptTemplateLiteral** @ L673

```
类型，使用通用错误信息
        errorMessage = `生成失败：${error.message}`;
      } else {
        errorMessage = `生成失败：${String(error)}`;
      }
      
      toast.error('操作失败', {
        description: errorMessage,
        duration: 5000,
      });
      setIsProcessingVideo(false);
      setIsTimeoutOverride(false); // 重置超时覆盖标志
      clearLoadingTimer
```
- **PromptTemplateLiteral** @ L752

```
      setRateLimitCooldown(cooldown);
        
        toast.error('请求过多', {
          description: `请在 ${cooldown} 秒后重试`,
          duration: cooldown * 1000,
        });
      }
      
      // ⚠️ 重要：onSuccess 回调只在创建模式下创建新节点
      // 编辑模式下，节点更新逻辑在 handleSubmit 中直接处理，不在这里执行
      if (response.ok && response.type === 'UI_HTML' && !isEditM
```
- **PromptTemplateLiteral** @ L763

```
建新节点并设置 HTML
        log('📝 [CommandBar] 创建模式：创建新节点');
        const newNode: any = {
          id: `node-${Date.now()}`,
          type: 'page',
          position: { x: 100, y: 100 },
          data: {
            label: '新页面',
            artifacts: {
              view: {
                code: response.html,
              },
        
```

> …(90 more)

### `src/components/canvas/HtmlFirstPreview.tsx`

- **PromptTemplateLiteral** @ L310

```
;
        });
        bodyContent = bodyContent.trim();

        // Wrap in complete HTML document
        exportHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageName}</title>
  ${styles.join('\n')}
  ${scripts.join('\n')}
  
```
- **PromptTemplateLiteral** @ L339

```
d(link);
      URL.revokeObjectURL(url);
      
      toast.success('导出成功', {
        description: `已导出 ${pageName}.html`,
        duration: 2000,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '导出失败';
      console.error('Export HTML failed:', error);
      toast.error('导出 HTML 失败', {

```
- **PromptTemplateLiteral** @ L400

```
ess as number;
        toast.loading('正在导出长图...', {
          id: loadingToast,
          description: `进度: ${progress}%`,
        });
      } else if (message?.type === 'CAPTURE_COMPLETE') {
        toast.dismiss(loadingToast);
        
        const dataUrl = message.dataUrl as string;
        const width = message.width as number;
    
```
- **PromptTemplateLiteral** @ L418

```
Child(link);
        
        toast.success('导出成功', {
          description: `已导出 ${pageName}.png (${width}x${height}px)`,
          duration: 3000,
        });
        
        // Clean up
        window.removeEventListener('message', handleMessage);
        if (iframeDoc.body.contains(captureScript)) {
          iframeDoc.body.removeChi
```
- **PromptTemplateLiteral** @ L582

```
div className="w-full h-full relative">
            <HtmlSandbox
              key={`edit-${htmlSource.substring(0, 50)}`} // 使用 key 强制重新渲染
              html={htmlSource}
              mode="edit"
              injectorScript={buildEditorInjector({ mode: 'edit' }) + '\n' + buildInjectorScript({})}
              heightMode="auto"
        
```
- **PromptTemplateLiteral** @ L608

```
 className="w-full h-full relative">
            <HtmlSandbox
              key={`preview-${htmlSource.substring(0, 50)}`} // 使用 key 强制重新渲染
              html={htmlSource}
              mode="preview"
              injectorScript={buildInjectorScript({})}
              heightMode="auto"
              className="w-full h-full"
            
```

> …(2 more)

### `src/components/canvas/HtmlSandbox.tsx`

- **PromptTemplateLiteral** @ L61

```
With('<html')) {
      return trimmed;
    }

    // If it's a fragment, wrap it in a complete HTML document
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
${trimmed
```
- **PromptTemplateLiteral** @ L89

```
ameDoc.createElement('script');
        bootstrapScript.id = 'sandbox-bootstrap';
        bootstrapScript.textContent = `
(function() {
  'use strict';
  
  // Bootstrap listener for script injection
  window.addEventListener('message', function(event) {
    if (event.source !== window.parent) return;
    
    const message = event.data;

```
### `src/components/canvas/HtmlSandboxRenderer.tsx`

- **PromptTemplateLiteral** @ L76

```
== 'none') {
        errors.push(`Render Guard: Root element has backdrop-filter "${rootBackdropFilter}" (expected none)`);
      }

      // Check 2: At least one element using bg-gradient-* renders a non-gray background
      const gradientElements = iframeDoc.querySelectorAll('[class*="bg-gradient"]');
      let hasNonGrayGradient = fa
```
- **PromptTemplateLiteral** @ L152

```
lid: false,
        errors: [`Render Guard: Exception during checks: ${err instanceof Error ? err.message : String(err)}`],
      };
    }
  }
}

/**
 * Unified Behavior Injector
 * 
 * Single source of truth for all UI behavior:
 * - No inline event handlers in HTML
 * - All DOM mutations go through this injector
 * - All click, filter, 
```
- **PromptTemplateLiteral** @ L312

```
    // Show selected tab panel
            const targetPanel = doc.querySelector(`[id="${tabId}"], [data-tab="${tabId}"]`);
            if (targetPanel) {
              targetPanel.classList.remove('hidden');
              (targetPanel as HTMLElement).style.display = '';
            }
            // Update active tab state
            doc
```
- **PromptTemplateLiteral** @ L384

```
          if (modalId) {
                  const modal = doc.querySelector(`[id="${modalId}"], [data-modal="${modalId}"]`);
                  if (modal) {
                    modal.classList.remove('hidden');
                    (modal as HTMLElement).style.display = 'flex';
                  }
                }
                break;
   
```
- **PromptTemplateLiteral** @ L593

```
       // Update elements with data-bind attribute
          const elements = doc.querySelectorAll(`[data-bind="${key}"]`);
          elements.forEach((el) => {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
              (el as HTMLInputElement).value = String(value);
            } else if (el.tagName === 'SELECT'
```
- **PromptTemplateLiteral** @ L615

```
  getData: (key?: string): any => {
        if (key) {
          const element = doc.querySelector(`[data-bind="${key}"]`);
          if (element) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
              return (element as HTMLInputElement).value;
            } else if (element.tagName === 'SELECT')
```

> …(6 more)

### `src/components/canvas/LivePreview.tsx`

- **PromptTemplateLiteral** @ L136

```


    try {
      // 步骤 1: 移除 Markdown 标记
      let cleaned = code.replace(/```tsx|```jsx|```javascript|```typescript|```/g, '').trim();

      // 步骤 2: 处理 export default
      // 如果代码有 export default function App()，转换为 const App = function App()
      cleaned = cleaned.replace(
        /export\s+default\s+function\s+(\w+)\s*\(/g,
       
```
- **PromptTemplateLiteral** @ L211

```
conName, to: replacementIcon });
          console.warn(`⚠️ [LivePreview] 图标 "${iconName}" 不存在，将替换为 "${replacementIcon}"`);
        }
      });
      
      // 应用图标替换（只替换 JSX 标签中的图标名）
      if (Array.isArray(iconReplacements) && iconReplacements.length > 0) {
        iconReplacements.forEach(({ from, to }) => {
          // 只替换 JSX 标签中的图标
```
- **PromptTemplateLiteral** @ L222

```
y(iconReplacements) ? iconReplacements : []).map((r: { from: string; to: string }) => `${r.from} → ${r.to}`).join(', ')}`);
      }

      // 步骤 5: 添加依赖声明和返回语句
      const hasReactHooksDeclaration = /(?:const|let|var)\s+\{\s*(?:useState|useEffect|useRef|useCallback)/.test(cleaned);
      const hasLucideDeclaration = /(?:const|let|var)\s+(
```
- **PromptTemplateLiteral** @ L276

```
   const iconInitializations = validIconNames
                .map((name: string) => `var ${name} = LucideIcons.${name};`)
                .join('\n            ');
              
              // 将图标声明放在最前面
              declarations.unshift(iconInitializations);
              
              // 调试信息
              console.log(`✅ [LivePrevi
```
- **PromptTemplateLiteral** @ L283

```
 调试信息
              console.log(`✅ [LivePreview] 已初始化 ${validIconNames.length} 个图标${hasMic ? ' (包括 Mic)' : ' (Mic 未包含)'}`);
            } else {
              console.warn('⚠️ [LivePreview] 没有有效的图标可以初始化');
            }
          } else {
            console.warn('⚠️ [LivePreview] 未找到任何图标名称');
          }
        } else {
          consol
```
- **PromptTemplateLiteral** @ L328

```
pp() 或 function Page() 声明。');
          }
        `;
      } else {
        // 代码可能不是函数格式，尝试包装成函数
        wrappedCode = `
          ${cleaned}
          
          // 返回组件（优先使用 App，然后是 Page，最后是提取的组件名）
          if (typeof App !== 'undefined') {
            return App;
          } else if (typeof Page !== 'undefined') {
            return 
```

> …(9 more)

### `src/components/canvas/NodeDetailPanel.tsx`

- **PromptTemplateLiteral** @ L215

```
catch (e) {
      const errorMessage = e instanceof Error ? e.message : '未知错误';
      toast.error(`优化失败: ${errorMessage}`);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSourceChange = (newHtml: string) => {
    if (selectedNode) {
      // 保留现有的 stage 字段（如果存在），否则不设置（保持原有逻辑）
      const currentView = 
```
- **PromptTemplateLiteral** @ L302

```
t a = document.createElement('a');
      a.href = url;
      a.download = `${selectedNode?.data?.label || 'export'}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('导出成功');
    } catch (error) {
      toast.error('导出失败，请稍后重试');
    }
  };


```
- **PromptTemplateLiteral** @ L423

```
console.error('Generate PRD error:', error);
      toast.error(`生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 生成完整页面级 PRD（使用配置对话框）
  const handleGenerateFullPrd = () => {
    const code = data.artifacts.view.code;
    if (!code || code.trim().length === 0) {
      t
```
- **PromptTemplateLiteral** @ L451

```
ns) => {
    try {
      const code = data.artifacts.view.code;
      const fileName = `${data.label || 'Component'}.tsx`;
      const componentName = data.label;
      
      // 获取已有的需求文档，用于提取功能表格
      const existingRequirements = data.artifacts.spec?.requirements;
      
      // 生成完整 PRD，传入已有需求文档以便提取功能表格
      const fullPrd = generate
```
- **PromptTemplateLiteral** @ L483

```
catch (e) {
      const errorMessage = e instanceof Error ? e.message : '未知错误';
      toast.error(`生成失败: ${errorMessage}`);
    }
  };

  // 检查 impl 是否为空（使用安全的 artifacts 访问）
  const isImplEmpty = !artifacts.impl || 
    ((!artifacts.impl.apiEndpoints || artifacts.impl.apiEndpoints.length === 0) &&
     (!artifacts.impl.dbSchema || 
      
```
- **PromptTemplateLiteral** @ L571

```
lt.data.cases || [],
          }
        }
      });
      toast.success(`测试用例生成完成，共生成 ${result.data.cases.length} 个测试用例`);
    } catch (e) {
      console.error('Generate test cases error:', e);
      const errorMessage = e instanceof Error ? e.message : '生成失败，请稍后重试';
      toast.error(errorMessage);
    } finally {
      setIsLoading(fa
```

> …(6 more)

### `src/components/canvas/PresentationMode.tsx`

- **PromptTemplateLiteral** @ L385

```
           className="flex items-start justify-center"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top center',
                width: '100%',
                height: 'auto',
                marginTop: '8px', // 确保设备框架上沿在导航栏下方
              }}
            >
              {/* iPhone
```
- **PromptTemplateLiteral** @ L453

```
     max-width: 100%;
                          box-sizing: border-box;
                        }
                      `}</style>
                      
                      {/* Force centering and max-width - 确保内容不超出边界且居中 */}
                      <div className="w-full min-h-full flex flex-col" style={{ padding: '0', margin: '0' }}>
 
```
- **PromptTemplateLiteral** @ L510

```
               toast.warning('导航目标未找到', {
                                            description: `无法找到节点: ${navTarget}`,
                                            duration: 2000,
                                          });
                                        }
                                      }
                             
```
- **PromptTemplateLiteral** @ L560

```
bg-gray-50/95 text-gray-400 cursor-not-allowed backdrop-blur-sm border border-gray-200'
                }
              `}
              title={prevNodeId || navigationHistoryRef.current.length > 0 ? "上一页" : "没有上一页"}
            >
              <ChevronLeft className="w-4 h-4" />
              上一页
            </button>
            <button
```
### `src/components/canvas/ProjectBlueprint.tsx`

- **PromptTemplateLiteral** @ L248

```
^a-zA-Z0-9]/g, '_');
      const nodeLabel = node.data.label || node.id;
      lines.push(`    ${nodeId}["${nodeLabel}"]`);
    });

    // 添加边
    edges.forEach((edge) => {
      const sourceId = edge.source.replace(/[^a-zA-Z0-9]/g, '_');
      const targetId = edge.target.replace(/[^a-zA-Z0-9]/g, '_');
      const label = String(edge.la
```
- **PromptTemplateLiteral** @ L258

```
l = label.replace(/"/g, '&quot;').replace(/\n/g, ' ');
      lines.push(`    ${sourceId} -->|"${safeLabel}"| ${targetId}`);
    });

    return lines.join('\n');
  }, [nodes, edges]);

  // 生成业务泳道图（Sequence Diagram格式）
  const generateSwimlaneCode = React.useCallback((): string => {
    if (nodes.length === 0 || edges.length === 0) {
     
```
- **PromptTemplateLiteral** @ L351

```
 uniqueId;
      roleToSafeId.set(roleLabel, safeId);
      
      lines.push(`    participant ${safeId} as ${roleLabel}`);
    });

    // 第三步：生成交互序列
      edges.forEach((edge) => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
      
      if (!sourceN
```
- **PromptTemplateLiteral** @ L395

```
d = 'P_' + targetSafeId;
        }
      }
      
      lines.push(`    ${sourceSafeId}->>${targetSafeId}: ${safeAction}`);
      });

      return lines.join('\n');
  }, [nodes, edges]);

  // 生成业务泳道图（基于角色）
  const businessProcessDiagram = useMemo(() => {
    return generateSwimlaneCode();
  }, [generateSwimlaneCode]);

  // 生成用户旅程图数据（用于
```
- **PromptTemplateLiteral** @ L463

```
e.allUserStories[0];
    const journeyTitle = `${firstStory.story.role}的完整旅程`;
    lines.push(`    title ${journeyTitle}`);
    
    // 按节点分组用户故事，每个节点作为一个 section
    const storiesByNode = new Map<string, typeof generateUserJourneyTable.allUserStories>();
    generateUserJourneyTable.allUserStories.forEach((item) => {
      if (!storiesBy
```
- **PromptTemplateLiteral** @ L479

```
el = (node.data.label || node.id).replace(/"/g, '&quot;').substring(0, 30);
        lines.push(`    section ${nodeLabel}`);
        
        // 为每个用户故事添加步骤
        nodeStories.forEach((item) => {
          const stepLabel = item.story.activity.replace(/"/g, '&quot;').substring(0, 40);
          const satisfaction = 75; // 默认满意度
          
```

> …(12 more)

### `src/components/canvas/ProjectRecovery.tsx`

- **PromptTemplateLiteral** @ L41

```
 && edges) {
        loadProject({ nodes, edges });
        toast.success(`已恢复 ${nodes.length} 个节点和 ${edges.length} 条边`);
      } else {
        toast.error('数据格式不正确');
      }
    } catch (error) {
      toast.error('恢复失败: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleExportLocalStora
```
- **PromptTemplateLiteral** @ L58

```
ew Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `recovered-project-${timestamp}.json`;
      
      const blob = new Blob([localStorageData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      lin
```
### `src/components/canvas/ProjectToolbar.tsx`

- **PromptTemplateLiteral** @ L30

```
mestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `project-${timestamp}.json`;
      
      const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = 
```
- **PromptTemplateLiteral** @ L43

```
hild(link);
      URL.revokeObjectURL(url);
      
      toast.success('项目已保存', {
        description: `已保存为 ${filename}`,
      });
    } catch (error) {
      toast.error('保存项目失败', {
        description: error instanceof Error ? error.message : '未知错误',
      });
    }
  };

  const handleOpenProject = () => {
    fileInputRef.current?.c
```
- **PromptTemplateLiteral** @ L88

```
edges,
        });
        
        toast.success('项目已加载', {
          description: `已加载 ${projectData.nodes.length} 个节点`,
        });
      } catch (error) {
        toast.error('加载项目失败', {
          description: error instanceof Error
            ? error.message
            : '请检查文件格式是否正确',
        });
      }
    };
    reader.onerror 
```
- **JSON_in_prompt** @ L32

```
ace(/[:.]/g, '-').slice(0, -5);
      const filename = `project-${timestamp}.json`;
      
      const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
  
```
- **JSON_in_prompt** @ L141

```
t fetch('/api/generate-prd', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodes: nodes.map(node => ({
          id: node.id,
          label: node.data.label,
          type: node.type,
          spec: node.data.artifacts?.spec,
        })),
        projectMeta: projec
```
### `src/components/canvas/ReactJitRenderer.tsx`

- **PromptTemplateLiteral** @ L76

```
ct',
        'useState',
        'useEffect',
        'Recharts',
        'createRoot',
        'renderTarget',
        `
          // Make React available in scope
          const { useState, useEffect } = React;
          ${output}
          
          // Render the component
          if (typeof App !== 'undefined') {
            const
```
- **PromptTemplateLiteral** @ L117

```
/ 降级策略：编译失败时，尝试直接显示静态 HTML（保底）
  if (error) {
    return (
      <div className={`border border-red-500 p-4 ${className}`}>
        <div className="text-red-500 text-sm mb-2">交互逻辑加载失败，已降级为静态视图</div>
        {rawHtml && (
          <div dangerouslySetInnerHTML={{ __html: rawHtml }} />
        )}
        {!rawHtml && (
          <div classN
```
### `src/components/canvas/SpecViewer.tsx`

- **PromptTemplateLiteral** @ L17

```
=== 'presentation';

  return (
    <div className={`prose prose-invert max-w-none ${isPresentation ? 'prose-zinc' : ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[]}
        components={{
          table: ({ children }) => {
            if (isPresentation) {
              return (
                
```
### `src/components/canvas/StyleExtractor.tsx`

- **PromptTemplateLiteral** @ L165

```
* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* 上传区域 */}
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-all
            ${isDragging 
              ? 'border-purple-500 bg-purple-500/10' 
              : 'border-zinc-700 hover:border-zinc-600'
     
```
- **PromptTemplateLiteral** @ L234

```
dColor: getColorPreview(previewTheme.colors.primary) }}
                      title={`主色: ${previewTheme.colors.primary}`}
                    />
                    <span className="text-xs text-zinc-400">主色</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
              
```
- **PromptTemplateLiteral** @ L242

```
or: getColorPreview(previewTheme.colors.secondary) }}
                      title={`次色: ${previewTheme.colors.secondary}`}
                    />
                    <span className="text-xs text-zinc-400">次色</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
              
```
- **PromptTemplateLiteral** @ L250

```
Preview(previewTheme.colors.background.dark) }}
                      title={`背景: ${previewTheme.colors.background.dark}`}
                    />
                    <span className="text-xs text-zinc-400">背景</span>
                  </div>
                </div>
              </div>

              {/* 示例按钮预览 */}
              <div classN
```
- **JSON_in_prompt** @ L56

```
e', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          imageBase64: base64,
          aiConfig: aiConfig, // 传递 AI 模型配置
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(error
```
- **LargeContext** @ L57

```
,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          imageBase64: base64,
          aiConfig: aiConfig, // 传递 AI 模型配置
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '风格提取失败');
   
```
### `src/components/canvas/TopologyUploader.tsx`

- **PromptTemplateLiteral** @ L65

```
     setParseResult(result[0]);
        toast.success(`成功识别 ${result[0].nodes.length} 个节点和 ${result[0].edges.length} 条连接`);
      } else {
        throw new Error('解析结果为空');
      }
    } catch (error) {
      logError('❌ [TopologyUploader] 拓扑图解析失败:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
    
```
- **PromptTemplateLiteral** @ L141

```
ssName="text-3xl font-bold mb-4">${node.label}</h1>
      <p className="text-gray-600">这是从拓扑图导入的节点</p>
    </div>
  );
}`,
              },
              spec: {
                title: node.label,
                requirements: ['从拓扑图导入'],
              },
              impl: {
                apiEndpoints: [],
                dbSchema: '-
```
- **PromptTemplateLiteral** @ L169

```
ge[] = parseResult.edges.map((edge, index) => {
        return {
          id: `e-${edge.source}-${edge.target}-${index}`,
          source: edge.source,
          target: edge.target,
          type: 'smart',
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
          label: edge.labe
```
- **PromptTemplateLiteral** @ L194

```
Timeout(() => {
        layoutNodes();
      }, 100);

      toast.success(`已添加 ${nodes.length} 个节点和 ${edges.length} 条连接`);
      log('✅ [TopologyUploader] 拓扑图已应用到画布');

      if (onClose) {
        onClose();
      }
    } catch (error) {
      logError('❌ [TopologyUploader] 应用拓扑图失败:', error);
      toast.error('应用拓扑图失败，请重试');
    }
  },
```
- **PromptTemplateLiteral** @ L236

```
rder-zinc-600'
            }
            ${isProcessing || isPending ? 'opacity-50 pointer-events-none' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*
```
- **LargeContext** @ L59

```
  log('📸 [TopologyUploader] 图片转换为 base64 完成，开始解析拓扑图');

      // 调用解析 API
      const result = await execute({
        imageBase64: base64,
      });

      if (result && result[0]) {
        log('✅ [TopologyUploader] 拓扑图解析成功:', result[0]);
        setParseResult(result[0]);
        toast.success(`成功识别 ${result[0].nodes.length} 个节点和 ${re
```
### `src/components/canvas/ViewWorkbench.tsx`

- **PromptTemplateLiteral** @ L132

```
     const link = document.createElement('a');
        link.href = msg.dataUrl;
        link.download = `${pageName}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.dismiss(); // Dismiss any loading toast
        toast.success('导出成功', {
          descript
```
- **PromptTemplateLiteral** @ L139

```
loading toast
        toast.success('导出成功', {
          description: `已导出 ${pageName}.png (${msg.width}x${msg.height}px)`,
          duration: 3000,
        });
        break;
        
      case 'ERROR':
        toast.error('错误', {
          description: msg.message,
          duration: 3000,
        });
        break;
        
      cas
```
### `src/components/canvas/WordUploader.tsx`

- **PromptTemplateLiteral** @ L96

```
alidExtension) {
      toast.error(`请上传 Word 文件（支持格式：.doc、.docx），当前文件：${file.name}${file.type ? `，类型：${file.type}` : ''}`);
      return;
    }
    
    // 如果 MIME 类型不匹配但扩展名有效，给出警告但继续处理
    if (!isValidMimeType && file.type) {
      log('[WordUploader] MIME 类型不匹配，但扩展名有效，继续处理:', {
        fileName: file.name,
        fileType: file.type,
 
```
- **PromptTemplateLiteral** @ L156

```
sage = error instanceof Error ? error.message : '文件处理失败，请重试';
      toast.error(`文件 "${file.name}" 处理失败: ${errorMessage}`);
    } finally {
      // 延迟重置处理状态，给其他文件处理留出时间
      setTimeout(() => {
        setIsProcessing(false);
      }, 100);
    }
  }, [parseWordFile, onFileUploaded]);

  // 处理文件输入（支持多选）
  const handleFileInput = useCallb
```
- **PromptTemplateLiteral** @ L179

```
h; i++) {
        const file = fileArray[i];
        log(`[WordUploader] 处理文件 ${i + 1}/${fileArray.length}: ${file.name}`);
        await handleFileSelect(file);
      }
      // 清空 input，允许重复选择相同文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      log('[WordUploader] 没有选择任何文件');
    }
 
```
- **PromptTemplateLiteral** @ L282

```
-700 hover:border-zinc-600'
            }
            ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
          `}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={(e) => {
            e.preventDefault();
         
```
### `src/components/editor/OutlineTreeItem.tsx`

- **PromptTemplateLiteral** @ L42

```
nded);
    }
  };

  return (
    <div>
      {/* 当前节点行 */}
      <div
        onClick={handleClick}
        className={`
          flex items-center gap-1.5 py-1.5 px-2 text-sm transition-colors cursor-pointer
          ${isSelected 
            ? 'bg-purple-600/20 text-zinc-200' 
            : 'text-zinc-400 hover:text-zinc-200 hover:bg
```
### `src/lib/ai/json-extract.test.ts`

- **JSON_in_prompt** @ L6

```
/**
 * JSON 提取工具测试
 */

import { extractFirstJsonObject, safeParseZodJson } from './json-extract';
import { z } from 'zod';

// 简单测试工具（如果没有测试框架）
function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    console.error(`❌ ${name}:`, error);
    throw error;
  }
}

function assert
```
- **JSON_in_prompt** @ L20

```
`❌ ${name}:`, error);
    throw error;
  }
}

function assertEqual<T>(actual: T, expected: T, message?: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message || 'Assertion failed'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertNull(actual: unkn
```
- **JSON_in_prompt** @ L20

```
hrow error;
  }
}

function assertEqual<T>(actual: T, expected: T, message?: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message || 'Assertion failed'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertNull(actual: unknown, message?: string) {
  
```
- **JSON_in_prompt** @ L21

```
SON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message || 'Assertion failed'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertNull(actual: unknown, message?: string) {
  if (actual !== null) {
    throw new Error(`${message || 'Assertion failed'}: expected null, g
```
- **JSON_in_prompt** @ L21

```
ringify(expected)) {
    throw new Error(`${message || 'Assertion failed'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertNull(actual: unknown, message?: string) {
  if (actual !== null) {
    throw new Error(`${message || 'Assertion failed'}: expected null, got ${JSON.stringify(actual)}`);
 
```
- **JSON_in_prompt** @ L27

```
essage?: string) {
  if (actual !== null) {
    throw new Error(`${message || 'Assertion failed'}: expected null, got ${JSON.stringify(actual)}`);
  }
}

function assert(condition: boolean, message?: string) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// 测试用例
function runTests() {
  console.log('\n📦 e
```

> …(1 more)

### `src/lib/ai/json-extract.ts`

- **PromptTemplateLiteral** @ L95

```
   ok: false,
        error: `JSON parse error: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
        raw: jsonStr.length > 200 ? jsonStr.substring(0, 200) + '...' : jsonStr,
      };
    }

    // 步骤3: Zod 验证
    const result = schema.safeParse(parsed);
    
    if (result.success) {
      return { ok: true, 
```
- **JSON_in_prompt** @ L6

```
/**
 * JSON 提取与安全解析工具
 * 解决 AI 返回拼接 JSON 或带噪声 JSON 的解析问题
 */

import { z } from 'zod';

/**
 * 从文本中提取第一个完整的 JSON 对象
 * 规则：从第一个 '{' 开始，做括号计数，找到完整 JSON 对象结束位置
 * 忽略前后噪声；只取第一个完整对象
 */
export function extractFirstJsonObject(text: string): string | null {
  if (!text || typeof text !== 'string') {
    ret
```
- **JSON_in_prompt** @ L69

```
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
export function safeParseZodJson<T>(
  text: string,
  schema: z.ZodSchema<T>
): { ok: true; data: T } | { ok: false; error: string; raw?: string } {
  try {
    // 步骤1: 提取第一个 
```
- **JSON_in_prompt** @ L74

```
ect -> JSON.parse -> schema.safeParse
 * 失败时返回 ok:false，不抛异常
 */
export function safeParseZodJson<T>(
  text: string,
  schema: z.ZodSchema<T>
): { ok: true; data: T } | { ok: false; error: string; raw?: string } {
  try {
    // 步骤1: 提取第一个 JSON 对象
    const jsonStr = extractFirstJsonObject(text);
    
    if (!jsonStr) {
      return {
 
```
- **JSON_in_prompt** @ L101

```
onStr.length > 200 ? jsonStr.substring(0, 200) + '...' : jsonStr,
      };
    }

    // 步骤3: Zod 验证
    const result = schema.safeParse(parsed);
    
    if (result.success) {
      return { ok: true, data: result.data };
    } else {
      return {
        ok: false,
        error: `Zod validation error: ${result.error.issues.map(e => `
```
### `src/lib/ai/llm-mock.ts`

- **PromptTemplateLiteral** @ L281

```
mage placeholder (inline SVG)
 * - No external network fetches
 */
function generateMockStaticHTML(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mock Static Page</title>
  <style>
    :root {
      --color-bg: #fff
```
- **PromptTemplateLiteral** @ L454

```
anges CSS, keeps DOM structure and component IDs unchanged
 */
function generateMockBeautifiedHTML(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mock Beautified Page</title>
  <style>
    :root {
      --color-bg: 
```
- **PromptTemplateLiteral** @ L656

```
n pattern
 * Keeps structure stable, adds a11y attributes
 */
function generateMockInteractiveHTML(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mock Interactive Page</title>
  <style>
    :root {
      --color-bg:
```
- **JSON_in_prompt** @ L8

```
sponses for E2E testing.
 * Controlled by AI_RUNTIME environment variable: 'mock' | 'real'
 */

import type { z } from 'zod';
import type { AIResult } from './llm';
import { log } from '@/lib/logger';

/**
 * Check if we should use mock mode
 */
export function shouldUseMock(): boolean {
  const runtime = process.env.AI_RUNTIME || 'real';
```
- **JSON_in_prompt** @ L39

```
 if (params.actionName === 'generateGraph' || params.actionName?.includes('generateGraph')) {
    const mockGraphJSON = JSON.stringify({
      clarity: {
        confidence: 85,
        isVague: false,
        detectedDomain: '产品展示',
        detectedBusinessObject: '产品',
        detectedAction: '展示',
      },
      graph: {
        global
```
- **JSON_in_prompt** @ L107

```
nalyzeInputClarity, return JSON
  if (params.actionName?.includes('analyzeInputClarity')) {
    const mockClarityJSON = JSON.stringify({
      confidence: 85,
      isVague: false,
      detectedDomain: '产品展示',
      detectedBusinessObject: '产品',
      detectedAction: '展示',
    }, null, 2);
    
    return {
      ok: true,
      data: mo
```

> …(6 more)

### `src/lib/ai/llm.ts`

- **PromptTemplateLiteral** @ L184

```
     totalMs: 0,
      },
    };
  }

  const requestId = `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Generate stable task key: model + actionName + hash(prompt/messages) + hash(attachments) + mode
  // Avoid concatenating long prompt/messages into keyInput
  const promptHash = prompt ? stableHash(prompt) : '';

```
- **PromptTemplateLiteral** @ L193

```
}:${mode}`;
  const keyHash = stableHash(keyInput);
  const taskKey: GatewayTaskKey = `${model}:${actionName}:${keyHash}`;

  // Check cooldown gate (fast-fail, <= 2s)
  const cooldownCheck = checkCooldownGate();
  if (cooldownCheck.blocked) {
    log('🚫 [LLM Gateway] Request blocked by cooldown gate', {
      requestId,
      cooldownSe
```
- **PromptTemplateLiteral** @ L205

```
);
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
  const queueStartMs = D
```
- **PromptTemplateLiteral** @ L309

```
ctionName || 'unknown',
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
        updateCooldownG
```
- **PromptTemplateLiteral** @ L328

```
,
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
        log
```
- **PromptTemplateLiteral** @ L345

```
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
   
```

> …(22 more)

### `src/lib/graph/fallback-graph.ts`

- **PromptTemplateLiteral** @ L256

```
,
    type: 'page',
    position: { x, y },
    data: {
      label,
      artifacts: {
        view: {
          code: `function App() {
  return (
    <div className="p-8 bg-white">
      <h1 className="text-3xl font-bold text-gray-900">${label}</h1>
      <p className="mt-4 text-gray-600">这是 ${label} 页面</p>
    </div>
  );
}`,
        
```
- **PromptTemplateLiteral** @ L267

```
 页面</p>
    </div>
  );
}`,
        },
        spec: {
          title: label,
          requirements: [`页面描述：${label}页面`],
        },
        impl: {
          apiEndpoints: [],
          dbSchema: '-- 将在后续阶段生成',
        },
        test: {
          cases: [],
        },
        userStories: [
          {
            id: `US-${id}-001`,

```
- **PromptTemplateLiteral** @ L282

```
abel}执行操作` : `查看${label}`,
            value: `完成${label}相关功能`,
            acceptanceCriteria: [`${label}页面正常显示`, `功能可用`],
          },
        ],
        businessContext: {
          domain: '通用业务',
          role: '用户',
          goal: pageType === 'Action' ? '执行操作' : '查看信息',
        },
        ...(pageType === 'Action' ? {
          e
```
- **PromptTemplateLiteral** @ L294

```
pe === 'Action' ? {
          events: [
            {
              id: `EVT-${id}-001`,
              name: `${label}操作`,
              trigger: '用户操作',
              type: 'UserAction' as const,
              processFlow: [
                {
                  step: 1,
                  action: '处理操作',
                  desc: `执行${label}
```
- **PromptTemplateLiteral** @ L311

```
  } : {
          dataQueries: [
            {
              id: `Q-${id}-001`,
              description: `查询${label}数据`,
              sorting: '按创建时间降序',
              filtering: '显示有效数据',
              dataSource: '从数据库查询',
            },
          ],
        }),
      },
      syncState: {
        isSynced: false,
        lastSource:
```
- **JSON_in_prompt** @ L5

```
nistic Fallback Graph Builder
 * 
 * Rule-based graph generation when AI fails or rate-limited.
 * Always returns valid schema with non-empty nodes.
 */

import type { FractalNode } from '@/types/fractal';
import type { Edge } from 'reactflow';

export interface FallbackGraphResult {
  global: {
    userJourneys: Array<{
      id: string;
```
### `src/lib/logger.ts`

- **PromptTemplateLiteral** @ L16

```
nds}.${milliseconds}`;
};

const formatMessage = (message: string): string => {
  return `[${getTimestamp()}] ${message}`;
};

/**
 * 带时间戳的 console.log
 */
export const log = (...args: any[]) => {
  if (args.length === 0) return;
  
  // 如果第一个参数是字符串，添加时间戳
  if (typeof args[0] === 'string') {
    console.log(formatMessage(args[0]), ...args
```
- **PromptTemplateLiteral** @ L30

```
console.log(formatMessage(args[0]), ...args.slice(1));
  } else {
    // 否则在开头添加时间戳
    console.log(`[${getTimestamp()}]`, ...args);
  }
};

/**
 * 从错误堆栈中提取第一行（第一个堆栈帧）
 */
const getFirstLineOfStack = (stack: string | undefined): string | undefined => {
  if (!stack) return undefined;
  const lines = stack.split('\n');
  // 第一行通常是错误消息（如 "E
```
- **PromptTemplateLiteral** @ L142

```
.error(`${timestampPrefix} ❌`, errorInfo);
    return;
  }
  
  // 其他情况：保持原样，只添加时间戳
  console.error(`[${getTimestamp()}]`, ...args);
};

/**
 * 带时间戳的 console.warn
 */
export const logWarn = (...args: any[]) => {
  if (args.length === 0) return;
  
  if (typeof args[0] === 'string') {
    console.warn(formatMessage(args[0]), ...args.slice(
```
- **PromptTemplateLiteral** @ L154

```
'string') {
    console.warn(formatMessage(args[0]), ...args.slice(1));
  } else {
    console.warn(`[${getTimestamp()}]`, ...args);
  }
};

/**
 * 带时间戳的 console.info
 */
export const logInfo = (...args: any[]) => {
  if (args.length === 0) return;
  
  if (typeof args[0] === 'string') {
    console.info(formatMessage(args[0]), ...args.sl
```
### `src/lib/openai-client.ts`

- **PromptTemplateLiteral** @ L52

```
Request, options?: RequestInit) => {
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    let attemptCount = 0;
    
    // CRITICAL: Respect options.signal from llm.ts (do not override)
    // If options.signal exists, use it; otherwise create a fallback controller fo
```
- **PromptTemplateLiteral** @ L298

```
URL?.trim();
  if (baseURL) {
    config.baseURL = baseURL.endsWith('/v1') ? baseURL : `${baseURL.replace(/\/$/, '')}/v1`;
  }

  return createOpenAI(config);
}

/**
 * Get OpenAI provider instance (for use with generateObject, etc.)
 * This is a convenience function that returns the provider function directly
 * 
 * @param aiConfig - Opt
```
### `src/lib/prompts/index.ts`

- **PromptTemplateLiteral** @ L21

```
用户: ${projectMeta.targetAudience}`);
  }
  if (projectMeta.projectName) {
    parts.push(`项目: ${projectMeta.projectName}`);
  }
  
  // 注意：ProjectMeta 类型中没有 constraints 和 styleTags 字段
  // 这些字段可能在未来扩展，目前先移除相关代码
  // 如果需要，可以在 ProjectMeta 类型中添加这些字段
  
  return parts.length > 0 ? parts.join(' | ') : '通用项目';
}

/**
 * 核心角色定义（短）
 */
export con
```
- **PromptTemplateLiteral** @ L49

```
ct & UI/UX Expert

你是一个专业的 React 前端开发专家。`,
};

/**
 * UI Rationalization 核心要求（短且硬）
 */
export const CORE_REQUIREMENTS = `# System: UI Rationalization Engine
**GLOBAL GOAL:** Given ANY UI input, output a MORE RATIONAL, COMPLETE, and USABLE UI.
**This is NOT UI beautification. This is product-level rationalization.**

**CORE REQUIREMENTS:**
```
- **PromptTemplateLiteral** @ L63

```
- The result must feel like a real, shippable product`;

/**
 * 输出契约（短且硬）
 */
export const OUTPUT_CONTRACT = {
  REACT: `# Output
- Return ONLY the full .tsx code
- Icon Rules: Material Icons use <span className="material-icons-round">name</span>; Others use lucide-react
- No markdown, no comments, no explanations
- All text must be in Ch
```
- **PromptTemplateLiteral** @ L79

```
own, no code blocks
- All text must be in Chinese`,
};

/**
 * 交互闭合规则（精简版）
 */
export const INTERACTION_CLOSURE_RULES = `**Interaction Closure Rules (MANDATORY):**
- Any dropdown must open and change state
- Any tab must visibly change content
- Any filter must affect data
- Any status badge must correspond to a data state
- Any action bu
```
- **PromptTemplateLiteral** @ L90

```
 logical action
- If an interaction is visible, it must be functional`;

/**
 * 数据规则（精简版）
 */
export const DATA_RULES = `**Data Rules (MANDATORY):**
- Generate realistic, production-like data (no "示例1", "测试数据")
- Data must support all UI states/filters (each state: 2-3 items minimum)
- Time/status/priority must be logically consistent
- G
```
- **PromptTemplateLiteral** @ L100

```
items minimum for lists
- Never minimize data to simplify UI`;

/**
 * 产品推断策略（精简版）
 */
export const PRODUCT_INFERENCE = `**Product Inference Policy:**
- Use industry-standard patterns (search, filter, list, form, navigation)
- Prefer widely accepted UX conventions (Material Design, iOS HIG)
- Choose single reasonable behavior and implemen
```

> …(8 more)

### `src/lib/safe/preview.ts`

- **JSON_in_prompt** @ L29

```
 {
    return String(x);
  }
  
  // 对象类型：尝试 JSON.stringify
  if (typeof x === 'object') {
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
 * 用于需要强保证的地方（
```
### `src/lib/ui/capture-injector.ts`

- **PromptTemplateLiteral** @ L33

```
ons = {}): string {
  const {
    includeFixed = false,
    quality = 0.9,
    pixelRatio = 2,
  } = options;

  return `
(function() {
  'use strict';
  
  // ==================== PostMessage Helper ====================
  function postToHost(type, payload) {
    if (window.parent && window.parent !== window) {
      window.parent.postMes
```
### `src/lib/ui/edit-injector.ts`

- **PromptTemplateLiteral** @ L11

```
ck to enter contenteditable
 * - Blur to submit patch
 */

export function buildEditInjectorScript(): string {
  return `
(function() {
  'use strict';
  
  let editingElement = null;
  let originalContent = null;
  
  // ==================== PostMessage Helper ====================
  function postToHost(type, payload) {
    if (window.par
```
- **PromptTemplateLiteral** @ L236

```
2f6 !important;
        outline-offset: 2px;
        background-color: rgba(59, 130, 246, 0.1) !important;
      }
    \`;
    document.head.appendChild(style);
    
    // Attach event listeners
    document.addEventListener('click', handleClick, true);
    document.addEventListener('dblclick', handleDoubleClick, true);
    document.addE
```
### `src/lib/ui/editor-injector.ts`

- **PromptTemplateLiteral** @ L22

```
 */
export function buildEditorInjector(options: EditorInjectorOptions): string {
  const { mode } = options;

  return `
(function() {
  'use strict';
  
  const MODE = '${mode}';
  let selectedElement = null;
  let editingElement = null;
  let originalText = null;
  
  // ==================== PostMessage Helper ====================
  fu
```
- **PromptTemplateLiteral** @ L281

```
2f6 !important;
        outline-offset: 2px;
        background-color: rgba(59, 130, 246, 0.1) !important;
      }
    \`;
    document.head.appendChild(style);
    
    if (MODE === 'preview') {
      // Disable selection and editing in preview mode
      document.addEventListener('selectstart', function(e) {
        e.preventDefault();

```
### `src/lib/ui/html-patch.ts`

- **PromptTemplateLiteral** @ L37

```
querySelector(patch.selector);
    if (!element) {
      console.warn(`[applyPatch] Element not found: ${patch.selector}`);
      return html; // Return original on error
    }

    switch (patch.op) {
      case 'SET_TEXT':
        // Only replace text content, preserve child elements
        if (element.childNodes.length === 0 || 
     
```
- **PromptTemplateLiteral** @ L110

```
tor(patch.selector);
        if (!element) {
          console.warn(`[applyPatches] Element not found: ${patch.selector}`);
          continue;
        }

        switch (patch.type) {
          case 'TEXT_REPLACE':
            // Only replace text content, preserve child elements
            if (element.childNodes.length === 0 || 
      
```
- **PromptTemplateLiteral** @ L165

```
Class);
            break;
        }
      } catch (error) {
        console.error(`[applyPatches] Error applying patch:`, patch, error);
      }
    }

    // Serialize back to HTML
    return serializeDocument(doc);
  } catch (error) {
    console.error('[applyPatches] Error parsing HTML:', error);
    return html; // Return original on
```
- **PromptTemplateLiteral** @ L191

```
 += ` PUBLIC "${doc.doctype.publicId}"`;
    }
    if (doc.doctype.systemId) {
      html += ` "${doc.doctype.systemId}"`;
    }
    html += '>\n';
  }

  // Serialize html element with attributes
  const htmlElement = doc.documentElement;
  if (htmlElement) {
    // Get html tag with attributes
    const htmlAttrs: string[] = [];
    Arr
```
- **PromptTemplateLiteral** @ L205

```
replace(/"/g, '&quot;')}"`);
    });
    const htmlTagStr = htmlAttrs.length > 0 
      ? `<html ${htmlAttrs.join(' ')}>`
      : '<html>';
    html += htmlTagStr + '\n';

    // Serialize head (preserves all style, script, link tags)
    if (doc.head) {
      html += '<head>\n';
      // Serialize all head children (style, script, link, 
```
- **PromptTemplateLiteral** @ L225

```
from(doc.body.attributes).forEach(attr => {
        bodyAttrs.push(`${attr.name}="${attr.value.replace(/"/g, '&quot;')}"`);
      });
      if (bodyAttrs.length > 0) {
        html += ' ' + bodyAttrs.join(' ');
      }
      html += '>\n';
      
      // Serialize body content (preserves all elements, scripts, styles)
      Array.from(do
```

> …(1 more)

### `src/lib/ui/html-validator.ts`

- **PromptTemplateLiteral** @ L83

```
C' || stage === 'BEAUTIFY') {
    if (meta.hasScript) {
      errors.push(`Stage ${stage} must not contain <script> tags`);
    }
  }

  if (stage === 'STATIC') {
    if (meta.hasExternalCdn) {
      errors.push('Stage STATIC must not contain external CDN links');
    }
  }

  // Check for stage marker
  const stageMarker = getStageMarker
```
- **PromptTemplateLiteral** @ L96

```
rker = getStageMarker(stage);
  if (!html.includes(stageMarker)) {
    errors.push(`Missing stage marker: ${stageMarker}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    meta,
  };
}

/**
 * Get expected stage marker for a stage
 */
export function getStageMarker(stage: 'STATIC' | 'BEAUTIFY' | 'INTERACT'): string {
  swi
```
- **PromptTemplateLiteral** @ L129

```
Remove markdown code blocks
  cleaned = cleaned
    .replace(/^```(?:html|tsx|jsx|ts|js)?\n?/gm, '')
    .replace(/\n?```$/gm, '')
    .trim();

  // Ensure stage marker is at the end (remove old markers first)
  const stageMarker = getStageMarker(stage);
  cleaned = cleaned.replace(/<!-- UI_PIPELINE:.*?-->\s*/g, '');
  cleaned = `${clean
```
### `src/lib/ui/injector.ts`

- **PromptTemplateLiteral** @ L21

```
to be injected into iframe
 */
export function buildInjectorScript(initialState: InjectorState = {}): string {
  return `
(function() {
  'use strict';
  
  // ==================== State Management ====================
  const state = ${JSON.stringify(initialState)};
  
  // ==================== PostMessage Helper ====================
  f
```
- **PromptTemplateLiteral** @ L45

```
in the same group
    const allButtons = document.querySelectorAll(\`[data-action="tab"][data-tab-group="\${tabGroup}"]\`);
    allButtons.forEach(btn => {
      btn.classList.remove('active', 'bg-blue-500', 'text-white');
      btn.classList.add('bg-gray-200', 'text-gray-700');
    });
    
    // Set clicked button as active
    button.
```
- **PromptTemplateLiteral** @ L72

```
          item.classList.add('hidden');
        }
      });
    }
    
    // Update state
    state[\`tab_\${tabGroup}\`] = tabValue;
  }
  
  // ==================== Filter (data-action="filter") ====================
  function handleFilterClick(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const filte
```
- **PromptTemplateLiteral** @ L86

```
efault';
    const allButtons = document.querySelectorAll(\`[data-action="filter"][data-filter-group="\${filterGroup}"]\`);
    allButtons.forEach(btn => {
      btn.classList.remove('active', 'bg-blue-500', 'text-white');
      btn.classList.add('bg-gray-200', 'text-gray-700');
    });
    
    button.classList.add('active', 'bg-blue-500
```
- **PromptTemplateLiteral** @ L109

```
'none';
        item.classList.add('hidden');
      }
    });
    
    // Update state
    state[\`filter_\${filterKey}\`] = filterValue;
  }
  
  // ==================== Navigation (data-nav) ====================
  function handleNavClick(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const navTarget = 
```
- **PromptTemplateLiteral** @ L164

```
tton) {
              const allButtons = document.querySelectorAll(\`[data-action="tab"][data-tab-group="\${tabGroup}"]\`);
              allButtons.forEach(btn => {
                btn.classList.remove('active', 'bg-blue-500', 'text-white');
                btn.classList.add('bg-gray-200', 'text-gray-700');
              });
            
```

> …(2 more)

### `src/lib/ui/prompt-budget.ts`

- **PromptTemplateLiteral** @ L67

```
w Error(
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
export interface PromptPart {
  id: str
```
- **JSON_in_prompt** @ L67

```
? 'undefined' : typeof x;
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
exp
```
### `src/lib/ui/ui-compiler.ts`

- **PromptTemplateLiteral** @ L49

```
, nodeLabel, aiConfig } = options;
  const requestId = `compile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    const textModel = getTextModel(aiConfig);
    const openaiClient = getOpenAIClient(aiConfig);

    // ==================== Track 1: Build UISpec (AI JSON, small budget) ====================
    log(`[UI C
```
- **PromptTemplateLiteral** @ L58

```
==========
    log(`[UI Compiler] Track 1: Building UISpec for "${nodeLabel}"`, { requestId });

    const specPrompt = `# Task
Generate a UI specification for: "${nodeLabel}"

User Request: ${prompt}

# Output Format
Output ONLY one tagged block:
<AI_JSON>
{
  "pageId": "${nodeLabel.toLowerCase().replace(/\s+/g, '-')}",
  "title": "${nod
```
- **PromptTemplateLiteral** @ L131

```
.title}"

UISpec:
- Regions: ${uiSpec.regions.join(', ')}
- Components: ${uiSpec.components.map(c => `${c.type}(${c.id})`).join(', ')}
- Data Schema: ${JSON.stringify(uiSpec.dataSchema)}

User Request: ${prompt}

# Output Format
Output ONLY one tagged block:
<AI_HTML>
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="vi
```
- **PromptTemplateLiteral** @ L183

```
ure it's a complete document
    if (!baseHtml.includes('<!DOCTYPE') && !baseHtml.includes('<html')) {
      baseHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
${baseHtm
```
- **PromptTemplateLiteral** @ L205

```
ons.

UISpec Interactions:
${uiSpec.interactions.map(i => `- ${i.when} on ${i.selectorHint} -> ${i.action}(${i.payload})`).join('\n')}

Base HTML (first 2000 chars):
${baseHtml.substring(0, 2000)}...

# Output Format
Output ONLY one tagged block:
<AI_PATCH>
[
  {"op": "SET_ATTR", "selector": "button.submit", "name": "data-action", "value"
```
- **PromptTemplateLiteral** @ L295

```

    // ==================== Track 4: Verification ====================
    log(`[UI Compiler] Track 4: Verifying output`, { requestId });

    const verifyResult = verifyUI(baseHtml, uiSpec);

    if (!verifyResult.ok) {
      logError('[UI Compiler] Verification failed', { requestId, issues: verifyResult.issues });
      return {
      
```

> …(1 more)

### `src/lib/ui/ui-verifier.ts`

- **PromptTemplateLiteral** @ L58

```
], [id*="${pattern}"], [data-region="${region}"], ${region === 'header' ? 'header' : region === 'content' ? 'main' : ''}`
        );
        if (elements.length > 0) {
          found = true;
          break;
        }
      }

      if (!found && region === 'content') {
        // Content is critical - must exist
        issues.push(`Req
```
- **PromptTemplateLiteral** @ L70

```
${region}' not found`);
      } else if (!found) {
        warnings.push(`Region '${region}' not found (may be optional)`);
      }

      regionChecks[region] = found;
    }

    // Check required components (at least some should exist)
    if (uiSpec.components.length > 0) {
      let foundComponents = 0;
      for (const component of u
```
- **PromptTemplateLiteral** @ L88

```
nents.length > 3) {
        warnings.push(`None of the specified components found (expected ${uiSpec.components.length})`);
      }
    }

    // Critical issues check
    const hasCriticalIssues = issues.length > 0;

    return {
      ok: !hasCriticalIssues,
      issues,
      warnings,
    };
  } catch (error) {
    return {
      ok:
```
- **PromptTemplateLiteral** @ L103

```
 return {
      ok: false,
      issues: [`Verification error: ${error instanceof Error ? error.message : String(error)}`],
      warnings: [],
    };
  }
}

/**
 * Verify bottom bar fixed positioning (best-effort static check)
 */
export function verifyBottomBarFixed(html: string): VerificationResult {
  const issues: string[] = [];
  co
```
- **PromptTemplateLiteral** @ L143

```
  } catch (error) {
    warnings.push(`Bottom bar check error: ${error instanceof Error ? error.message : String(error)}`);
    return { ok: true, issues: [], warnings };
  }
}

/**
 * Verify interaction markers based on UISpec
 */
export function verifyInteractions(html: string, uiSpec: UISpec): VerificationResult {
  const issues: strin
```
- **PromptTemplateLiteral** @ L171

```
action.toLowerCase()}"]`,
        `[data-nav="${interaction.payload}"]`,
        `[data-filter="${interaction.payload}"]`,
      ];

      for (const selector of actionSelectors) {
        const elements = body.querySelectorAll(selector);
        if (elements.length > 0) {
          found = true;
          break;
        }
      }

      
```
### `src/store/canvas-store.ts`

- **PromptTemplateLiteral** @ L79

```
ueprint: () => void;
}

/**
 * 生成空白节点UI代码模板
 */
const generateBlankNodeCode = (nodeLabel: string): string => {
  return `export default function BlankPage() {
  return (
    <div className="w-full h-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
      <div className="p-8">
        <h1 className="te
```
- **PromptTemplateLiteral** @ L327

```
selectedNode
        ? [
            ...state.edges,
            {
              id: `e-${selectedNode.id}-${newNode.id}`,
              source: selectedNode.id,
              target: newNode.id,
              type: 'smart',
              animated: true,
              markerEnd: {
                type: 'arrowclosed' as const,
            
```
- **PromptTemplateLiteral** @ L379

```
 确保节点有必需的 data 字段
        if (!node.data) {
          console.error(`❌ [canvas-store] 节点 ${node.id} 缺少 data 字段，创建默认 data`);
          return {
            ...node,
            type: nodeType as 'page' | 'service',
            data: {
              label: node.id,
              artifacts: {
                view: { code: '' },
             
```
- **PromptTemplateLiteral** @ L537

```

      // Nodes positioned successfully
      console.log(`✅ [canvas-store] addNodes: 成功处理 ${positionedNodes.length} 个节点`, {
        nodeTypes: positionedNodes.map(n => ({ id: n.id, type: n.type, label: n.data?.label })),
      });
      
      return {
        nodes: [...existingNodes, ...positionedNodes],
      };
    });
  },

  addEdg
```
- **PromptTemplateLiteral** @ L887

```
};
      }
      
      const nodeLabel = '新节点';
      const blankNode: FractalNode = {
        id: `manual-${timestamp}`,
        type: 'page',
        position: nodePosition,
        selected: false,
        data: {
          label: nodeLabel,
          artifacts: {
            view: {
              code: generateBlankNodeCode(nodeLabel
```
- **PromptTemplateLiteral** @ L928

```
lectedNode
        ? [
            ...state.edges,
            {
              id: `e-${selectedNode.id}-${blankNode.id}`,
              source: selectedNode.id,
              target: blankNode.id,
              type: 'smart',
              animated: true,
              markerEnd: {
                type: 'arrowclosed' as const,
          
```

> …(5 more)

### `src/types/fractal.ts`

- **JSON_in_prompt** @ L1

```
import { z } from 'zod';
import { Node, Edge, XYPosition } from 'reactflow';

/**
 * Node Artifacts - 4个全息维度
 */

// View Artifact: 可运行的 React/Tailwind 代码
export const ViewArtifactSchema = z.object({
  code: z.string().describe('可运行的 React
```
- **JSON_in_prompt** @ L9

```
tflow';

/**
 * Node Artifacts - 4个全息维度
 */

// View Artifact: 可运行的 React/Tailwind 代码
export const ViewArtifactSchema = z.object({
  code: z.string().describe('可运行的 React/Tailwind 代码'),
  previewUrl: z.string().url().optional().describe('预览 URL（如果已生成）'),
  htmlTemplate: z.string().optional().describe('原始 HTML 模板（如果提供，将自动转换为 React 代码）'),
}
```
- **JSON_in_prompt** @ L18

```
tifact = z.infer<typeof ViewArtifactSchema>;

// Spec Artifact: PRD 文档（从 View 反向工程生成）
export const SpecArtifactSchema = z.object({
  title: z.string().describe('需求标题'),
  requirements: z.array(z.string()).describe('结构化需求列表'),
  prdConfig: z.any().optional().describe('PRD生成配置（PrdOptions）'),
});

export type SpecArtifact = z.infer<typeof Sp
```
- **JSON_in_prompt** @ L27

```
SpecArtifact = z.infer<typeof SpecArtifactSchema>;

// Impl Artifact: 技术实现（从 Spec 派生）
export const ImplArtifactSchema = z.object({
  apiEndpoints: z.array(z.string()).describe('API 端点定义列表'),
  dbSchema: z.string().describe('数据库 schema 定义'),
});

export type ImplArtifact = z.infer<typeof ImplArtifactSchema>;

// Test Artifact: 测试用例（从 Logic
```
- **JSON_in_prompt** @ L29

```
actSchema = z.object({
  apiEndpoints: z.array(z.string()).describe('API 端点定义列表'),
  dbSchema: z.string().describe('数据库 schema 定义'),
});

export type ImplArtifact = z.infer<typeof ImplArtifactSchema>;

// Test Artifact: 测试用例（从 Logic 派生）
export const TestArtifactSchema = z.object({
  cases: z.array(z.string()).describe('测试用例列表'),
});

expo
```
- **JSON_in_prompt** @ L35

```
mplArtifact = z.infer<typeof ImplArtifactSchema>;

// Test Artifact: 测试用例（从 Logic 派生）
export const TestArtifactSchema = z.object({
  cases: z.array(z.string()).describe('测试用例列表'),
});

export type TestArtifact = z.infer<typeof TestArtifactSchema>;

// User Story: 用户故事（Agile/Scrum 标准格式）
export const UserStorySchema = z.object({
  id: z.str
```

> …(19 more)

### `src/types/sandbox-messages.ts`

- **JSON_in_prompt** @ L7

```
/**
 * Sandbox Message Types
 * 
 * Type-safe message protocol between host and iframe sandbox.
 */

import { z } from 'zod';

// ==================== Host to Sandbox Messages ====================

export const HostToSandboxMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('INJECT'),
    script: z.string(),
 
```
- **JSON_in_prompt** @ L12

```
st to Sandbox Messages ====================

export const HostToSandboxMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('INJECT'),
    script: z.string(),
  }),
  z.object({
    type: z.literal('SET_MODE'),
    mode: z.enum(['preview', 'edit']),
  }),
]);

export type HostToSandboxMessage = z.infer<typeof Ho
```
- **JSON_in_prompt** @ L16

```
sageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('INJECT'),
    script: z.string(),
  }),
  z.object({
    type: z.literal('SET_MODE'),
    mode: z.enum(['preview', 'edit']),
  }),
]);

export type HostToSandboxMessage = z.infer<typeof HostToSandboxMessageSchema>;

// ==================== Sandbox to Host Messag
```
- **JSON_in_prompt** @ L27

```
ndbox to Host Messages ====================

export const SandboxToHostMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('PATCH'),
    patch: z.object({
      op: z.enum(['SET_TEXT', 'SET_ATTR', 'TOGGLE_CLASS']),
      selector: z.string(),
      value: z.string().optional(),
      name: z.string().optional()
```
- **JSON_in_prompt** @ L29

```
const SandboxToHostMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('PATCH'),
    patch: z.object({
      op: z.enum(['SET_TEXT', 'SET_ATTR', 'TOGGLE_CLASS']),
      selector: z.string(),
      value: z.string().optional(),
      name: z.string().optional(),
      className: z.string().optional(),
      enab
```
- **JSON_in_prompt** @ L38

```
: z.string().optional(),
      className: z.string().optional(),
      enabled: z.boolean().optional(),
    }),
  }),
  z.object({
    type: z.literal('NAV'),
    to: z.string(),
  }),
  z.object({
    type: z.literal('EXPORT_PNG'),
    dataUrl: z.string(),
    width: z.number(),
    height: z.number(),
  }),
  z.object({
    type: z.lite
```

> …(3 more)

### `src/utils/codeToPrdTable.example.ts`

- **PromptTemplateLiteral** @ L8

```
ratePageLevelPrd, generatePrdTableFromCode } from './codeToPrdTable';

// 示例 1: 只生成表格（原有功能）
const instructionCardCode = `
export function InstructionCard({
  title,
  status,
  name,
  date,
  sourceTags = [],
  showActionButton = false,
  onActionClick,
}: InstructionCardProps) {
  return (
    <div className="bg-white rounded-lg border"
```
- **PromptTemplateLiteral** @ L46

```
  instructionCardCode,
  'InstructionCard.tsx',
  'InstructionCard'
);

// 示例 2: 生成完整的页面级 PRD（新功能）
const fullPageCode = `
export function InstructionExample() {
  const [searchValue, setSearchValue] = useState('');
  const [sortValue, setSortValue] = useState('latest');
  const instructions = [/* ... */];

  return (
    <div className="m
```
### `src/utils/codeToPrdTable.ts`

- **PromptTemplateLiteral** @ L98

```
eturn '催办按钮';
    if (lowerText.includes('筛选') || lowerText.includes('过滤')) return '筛选按钮';
    return `${text || '操作'}按钮`;
  }

  // 输入框
  if (lowerType.includes('input') || componentType === 'input') {
    if (props.type === 'search' || lowerText.includes('搜索')) return '搜索框';
    if (props.type === 'password') return '密码输入框';
    if (pro
```
- **PromptTemplateLiteral** @ L113

```
}输入框`;
  }

  // 下拉选择
  if (lowerType.includes('select') || componentType === 'select') {
    return `${text || '选项'}下拉框`;
  }

  // 标签/徽章
  if (lowerType.includes('badge') || lowerType.includes('tag') || lowerType.includes('label')) {
    if (lowerText.includes('状态')) return '状态标签';
    if (lowerText.includes('来源') || lowerText.includes(
```
- **PromptTemplateLiteral** @ L153

```
urn '日期信息';
    if (lowerText.includes('姓名') || lowerText.includes('name')) return '姓名信息';
    return `${text || '文本'}信息`;
  }

  // 标题
  if (lowerType.includes('heading') || componentType.match(/^h[1-6]$/)) {
    return '标题';
  }

  return text || componentType || '元素';
}

/**
 * 生成功能说明
 */
function generateFunctionDescription(
  compone
```
- **PromptTemplateLiteral** @ L199

```
erText.includes('催办')) {
        return '用户点击后，系统向负责人发送催办通知，提醒加快处理进度。';
      }
      return `用户点击后，${text || '执行相应操作'}。`;
    }

    if (props.onChange || props.onInput) {
      if (lowerType.includes('search') || lowerText.includes('搜索')) {
        return '用户输入关键词后，系统实时过滤列表，仅显示匹配的结果项。';
      }
      if (lowerType.includes('select')) {

```
- **PromptTemplateLiteral** @ L209

```
.includes('select')) {
        return '用户选择选项后，系统按选定规则重新排列或筛选内容。';
      }
      return `用户输入或选择后，系统${text || '更新显示内容'}。`;
    }
  }

  // 只读元素
  if (lowerText.includes('状态') || props.status || context?.includes('status')) {
    return '用于标识当前项的流转状态，帮助用户了解处理进度。';
  }

  if (lowerText.includes('标题') || lowerType.includes('heading') || comp
```
- **PromptTemplateLiteral** @ L219

```
') || lowerType.includes('heading') || componentType.match(/^h[1-6]$/)) {
    return `用于展示${text || '内容'}的核心主题，帮助用户快速识别。`;
  }

  if (lowerText.includes('日期') || lowerType.includes('calendar') || props.type === 'date') {
    return '用于展示时间信息，帮助用户了解创建或更新时间。';
  }

  if (lowerText.includes('头像') || lowerType.includes('avatar')) {
    return
```

> …(14 more)

### `src/utils/color-extractor.ts`

- **PromptTemplateLiteral** @ L127

```
    ${varName}: ${color};`);
  });

  const cssVariables = cssVars.length > 0
    ? `:root {\n${cssVars.join('\n')}\n  }`
    : '';

  return {
    hexColors: Array.from(hexColors),
    rgbColors: Array.from(rgbColors),
    hslColors: Array.from(hslColors),
    namedColors: Array.from(namedColors),
    cssVariables,
    colorToVarMap,
  }
```
- **PromptTemplateLiteral** @ L155

```
[0]}${hexValue[1]}${hexValue[1]}${hexValue[2]}${hexValue[2]}${hexValue[3]}${hexValue[3]}`;
  }
  
  return `#${hexValue}`;
}

/**
 * Checks if a color name is a standard Tailwind color
 */
function isStandardTailwindColor(color: string): boolean {
  const standardColors = [
    'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald
```
- **PromptTemplateLiteral** @ L171

```
-500', 'blue-600')
  return standardColors.some(baseColor => 
    color === baseColor || color.startsWith(`${baseColor}-`)
  );
}

/**
 * Replaces custom colors in HTML/JSX with CSS variable references
 * Example: bg-[#3B82F6] -> bg-[var(--color-custom-0)]
 */
export function replaceColorsWithCSSVars(
  html: string,
  colorToVarMap: Map<
```
### `src/utils/convertHtmlToReactCode.ts`

- **PromptTemplateLiteral** @ L9

```
g {
  if (!rawHtml || rawHtml.trim().length === 0) {
    return `const App = () => { return <div>Empty content</div>; };`;
  }

  let html = rawHtml.trim();

  // 1. Remove DOCTYPE, html, head, body tags
  html = html.replace(/<!DOCTYPE[^>]*>/gi, '');
  html = html.replace(/<html[^>]*>/gi, '');
  html = html.replace(/<\/html>/gi, '');
  h
```
- **PromptTemplateLiteral** @ L44

```
, attributes) => {
      if (match.endsWith('/>')) {
        return match;
      }
      return `<${tag}${attributes} />`;
    });
  });

  // 5. Remove HTML comments
  html = html.replace(/<!--[\s\S]*?-->/g, '');

  // 6. Remove onclick handlers (we'll inject React handlers)
  html = html.replace(/onclick="[^"]*"/gi, '');
  html = html.r
```
### `src/utils/edit-message-protocol.ts`

- **JSON_in_prompt** @ L7

```
ween iframe (sandbox) and host (React)
 * for text editing in edit mode.
 * 
 * All messages must be validated with Zod schemas.
 */

import { z } from 'zod';

/**
 * Message types sent from iframe to host
 */
export const IframeToHostMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('IFRAME_READY'),
    orig
```
- **JSON_in_prompt** @ L10

```
eact)
 * for text editing in edit mode.
 * 
 * All messages must be validated with Zod schemas.
 */

import { z } from 'zod';

/**
 * Message types sent from iframe to host
 */
export const IframeToHostMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('IFRAME_READY'),
    origin: z.string(),
  }),
  z.object(
```
- **JSON_in_prompt** @ L16

```
 * Message types sent from iframe to host
 */
export const IframeToHostMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('IFRAME_READY'),
    origin: z.string(),
  }),
  z.object({
    type: z.literal('TEXT_NODE_CLICKED'),
    selector: z.string(),
    text: z.string(),
    rect: z.object({
      x: z.number(
```
- **JSON_in_prompt** @ L20

```
hema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('IFRAME_READY'),
    origin: z.string(),
  }),
  z.object({
    type: z.literal('TEXT_NODE_CLICKED'),
    selector: z.string(),
    text: z.string(),
    rect: z.object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    }
```
- **JSON_in_prompt** @ L24

```

  }),
  z.object({
    type: z.literal('TEXT_NODE_CLICKED'),
    selector: z.string(),
    text: z.string(),
    rect: z.object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    }),
  }),
  z.object({
    type: z.literal('APPLY_RESULT'),
    ok: z.boolean(),
    html: z.string().optional()
```
- **JSON_in_prompt** @ L31

```
z.object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    }),
  }),
  z.object({
    type: z.literal('APPLY_RESULT'),
    ok: z.boolean(),
    html: z.string().optional(),
    error: z.string().optional(),
  }),
]);

export type IframeToHostMessage = z.infer<typeof IframeToHostMessageSchem
```

> …(2 more)

### `src/utils/edit-text-capture-injector.ts`

- **PromptTemplateLiteral** @ L14

```
nerateSelector(element: Element): string {
  // First choice: existing id
  if (element.id) {
    return `#${element.id}`;
  }

  // Generate selector path using tag + nth-of-type
  const path: string[] = [];
  let current: Element | null = element;

  while (current && current !== current.ownerDocument?.body) {
    const tagName = curren
```
- **PromptTemplateLiteral** @ L36

```
lings.length === 1) {
      path.unshift(tagName);
    } else {
      path.unshift(`${tagName}:nth-of-type(${index + 1})`);
    }

    current = parent;
  }

  const selector = path.join(' > ');
  
  // Try to attach data-uid for stability (if allowed)
  // For MVP, we'll just return the selector path
  return selector;
}

/**
 * Find the
```
### `src/utils/html-behavior-injector.ts`

- **PromptTemplateLiteral** @ L46

```
ate all elements with data-state attribute
      const stateElements = container.querySelectorAll(`[data-state="${key}"]`);
      stateElements.forEach((el) => {
        el.textContent = String(value);
      });
    },

    getState: (key: string) => {
      return state[key];
    },

    modifyDOM: (selector: string, callback: (el: Eleme
```
- **PromptTemplateLiteral** @ L67

```
l.addEventListener(event, handler);
      });
      // Store handler for cleanup
      const key = `${selector}:${event}`;
      if (!handlers.has(key)) {
        handlers.set(key, []);
      }
      handlers.get(key)!.push({ selector, event, handler });
    },

    injectData: (data: Record<string, any>) => {
      Object.entries(data).f
```
### `src/utils/html-body-extractor.ts`

- **PromptTemplateLiteral** @ L58

```
;
  const match1 = html.match(pattern1);
  if (match1 && match1[1]) {
    return `window.tailwind.config = ${match1[1]};`;
  }

  // Pattern 2: <script>window.tailwind.config = {...}</script>
  const pattern2 = /<script[^>]*>[\s\S]*?window\.tailwind\.config\s*=\s*({[\s\S]*?})[\s\S]*?<\/script>/i;
  const match2 = html.match(pattern2);
  i
```
### `src/utils/html-config-extractor.ts`

- **PromptTemplateLiteral** @ L21

```
tch[1]}`;
    // Generate a semantic name based on usage context
    const colorName = `custom-${match[1].toLowerCase()}`;
    if (!colors[colorName]) {
      colors[colorName] = hex;
    }
  }
  
  return colors;
}

/**
 * Extracts custom box shadows from HTML
 * Looks for shadow-* classes or custom shadow values
 */
export function extr
```
- **PromptTemplateLiteral** @ L42

```
 const shadowValue = match[1];
    const shadowName = `custom-${shadowValue.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;
    shadows[shadowName] = shadowValue;
  }
  
  return shadows;
}

/**
 * Generates a generic Tailwind config from HTML content
 * Only includes colors/shadows that are actually used in the HTML
 */
export function ge
```
- **JSON_in_prompt** @ L77

```
omShadows).length > 0) {
    config.theme.extend.boxShadow = customShadows;
  }
  
  return `window.tailwind.config = ${JSON.stringify(config, null, 2)};`;
}




```
### `src/utils/html-parser.ts`

- **PromptTemplateLiteral** @ L233

```
景色
    if (html.includes(`<body`) || html.includes(`class="bg-${colorClass}"`)) {
      primaryColor = `bg-${colorClass}`;
    }
  }

  // 提取内联样式中的背景色
  const inlineBgRegex = /background(?:-color)?:\s*([^;]+)/gi;
  while ((match = inlineBgRegex.exec(html)) !== null) {
    const colorValue = match[1].trim();
    if (colorValue && !colorVal
```
- **PromptTemplateLiteral** @ L277

```
颜色类名
    if (!['left', 'center', 'right', 'justify'].includes(colorClass)) {
      const fullClass = `text-${colorClass}`;
      colors.add(fullClass);
      colorCounts.set(fullClass, (colorCounts.get(fullClass) || 0) + 1);
    }
  }

  // 提取内联样式中的文本颜色
  const inlineColorRegex = /color:\s*([^;]+)/gi;
  while ((match = inlineColorRegex.ex
```
- **PromptTemplateLiteral** @ L321

```
6xl|7xl|8xl|9xl)/g;
  let match;
  while ((match = fontSizeRegex.exec(html)) !== null) {
    sizes.add(`text-${match[1]}`);
  }

  // 提取字体族
  const fontFamilyRegex = /font-family:\s*([^;]+)/gi;
  let fontFamily: string | undefined;
  if ((match = fontFamilyRegex.exec(html)) !== null) {
    fontFamily = match[1].trim();
  }

  return {
   
```
- **PromptTemplateLiteral** @ L553

```
lice(0, 5).join(' '); // 增加到5个类名
    
    structure.push(`${indent}<${tag}${keyClasses ? ` class="${keyClasses}"` : ''}>`);
    elementCount++;
    
    // 检查是否是自闭合标签
    if (!match[0].endsWith('/>') && !['img', 'input', 'br', 'hr', 'meta', 'link'].includes(tag)) {
      depth++;
    }
    
    // 检查闭合标签，减少深度
    const closingTagRegex = n
```
- **PromptTemplateLiteral** @ L562

```
 'link'].includes(tag)) {
      depth++;
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
 
```
- **PromptTemplateLiteral** @ L707

```
 containerRegex.exec(html)) !== null && mainContainers.length < 10) {
    mainContainers.push(`${match[1]} (${match[2]})`);
  }

  // 提取主要元素（button, input, card等）
  const elementRegex = /<(button|input|a|img|svg)[^>]*/gi;
  while ((match = elementRegex.exec(html)) !== null && mainElements.length < 20) {
    mainElements.push(match[1]);
  
```

> …(5 more)

### `src/utils/html-rationalizer.ts`

- **PromptTemplateLiteral** @ L54

```
        return match.replace(/(<div[^>]*class="[^"]*tab[^"]*")/i, `$1 data-tab="${tabId}" aria-controls="${tabId}-panel"`);
      }
      return match;
    }
  );

  // Fix: Ensure tab panels have proper IDs
  rationalized = rationalized.replace(
    /<div[^>]*class="[^"]*tab-panel[^"]*"[^>]*>/gi,
    (match) => {
      if (!match.include
```
- **PromptTemplateLiteral** @ L78

```
lace(/\s+/g, '-');
        return match.replace(/(<div[^>]*class="[^"]*filter[^"]*")/i, `$1 data-filter="${filterValue}"`);
      }
      return match;
    }
  );

  // Fix: Ensure list items have data-item attribute for filtering
  rationalized = rationalized.replace(
    /<div[^>]*class="[^"]*item[^"]*"[^>]*>/gi,
    (match) => {
      
```
- **PromptTemplateLiteral** @ L102

```
 Normalize to 'active' class
      if (!baseClasses.includes('active')) {
        return ` class="${baseClasses} active"`;
      }
      return match;
    }
  );

  // Ensure hidden elements use consistent 'hidden' class
  rationalized = rationalized.replace(
    /\sstyle="[^"]*display:\s*none[^"]*"/gi,
    (match) => {
      // Add 'hidd
```
- **PromptTemplateLiteral** @ L118

```
es('class="') && !fullMatch.includes("class='")) {
          return fullMatch.replace(`<${tag}`, `<${tag} class="hidden"`);
        } else if (!fullMatch.includes('hidden')) {
          return fullMatch.replace(/\sclass="([^"]*)"/i, ' class="$1 hidden"');
        }
      }
      return match;
    }
  );

  // Step 4: Ensure interactions a
```
### `src/utils/html-text-patch.ts`

- **PromptTemplateLiteral** @ L34

```
ent = doc.querySelector(selector);
    if (!element) {
      return { ok: false, error: `Selector not found: ${selector}` };
    }

    // Check if element has nested elements (not allowed for MVP)
    // Only allow text-only editing for MVP
    const hasNestedElements = element.children.length > 0;
    if (hasNestedElements) {
      retu
```
- **PromptTemplateLiteral** @ L43

```
     ok: false,
        error: `Element has nested elements. Text-only editing not supported for elements with children.`,
      };
    }

    // Replace textContent (preserves structure, replaces all text nodes)
    element.textContent = newText;

    // Serialize back to HTML string
    // Preserve head, style, script blocks
    let upd
```
- **PromptTemplateLiteral** @ L125

```
eof Error ? error.message : 'Unknown error';
    return { ok: false, error: `Failed to apply text patch: ${errorMessage}` };
  }
}

/**
 * Self-check: test applyTextPatch with a sample HTML
 */
export function selfCheckEditMvp(): { pass: boolean; reason: string } {
  if (typeof window === 'undefined') {
    return { pass: false, reason: '
```
### `src/utils/html-to-jsx-transmuter.ts`

- **PromptTemplateLiteral** @ L19

```
const cleanedHtml = html.replace(pattern1, '');
    return {
      configString: `window.tailwind.config = ${match1[1]};`,
      cleanedHtml: cleanedHtml.trim(),
    };
  }

  // Pattern 2: <script>window.tailwind.config = {...}</script>
  const pattern2 = /<script[^>]*>[\s\S]*?window\.tailwind\.config\s*=\s*({[\s\S]*?})[\s\S]*?<\/script>
```
- **PromptTemplateLiteral** @ L31

```
const cleanedHtml = html.replace(pattern2, '');
    return {
      configString: `window.tailwind.config = ${match2[1]};`,
      cleanedHtml: cleanedHtml.trim(),
    };
  }

  return {
    configString: '',
    cleanedHtml: html.trim(),
  };
}

/**
 * Converts inline style strings to JSX style objects
 * Example: style="color: red; backgr
```
- **PromptTemplateLiteral** @ L110

```
)'/g, (match, styleContent) => {
    const jsxStyle = convertInlineStyles(styleContent);
    return `style={${jsxStyle}}`;
  });

  // 6. Close void tags (self-closing)
  const voidTags = ['input', 'img', 'br', 'hr', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'];
  voidTags.forEach(tag => {
    // Match opening
```
- **PromptTemplateLiteral** @ L122

```
, attributes) => {
      if (match.endsWith('/>')) {
        return match;
      }
      return `<${tag}${attributes} />`;
    });
  });

  // 7. Remove HTML comments
  jsx = jsx.replace(/<!--[\s\S]*?-->/g, '');

  // 8. Convert SVG attributes (kebab-case to camelCase)
  const svgAttributeMap: Record<string, string> = {
    'stroke-width'
```
- **PromptTemplateLiteral** @ L151

```
$1"`);
    const regexSingle = new RegExp(`${kebab}='([^']*)'`, 'gi');
    jsx = jsx.replace(regexSingle, `${camel}='$1'`);
  });

  // 9. Remove onclick handlers (we'll inject React handlers)
  jsx = jsx.replace(/onclick="[^"]*"/gi, '');
  jsx = jsx.replace(/onclick='[^']*'/gi, '');

  // 10. Inject event handlers into interactive elemen
```
- **PromptTemplateLiteral** @ L164

```
      return match; // Already has onClick
    }
    return `<button ${attrs} onClick={(e) => handleInteract(e, 'btn')}>`;
  });

  // Links (that look like buttons)
  jsx = jsx.replace(/<a\s+([^>]*?)(?<!\/)>/gi, (match, attrs) => {
    if (/onClick=/i.test(attrs)) {
      return match;
    }
    // Only inject if it looks interactive (ha
```

> …(3 more)

### `src/utils/html-to-react-adapter.ts`

- **PromptTemplateLiteral** @ L46

```
ag => {
    // Match opening tags that are not already self-closing
    const regex = new RegExp(`<${tag}([^>]*?)(?<!/)>`, 'gi');
    transformed = transformed.replace(regex, (match, attributes) => {
      // If it's already self-closing, return as is
      if (match.endsWith('/>')) {
        return match;
      }
      // Otherwise, make
```
- **PromptTemplateLiteral** @ L53

```
th('/>')) {
        return match;
      }
      // Otherwise, make it self-closing
      return `<${tag}${attributes} />`;
    });
  });

  // 3. Strip HTML comments (<!-- ... -->)
  transformed = transformed.replace(/<!--[\s\S]*?-->/g, '');

  // 4. Convert SVG attributes (kebab-case to camelCase)
  // Common SVG attributes that need con
```
- **PromptTemplateLiteral** @ L84

```
 regexSingle = new RegExp(`${kebab}='([^']*)'`, 'gi');
    transformed = transformed.replace(regexSingle, `${camel}='$1'`);
  });

  // 5. Handle inline styles (optional - for now, we'll keep them as strings)
  // Inline styles in HTML are strings, in React they should be objects, but
  // for simplicity, we'll keep them as strings and le
```
- **PromptTemplateLiteral** @ L115

```
rn match; // Already has onChange, skip
    }
    return `<input ${attrs} onChange={(e)=>console.log(e.target.value)} />`;
  });
  // 3. Buttons: Simple onClick injection (only if not already present)
  transformed = transformed.replace(/<button\s+([^>]*?)>/gi, (match, attrs) => {
    if (/onClick=/i.test(attrs)) {
      return match; // 
```
- **PromptTemplateLiteral** @ L127

```
st safeNodeId = nodeId ? nodeId.replace(/[^a-zA-Z0-9_]/g, '_') : 'Component';
  const componentName = `App_${safeNodeId}`;

  // Check if the transformed code is already a React component
  const isAlreadyComponent = /^(const|function|export\s+(default\s+)?(const|function))\s+\w+\s*=/.test(transformed.trim());

  if (isAlreadyComponent) {
```
- **PromptTemplateLiteral** @ L146

```
ode = `const ${componentName} = () => {
  return (
    <>
      ${transformed}
    </>
  );
};

return ${componentName};`;

  return wrappedCode;
}

/**
 * Checks if a string is HTML (vs React code)
 * 
 * @param code - Code string to check
 * @returns true if the string appears to be HTML
 */
export function isHtmlCode(code: string): boo
```

> …(4 more)

### `src/utils/jit-visual-pipeline.ts`

- **PromptTemplateLiteral** @ L24

```
imum-scale=1.0, user-scalable=no, viewport-fit=cover"/>';
  
  // 2. 注入全局安全样式（无论内容怎么变，这层壳永远锁死布局）
  const safeShellCss = `
    <style>
      /* 强制接管滚动条 */
      ::-webkit-scrollbar { 
        display: none; 
      }
      
      /* 全局重置 */
      * {
        box-sizing: border-box;
      }
      
      html, body { 
        margin: 0;
     
```
- **PromptTemplateLiteral** @ L86

```
st(processed);
    
    if (!hasViewport) {
      processed = processed.replace('</head>', `    ${viewportMeta}\n</head>`);
    } else {
      // 替换现有的 viewport meta
      processed = processed.replace(
        /<meta[^>]*name=["']viewport["'][^>]*>/i,
        viewportMeta
      );
    }
    
    // 插入安全样式
    processed = processed.replac
```
- **PromptTemplateLiteral** @ L105

```
 `<!DOCTYPE html>\n<html>\n<head>\n    ${viewportMeta}\n${safeShellCss}\n</head>\n<body>\n${processed}\n</body>\n</html>`;
  }

  return processed;
}

/**
 * Layer 2: 语义配置层
 * 目的：AI 只生成 tailwind.config，不改动 HTML 中的 class 名称
 * 
 * 注意：这个函数返回一个默认配置模板。
 * 实际使用中，应该调用 generateTailwindConfig server action 来生成 AI 配置。
 * 
 * @param designRequireme
```
- **PromptTemplateLiteral** @ L168

```
          },
            }
          }
        },
        darkMode: 'class', // 强制手动模式，防止随系统变黑
      };
    </script>
  `;

  // 如果有现有配置，尝试合并
  if (existingConfig) {
    // 这里可以解析并合并配置
    // 为了简化，直接返回新配置
    return configTemplate;
  }

  return configTemplate;
}

/**
 * 将 AI 生成的配置对象包装成 <script> 标签
 */
export function wrapConfigInScript(c
```
- **PromptTemplateLiteral** @ L188

```
Script(configObject: string): string {
  return `
    <script>
      tailwind.config = ${configObject};
    </script>
  `;
}

/**
 * 替换或注入 tailwind.config 到 HTML 中
 */
export function injectTailwindConfig(htmlContent: string, configScript: string): string {
  if (!htmlContent || !configScript) {
    return htmlContent;
  }

  // 移除现有的 tai
```
- **PromptTemplateLiteral** @ L212

```
dy', `${configScript}\n<body`);
  } else {
    // 如果没有 head 或 body，添加到最前面
    processed = `${configScript}\n${processed}`;
  }

  return processed;
}

/**
 * Layer 3: 组件映射与修复层
 * 目的：解决特定组件的布局缺陷（如"底部导航栏贴底溢出"）
 */
export function applySurgicalFixes(htmlContent: string): string {
  if (!htmlContent || htmlContent.trim().length === 0) {
    r
```

> …(2 more)

### `src/utils/prdGenerator.ts`

- **PromptTemplateLiteral** @ L12

```
extractBodyContent, extractTailwindConfig } from './html-body-extractor';

// 1. 定义文档的样式 (打印友好 + 屏幕阅读友好)
const STYLES = `
  @media print { 
    .no-print { display: none !important; } 
    body { padding: 0; background: white; }
    .page-break { page-break-before: always; }
  }
  body { 
    font-family: 'Segoe UI', Roboto, Helvetica, Ar
```
- **PromptTemplateLiteral** @ L126

```
pe === 'service') {
      code += `  ${safeId}(("${label}"));\n`;
    } else {
      code += `  ${safeId}["${label}"];\n`;
    }
  });

  // 添加连线
  edges.forEach(edge => {
    const sourceId = edge.source.replace(/[^a-zA-Z0-9]/g, '_');
    const targetId = edge.target.replace(/[^a-zA-Z0-9]/g, '_');
    const label = edge.label ? `|"${Stri
```
- **PromptTemplateLiteral** @ L135

```
 = edge.label ? `|"${String(edge.label).replace(/"/g, "'")}"|` : '';
    code += `  ${sourceId}-->${label}${targetId};\n`;
  });

  return code;
};

export interface PRDExportOptions {
  projectMeta: ProjectMeta;
  markdownContent: string;
  nodes: FractalNode[];
  edges?: Edge[];
  globalRules?: GlobalRules;
}

/**
 * 导出 PRD 为 HTML 格式（交互
```
- **PromptTemplateLiteral** @ L191

```
style="margin-top: 20px; color: #6b7280;">${projectMeta.description}</p>` : ''}
        </div>

        ${mermaidCode ? `
        <div class="no-print">
            <h2>0. 系统架构蓝图 (自动生成)</h2>
            <p>基于项目蓝图节点自动生成的业务流程拓扑图。</p>
            <div class="diagram-container">
                <div class="mermaid">
${mermaidCode}
           
```
- **PromptTemplateLiteral** @ L217

```
st blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  saveAs(blob, `${projectMeta.projectName}_PRD.html`);
};

/**
 * 导出 PRD 为 Word 格式（Docx）
 */
export const exportToWord = async (options: PRDExportOptions) => {
  const { projectMeta, markdownContent } = options;

  // 1. 转换 Markdown 为 HTML
  const contentHtml = await mar
```
- **PromptTemplateLiteral** @ L247

```
 year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        ${contentHtml}
    </div>
</body>
</html>`;

  // 3. 转换为 Word 格式并下载
  try {
    const buffer = await asBlob(wordHtml, { orientation: 'portrait' });
    const blob = buffer instanceof Blob 
      ? buffer 
      : new Blob([buffer as unknown as ArrayBuffer], { 

```

> …(24 more)

### `src/utils/ui-summary-extractor.ts`

- **PromptTemplateLiteral** @ L45

```
    summary.buttons.push({
          text,
          selector: btn.id ? `#${btn.id}` : `button:nth-of-type(${index + 1})`,
        });
      }
    });

    // Extract links
    const links = body.querySelectorAll('a[href]');
    links.forEach((link, index) => {
      const text = link.textContent?.trim() || '';
      const href = link.get
```
- **PromptTemplateLiteral** @ L59

```
.links.push({
          text,
          href,
          selector: link.id ? `#${link.id}` : `a:nth-of-type(${index + 1})`,
        });
      }
    });

    // Extract inputs
    const inputs = body.querySelectorAll('input, textarea');
    inputs.forEach((input, index) => {
      const placeholder = input.getAttribute('placeholder') || '';
```
- **PromptTemplateLiteral** @ L72

```
sh({
        placeholder,
        type,
        selector: input.id ? `#${input.id}` : `${type}:nth-of-type(${index + 1})`,
      });
    });

    // Extract selects
    const selects = body.querySelectorAll('select');
    selects.forEach((select, index) => {
      const options: string[] = [];
      select.querySelectorAll('option').forEa
```
- **PromptTemplateLiteral** @ L86

```
ummary.selects.push({
        options,
        selector: select.id ? `#${select.id}` : `select:nth-of-type(${index + 1})`,
      });
    });

    // Extract headings
    const headings = body.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach((heading, index) => {
      const text = heading.textContent?.trim() || '';
      c
```
- **PromptTemplateLiteral** @ L99

```
  level,
          selector: heading.id ? `#${heading.id}` : `${heading.tagName.toLowerCase()}:nth-of-type(${index + 1})`,
        });
      }
    });

    // Extract list items (sample first 10)
    const listItems = body.querySelectorAll('li');
    Array.from(listItems).slice(0, 10).forEach((li, index) => {
      const text = li.textCon
```
- **PromptTemplateLiteral** @ L111

```
stItems.push({
          text: text.substring(0, 100), // Limit length
          selector: `li:nth-of-type(${index + 1})`,
        });
      }
    });

    // Extract cards (divs with card-like classes or structure)
    const cards = body.querySelectorAll('[class*="card"], [class*="Card"], .bg-white.rounded, .bg-gray-50.rounded');
    Arr
```

> …(2 more)

### `src/utils/wordGenerator.ts`

- **PromptTemplateLiteral** @ L4

```
veloper.
 * Task: Implement `generateEnterpriseWord` to export a Professional PRD in .docx format.
 * Library: Use `docx` (https://docx.js.org).
 *
 * # Requirements (Enterprise Grade)
 * 1. **Styles**: Define a "Corporate Theme" (Heading 1 = Blue/Bold/Underline, Normal = 11pt/Calibri).
 * 2. **Structure**:
 * - **Cover Page**: Large Titl
```
- **PromptTemplateLiteral** @ L14

```
tch the 7-chapter structure defined previously.
 * 3. **Content Handling**:
 * - **Images**: Convert Base64 to `ImageRun`. Fit to page width (max 600px).
 * - **Tables**: Render the PRD tables with proper borders, shading, and header repetition.
 * - **Layout**: Unlike HTML (Split View), use **Vertical Layout** for Word (UI Image Top, Tab
```
- **PromptTemplateLiteral** @ L23

```
me as HTML)
 * - data: ProjectData (meta, images, nodes...)
 *
 * # Output
 * - Return a `Blob` object ready for `saveAs`.
 */

import { 
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
  WidthType, BorderStyle, HeadingLevel, ImageRun, Header, Footer, 
  AlignmentType, PageNumber, PageBreak, VerticalAlign, ShadingType
```
- **PromptTemplateLiteral** @ L355

```
graph({ text: "1.2 目标用户", heading: HeadingLevel.HEADING_2 }),
    ...parseText(`核心用户群体：${data.meta.targetUser || "通用用户"}`),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // --- CHAPTER 2: GLOBAL RULES ---
  children.push(
    new Paragraph({ text: "第 2 章：全局规范", heading: HeadingLevel.HEADING_1 }),
    new Paragraph({ text: "2
```
- **PromptTemplateLiteral** @ L478

```
th node title
    children.push(
      new Paragraph({ 
        text: `${nodeNum} ${node.title || `功能模块 ${nodeIdx + 1}`}`, 
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 } 
      }),
    );

    // Step 2: UI Preview Section (Always 5.x.1)
    let sectionIdx = 1;
    const uiSectionNum = `${nodeNum}.$
```
- **PromptTemplateLiteral** @ L489

```
t uiSectionNum = `${nodeNum}.${sectionIdx++}`;
    
    children.push(new Paragraph({ 
      text: `${uiSectionNum} 界面示意`, 
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 200, after: 200 } 
    }));

    // Embed UI Preview Image (Top)
    const uiPreview = node.uiPreview || '';
    if (uiPreview && uiPreview.length > 0) 
```

> …(8 more)



## What to look for (fast)
- Any place that appends full HTML / full code / full DOM tree into prompt.
- Any "rationality scoring" that triggers **RATIONALIZE** mode by default.
- Any multi-pass loop: skeleton -> refine -> interaction -> export, if done in one click it will explode time+tokens.
