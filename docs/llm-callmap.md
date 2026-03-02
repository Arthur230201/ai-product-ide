# LLM 调用路径分析

生成时间: 2026-01-06T01:31:05.252Z

## 调用入口统计

共找到 7 个文件包含 LLM 调用。

## 调用图

```
app/actions/generate-graph.ts
  -> generateObject (line 438) [retry:2] [SERIAL]
  -> getVisionModel (line 236)
  -> getTextModel (line 481) [retry:2]

app/actions/generate-tailwind-config.ts
  -> generateText (line 132) [SERIAL]
  -> getOpenAIClient (line 11)
  -> getTextModel (line 131)

app/actions/node-operations.ts
  -> generateText (line 337) [SERIAL]
  -> generateText (line 467) [SERIAL]
  -> generateText (line 604) [SERIAL]
  -> generateText (line 1667) [SERIAL]
  -> generateText (line 2900) [SERIAL]
  -> getOpenAIClient (line 335)
  -> getOpenAIClient (line 465)
  -> getOpenAIClient (line 601)
  -> getOpenAIClient (line 1628)
  -> getOpenAIClient (line 2897)
  -> getVisionModel (line 1615)
  -> getTextModel (line 292)
  -> getTextModel (line 462)
  -> getTextModel (line 598)
  -> getTextModel (line 2894)

app/actions/parse-topology.ts
  -> generateObject (line 106) [SERIAL]
  -> getVisionModel (line 96)

lib/ai/llm.ts
  -> generateText (line 203) [SERIAL]
  -> getOpenAIClient (line 184) [SERIAL]

lib/ai-config.ts
  -> getVisionModel (line 16)
  -> getTextModel (line 35)

lib/openai-client.ts
  -> getOpenAIClient (line 314)
  -> getOpenAIClient (line 333)
```

## 详细调用清单

### app/actions/generate-graph.ts

函数: `anonymous`

调用点:
- **Line 438**: `generateObject`
  - 函数: `anonymous`
  - Retry: 2
  - Timeout: 配置但未指定时间
  - 并行: 否
  - 串行: 是

- **Line 236**: `getVisionModel`
  - 函数: `anonymous`
  - Retry: 无
  - Timeout: 无
  - 并行: 否
  - 串行: 否

- **Line 481**: `getTextModel`
  - 函数: `anonymous`
  - Retry: 2
  - Timeout: 无
  - 并行: 否
  - 串行: 否


### app/actions/generate-tailwind-config.ts

函数: `anonymous`

调用点:
- **Line 132**: `generateText`
  - 函数: `anonymous`
  - Retry: 无
  - Timeout: 无
  - 并行: 否
  - 串行: 是

- **Line 11**: `getOpenAIClient`
  - 函数: `anonymous`
  - Retry: 无
  - Timeout: 配置但未指定时间
  - 并行: 否
  - 串行: 否

- **Line 131**: `getTextModel`
  - 函数: `anonymous`
  - Retry: 无
  - Timeout: 无
  - 并行: 否
  - 串行: 否


### app/actions/node-operations.ts

函数: `anonymous`

调用点:
- **Line 337**: `generateText`
  - 函数: `anonymous`
  - Retry: 无
  - Timeout: 无
  - 并行: 否
  - 串行: 是

- **Line 467**: `generateText`
  - 函数: `anonymous`
  - Retry: 无
  - Timeout: 无
  - 并行: 否
  - 串行: 是

- **Line 604**: `generateText`
  - 函数: `anonymous`
  - Retry: 无
  - Timeout: 无
  - 并行: 否
  - 串行: 是

- **Line 1667**: `generateText`
  - 函数: `anonymous`
  - Retry: 配置但未指定数量
  - Timeout: 无
  - 并行: 否
  - 串行: 是

- **Line 2900**: `generateText`
  - 函数: `anonymous`
  - Retry: 无
  - Timeout: 无
  - 并行: 否
  - 串行: 是

- **Line 335**: `getOpenAIClient`
  - 函数: `anonymous`
  - Retry: 无
  - Timeout: 无
  - 并行: 否
  - 串行: 否

- **Line 465**: `getOpenAIClient`
  - 函数: `anonymous`
  - Retry: 无
  - Timeout: 无
  - 并行: 否
  - 串行: 否

- **Line 601**: `getOpenAIClient`
  - 函数: `anonymous`
  - Retry: 无
  - Timeout: 无
  - 并行: 否
  - 串行: 否

- **Line 1628**: `getOpenAIClient`
  - 函数: `anonymous`
  - Retry: 配置但未指定数量
  - Timeout: 无
  - 并行: 否
  - 串行: 否

- **Line 2897**: `getOpenAIClient`
  - 函数: `anonymous`
  - Retry: 无
  - Timeout: 无
  - 并行: 否
  - 串行: 否

- **Line 1615**: `getVisionModel`
  - 函数: `anonymous`
  - Retry: 配置但未指定数量
  - Timeout: 无
  - 并行: 否
  - 串行: 否

- **Line 292**: `getTextModel`
  - 函数: `anonymous`
  - Retry: 无
  - Timeout: 无
  - 并行: 否
  - 串行: 否

- **Line 462**: `getTextModel`
  - 函数: `anonymous`
  - Retry: 无
  - Timeout: 无
  - 并行: 否
  - 串行: 否

- **Line 598**: `getTextModel`
  - 函数: `anonymous`
  - Retry: 无
  - Timeout: 无
  - 并行: 否
  - 串行: 否

- **Line 2894**: `getTextModel`
  - 函数: `anonymous`
  - Retry: 无
  - Timeout: 无
  - 并行: 否
  - 串行: 否


### app/actions/parse-topology.ts

函数: `anonymous`

调用点:
- **Line 106**: `generateObject`
  - 函数: `anonymous`
  - Retry: 无
  - Timeout: 配置但未指定时间
  - 并行: 否
  - 串行: 是

- **Line 96**: `getVisionModel`
  - 函数: `anonymous`
  - Retry: 无
  - Timeout: 配置但未指定时间
  - 并行: 否
  - 串行: 否


### lib/ai/llm.ts

函数: `anonymous`

调用点:
- **Line 203**: `generateText`
  - 函数: `anonymous`
  - Retry: 配置但未指定数量
  - Timeout: 配置但未指定时间
  - 并行: 否
  - 串行: 是

- **Line 184**: `getOpenAIClient`
  - 函数: `anonymous`
  - Retry: 配置但未指定数量
  - Timeout: 配置但未指定时间
  - 并行: 否
  - 串行: 是


### lib/ai-config.ts

函数: `anonymous`

调用点:
- **Line 16**: `getVisionModel`
  - 函数: `anonymous`
  - Retry: 无
  - Timeout: 无
  - 并行: 否
  - 串行: 否

- **Line 35**: `getTextModel`
  - 函数: `anonymous`
  - Retry: 无
  - Timeout: 无
  - 并行: 否
  - 串行: 否


### lib/openai-client.ts

函数: `anonymous`

调用点:
- **Line 314**: `getOpenAIClient`
  - 函数: `anonymous`
  - Retry: 配置但未指定数量
  - Timeout: 配置但未指定时间
  - 并行: 否
  - 串行: 否

- **Line 333**: `getOpenAIClient`
  - 函数: `compatible`
  - Retry: 配置但未指定数量
  - Timeout: 无
  - 并行: 否
  - 串行: 否


## 串行调用统计

共 10 个串行调用：

- app/actions/generate-graph.ts:438 (generateObject)
- app/actions/generate-tailwind-config.ts:132 (generateText)
- app/actions/node-operations.ts:337 (generateText)
- app/actions/node-operations.ts:467 (generateText)
- app/actions/node-operations.ts:604 (generateText)
- app/actions/node-operations.ts:1667 (generateText)
- app/actions/node-operations.ts:2900 (generateText)
- app/actions/parse-topology.ts:106 (generateObject)
- lib/ai/llm.ts:203 (generateText)
- lib/ai/llm.ts:184 (getOpenAIClient)

## 并行调用统计

共 0 个并行调用：



## 完整 JSON 数据

```json
{
  "entries": [
    {
      "file": "app/actions/generate-graph.ts",
      "function": "anonymous",
      "calls": [
        {
          "type": "generateObject",
          "line": 438,
          "function": "anonymous",
          "hasRetry": true,
          "retryCount": 2,
          "hasTimeout": true,
          "timeoutMs": null,
          "isParallel": false,
          "isSerial": true,
          "context": "Generate a clarification request to help the user specify their business needs.\n\n# Context\nThe user's input was too vague. Detected domain: \"${domain}\"${mediaContext}\n\n# Requirements\nGenerate 3-4 distinct business scenarios (archetypes) that differ significantly for the \"${domain}\" domain.\n\nEach scenario should:\n1. Target different business objects (e.g., physical goods vs. workflows vs. people)\n2. Have distinct use cases and features\n3. Be clearly differentiated from others\n\nCommon archetypes f"
        },
        {
          "type": "getVisionModel",
          "line": 236,
          "function": "anonymous",
          "hasRetry": false,
          "retryCount": null,
          "hasTimeout": false,
          "timeoutMs": null,
          "isParallel": false,
          "isSerial": false,
          "context": "\n// 定义图生成结果 Schema（保持向后兼容）\nconst GraphResultSchema = z.object({\n  type: z.literal('graph_generated'),\n  global: GlobalArchitectureSchema.describe('全局业务架构（用户旅程和领域事件）'),\n  nodes: z.array(NodeSchemaWithTraceability).describe('节点列表（包含可追溯性信息）'),\n  edges: z.array(EdgeSchema).describe('边列表（节点之间的连接关系）'),\n});\n\n// 定义条件结果 Schema（Union类型）\nconst ConditionalResultSchema = z.discriminatedUnion('type', [\n  ClarificationRequestSchema,\n  GraphResultSchema,\n]);\n\n// 分析输入模糊度的辅助函数\n// CRITICAL: This function must NEVE"
        },
        {
          "type": "getTextModel",
          "line": 481,
          "function": "anonymous",
          "hasRetry": true,
          "retryCount": 2,
          "hasTimeout": false,
          "timeoutMs": null,
          "isParallel": false,
          "isSerial": false,
          "context": "      },\n    ],\n    maxRetries: 2, // 减少重试次数，避免在速率限制时等待过久\n    // Never pass temperature - let model use defaults\n  };\n  \n  const result = await generateObject(generateOptions);\n\n  if (!result.object) {\n    throw new Error('AI 生成澄清请求返回结果为空');\n  }\n\n  const clarificationData = result.object as z.infer<typeof ClarificationGenerationSchema>;\n\n  return {\n    type: 'clarification_needed' as const,\n    data: clarificationData,\n  };\n}\n\nexport const generateGraph = createServerAction()\n  .input(GenerateGr"
        }
      ]
    },
    {
      "file": "app/actions/generate-tailwind-config.ts",
      "function": "anonymous",
      "calls": [
        {
          "type": "generateText",
          "line": 132,
          "function": "anonymous",
          "hasRetry": false,
          "retryCount": null,
          "hasTimeout": false,
          "timeoutMs": null,
          "isParallel": false,
          "isSerial": true,
          "context": "          // 定义语义化别名\n          primary: '#1E3A8A',\n          background: '#F3F4F6',\n          surface: '#FFFFFF',\n        }\n      }\n    },\n    darkMode: 'class', // 强制手动模式，防止随系统变黑\n  }\n  \\`\\`\\`\n\n# 示例\n用户需求：\"深蓝色主题\"\nHTML 中使用了：bg-blue-600, text-blue-500\n输出：\n\\`\\`\\`javascript\n{\n  theme: {\n    extend: {\n      colors: {\n        blue: {\n          600: '#1E3A8A', // 覆盖默认 blue-600 为深蓝\n          500: '#2563EB', // 覆盖默认 blue-500\n        },\n        primary: '#1E3A8A',\n        background: '#F3F4F6',\n        sur"
        },
        {
          "type": "getOpenAIClient",
          "line": 11,
          "function": "anonymous",
          "hasRetry": false,
          "retryCount": null,
          "hasTimeout": true,
          "timeoutMs": null,
          "isParallel": false,
          "isSerial": false,
          "context": "'use server';\n\nimport { createServerAction } from 'zsa';\nimport { z } from 'zod';\nimport { generateText } from 'ai';\nimport { log, logError } from '@/lib/logger';\nimport { getTextModel } from '@/lib/ai-config';\nimport { getOpenAIClient } from '@/lib/openai-client';\n\n// Use shared OpenAI client with undici Agent for extended timeouts\nconst openaiClient = getOpenAIClient();\n\nconst generateTailwindConfigSchema = z.object({\n  designRequirement: z.string().describe('用户的设计需求描述（如\"深蓝/淡蓝\"、\"深色主题\"等）'),\n  e"
        },
        {
          "type": "getTextModel",
          "line": 131,
          "function": "anonymous",
          "hasRetry": false,
          "retryCount": null,
          "hasTimeout": false,
          "timeoutMs": null,
          "isParallel": false,
          "isSerial": false,
          "context": "          },\n          // 定义语义化别名\n          primary: '#1E3A8A',\n          background: '#F3F4F6',\n          surface: '#FFFFFF',\n        }\n      }\n    },\n    darkMode: 'class', // 强制手动模式，防止随系统变黑\n  }\n  \\`\\`\\`\n\n# 示例\n用户需求：\"深蓝色主题\"\nHTML 中使用了：bg-blue-600, text-blue-500\n输出：\n\\`\\`\\`javascript\n{\n  theme: {\n    extend: {\n      colors: {\n        blue: {\n          600: '#1E3A8A', // 覆盖默认 blue-600 为深蓝\n          500: '#2563EB', // 覆盖默认 blue-500\n        },\n        primary: '#1E3A8A',\n        background: '#F3F4F6'"
        }
      ]
    },
    {
      "file": "app/actions/node-operations.ts",
      "function": "anonymous",
      "calls": [
        {
          "type": "generateText",
          "line": 337,
          "function": "anonymous",
          "hasRetry": false,
          "retryCount": null,
          "hasTimeout": false,
          "timeoutMs": null,
          "isParallel": false,
          "isSerial": true,
          "context": "    if (!process.env.OPENAI_API_KEY) {\n      throw new Error('OPENAI_API_KEY 未配置');\n    }\n\n    const textModel = getTextModel();\n    \n    // Determine if input is HTML or React\n    const isHTML = isHTMLContent(code);\n\n    const systemPrompt = `You are a UI beautification expert. Your task is to refine visual styling ONLY.\n\nCRITICAL RULES:\n1. **ONLY adjust visual styles** (colors, spacing, shadows, borders, typography)\n2. **DO NOT change structure** (layout hierarchy, element order, DOM structure"
        },
        {
          "type": "generateText",
          "line": 467,
          "function": "anonymous",
          "hasRetry": false,
          "retryCount": null,
          "hasTimeout": false,
          "timeoutMs": null,
          "isParallel": false,
          "isSerial": true,
          "context": "根据提供的 React 组件代码，描述 '${nodeLabel}' 模块的功能。\n\n# 风格要求\n${industrySpecificInstructions}\n- 关注与 ${targetAudience} 相关的功能特性。\n- 使用 ${industry} 行业的专业术语。\n- 如果用户提供的信息不完整，根据行业上下文合理推断功能细节。\n\n# 输出要求\n- 生成一个清晰的模块标题（使用中文）\n- 生成功能需求列表（使用中文）\n- 使用简洁的中文描述\n- 确保需求可执行且符合 ${industry} 行业特点\n- **所有输出内容必须使用中文**，禁止使用英文`;\n\n    // Extract UI summary for context\n    let uiSummaryContext = '';\n    if (isHTMLContent(input.code)) {\n      const summary = extractUISummaryFromHTML(input.code);\n      uiSummaryContext = formatUISummaryForPr"
        },
        {
          "type": "generateText",
          "line": 604,
          "function": "anonymous",
          "hasRetry": false,
          "retryCount": null,
          "hasTimeout": false,
          "timeoutMs": null,
          "isParallel": false,
          "isSerial": true,
          "context": "\n    // 构建系统提示词\n    const systemPrompt = `你是一位专业的QA测试工程师，擅长编写全面的测试用例。\n\n# 任务\n根据提供的功能需求，生成详细的测试用例列表。\n\n# 输出要求\n1. 每个测试用例应该包含：\n   - 测试场景描述（清晰、具体）\n   - 测试步骤（可选，如果场景复杂）\n   - 预期结果\n2. 测试用例应该覆盖：\n   - 正常流程（Happy Path）\n   - 边界条件（Boundary Cases）\n   - 异常情况（Error Cases）\n   - 数据验证（Validation）\n   - UI交互（如果适用）\n3. 使用中文描述，确保清晰易懂\n4. 每个测试用例独立一行，格式简洁\n5. 测试用例数量：根据需求复杂度，生成5-15个测试用例\n\n# 输出格式\n直接输出测试用例列表，每行一个测试用例，格式如下：\n- 测试用例1：描述测试场景和预期结果\n- 测试用例2：描述测试场景和预期结果\n...`;\n\n    // 构建用户提示词\n    const requirementsText = input.requireme"
        },
        {
          "type": "generateText",
          "line": 1667,
          "function": "anonymous",
          "hasRetry": true,
          "retryCount": 0,
          "hasTimeout": false,
          "timeoutMs": null,
          "isParallel": false,
          "isSerial": true,
          "context": "        model: visionModel,\n        generationMode,\n        modeType: generationModeType,\n        promptChars: promptText.length,\n        attemptCount: 1,\n        cooldownGateHit: false,\n        timestamp: Date.now(),\n      });\n      \n      // Initialize OpenAI client (lazy initialization to avoid module-level errors)\n      const openaiClient = getOpenAIClient();\n      \n      // Check if reasoning model (no temperature)\n      const isReasoningModel = visionModel.includes('reasoning') || \n       "
        },
        {
          "type": "generateText",
          "line": 2900,
          "function": "anonymous",
          "hasRetry": false,
          "retryCount": null,
          "hasTimeout": false,
          "timeoutMs": null,
          "isParallel": false,
          "isSerial": true,
          "context": "${existingRequirementsText}\n\n${!hasExistingRequirements ? `**输出要求：**\n1. 必须使用Markdown表格格式，表格结构如下（严格遵循）：\n\n| 功能ID | UI区域 | 元素名称 | 功能说明 | 展示规范 |\n|--------|--------|----------|----------|----------|\n\n2. 分析代码中的所有功能点和UI元素，为每个功能点创建一行表格\n3. 功能ID从${functionIdExample}\n4. 所有描述使用中文，确保易读易懂，使用业务语言而非技术术语\n\n5. **功能说明列（Column 4）**要详细说明：\n   - **交互元素（按钮、输入框、链接等）**：描述用户操作和系统响应\n     - 示例：\"点击后跳转至详情页。\"、\"支持输入关键词进行模糊搜索。\"\n   - **只读元素（标题、标签、状态指示器等）**：描述业务目的（传达什么信息）\n     - 示例：\"用于展示当前指令的流转状态。\"、\"标识该指令的来源渠道。\"\n     - **禁止**说\"无交互\""
        },
        {
          "type": "getOpenAIClient",
          "line": 335,
          "function": "anonymous",
          "hasRetry": false,
          "retryCount": null,
          "hasTimeout": false,
          "timeoutMs": null,
          "isParallel": false,
          "isSerial": false,
          "context": "  try {\n    // Check environment\n    if (!process.env.OPENAI_API_KEY) {\n      throw new Error('OPENAI_API_KEY 未配置');\n    }\n\n    const textModel = getTextModel();\n    \n    // Determine if input is HTML or React\n    const isHTML = isHTMLContent(code);\n\n    const systemPrompt = `You are a UI beautification expert. Your task is to refine visual styling ONLY.\n\nCRITICAL RULES:\n1. **ONLY adjust visual styles** (colors, spacing, shadows, borders, typography)\n2. **DO NOT change structure** (layout hierar"
        },
        {
          "type": "getOpenAIClient",
          "line": 465,
          "function": "anonymous",
          "hasRetry": false,
          "retryCount": null,
          "hasTimeout": false,
          "timeoutMs": null,
          "isParallel": false,
          "isSerial": false,
          "context": "\n# 任务\n根据提供的 React 组件代码，描述 '${nodeLabel}' 模块的功能。\n\n# 风格要求\n${industrySpecificInstructions}\n- 关注与 ${targetAudience} 相关的功能特性。\n- 使用 ${industry} 行业的专业术语。\n- 如果用户提供的信息不完整，根据行业上下文合理推断功能细节。\n\n# 输出要求\n- 生成一个清晰的模块标题（使用中文）\n- 生成功能需求列表（使用中文）\n- 使用简洁的中文描述\n- 确保需求可执行且符合 ${industry} 行业特点\n- **所有输出内容必须使用中文**，禁止使用英文`;\n\n    // Extract UI summary for context\n    let uiSummaryContext = '';\n    if (isHTMLContent(input.code)) {\n      const summary = extractUISummaryFromHTML(input.code);\n      uiSummaryContext = formatUISummar"
        },
        {
          "type": "getOpenAIClient",
          "line": 601,
          "function": "anonymous",
          "hasRetry": false,
          "retryCount": null,
          "hasTimeout": false,
          "timeoutMs": null,
          "isParallel": false,
          "isSerial": false,
          "context": "    if (!input.requirements || input.requirements.length === 0) {\n      throw new Error('需求列表为空，无法生成测试用例');\n    }\n\n    // 构建系统提示词\n    const systemPrompt = `你是一位专业的QA测试工程师，擅长编写全面的测试用例。\n\n# 任务\n根据提供的功能需求，生成详细的测试用例列表。\n\n# 输出要求\n1. 每个测试用例应该包含：\n   - 测试场景描述（清晰、具体）\n   - 测试步骤（可选，如果场景复杂）\n   - 预期结果\n2. 测试用例应该覆盖：\n   - 正常流程（Happy Path）\n   - 边界条件（Boundary Cases）\n   - 异常情况（Error Cases）\n   - 数据验证（Validation）\n   - UI交互（如果适用）\n3. 使用中文描述，确保清晰易懂\n4. 每个测试用例独立一行，格式简洁\n5. 测试用例数量：根据需求复杂度，生成5-15个测试用例\n\n# 输出格式\n直接输出测试用例列表，每行一个测试用"
        },
        {
          "type": "getOpenAIClient",
          "line": 1628,
          "function": "anonymous",
          "hasRetry": true,
          "retryCount": 0,
          "hasTimeout": false,
          "timeoutMs": null,
          "isParallel": false,
          "isSerial": false,
          "context": "- Ignore phone system status bar elements (time, signal, battery icons)\n- Ensure all buttons, inputs, and tabs are interactive\n\n### 3.2 Strict Constraints\n- **NO Simplification**: If the image shows a complex element, build it exactly as shown\n- **NO Hallucination**: Do not add elements that are not in the image\n- **NO Lazy Styling**: Match spacing, colors, and sizes exactly\n- **NO Color Substitution**: Use exact hex codes when Tailwind defaults don't match\n- **NO Layout Changes**: Keep the exac"
        },
        {
          "type": "getOpenAIClient",
          "line": 2897,
          "function": "anonymous",
          "hasRetry": false,
          "retryCount": null,
          "hasTimeout": false,
          "timeoutMs": null,
          "isParallel": false,
          "isSerial": false,
          "context": "\n## UI元素摘要（用于减少幻觉，确保需求绑定到具体元素）：\n${uiSummaryContext}\n${existingRequirementsText}\n\n${!hasExistingRequirements ? `**输出要求：**\n1. 必须使用Markdown表格格式，表格结构如下（严格遵循）：\n\n| 功能ID | UI区域 | 元素名称 | 功能说明 | 展示规范 |\n|--------|--------|----------|----------|----------|\n\n2. 分析代码中的所有功能点和UI元素，为每个功能点创建一行表格\n3. 功能ID从${functionIdExample}\n4. 所有描述使用中文，确保易读易懂，使用业务语言而非技术术语\n\n5. **功能说明列（Column 4）**要详细说明：\n   - **交互元素（按钮、输入框、链接等）**：描述用户操作和系统响应\n     - 示例：\"点击后跳转至详情页。\"、\"支持输入关键词进行模糊搜索。\"\n   - **只读元素（标题、标签、状态指示器等）**：描述业务目的（传达什么信息）\n     - 示"
        },
        {
          "type": "getVisionModel",
          "line": 1615,
          "function": "anonymous",
          "hasRetry": true,
          "retryCount": 0,
          "hasTimeout": false,
          "timeoutMs": null,
          "isParallel": false,
          "isSerial": false,
          "context": "    - Headings: **必须使用** \\`text-white\\` 或 \\`text-gray-50\\`\n    - Body text: **必须使用至少** \\`text-gray-300\\` 或 \\`text-slate-300\\`（**严格禁止 text-gray-400、text-gray-500、text-gray-600 或更深**）\n    - **绝对禁止**：text-black、text-gray-900-600 在深色背景上（会导致不可见）\n  - **关键原则**：文本颜色必须与背景色形成足够对比度，确保清晰可见。如果图片中文本颜色与背景色不匹配，必须调整文本颜色以确保可见性。\n- Look for indicator bars (colored side strips) and implement them with \\`absolute\\` positioning.\n\n## Step 3: Coding Phase\n\n### 3.1 Implementation Rules\n- Use React Functional Component: \\"
        },
        {
          "type": "getTextModel",
          "line": 292,
          "function": "anonymous",
          "hasRetry": false,
          "retryCount": null,
          "hasTimeout": false,
          "timeoutMs": null,
          "isParallel": false,
          "isSerial": false,
          "context": "  // Determine mode based on scores\n  const avgScore = (completeness + coherence + interactionClosure + dataSupport) / 4;\n  let mode: UIRationalityMode;\n  let reasoning: string;\n\n  if (avgScore >= 75 && completeness >= 70 && coherence >= 70) {\n    mode = 'PRESERVE';\n    reasoning = `输入UI完整性高（${completeness}%），逻辑一致性好（${coherence}%）。采用PRESERVE模式：保留现有UI结构，仅做细微优化。`;\n  } else if (avgScore >= 50 && (completeness < 70 || interactionClosure < 50 || dataSupport < 50)) {\n    mode = 'COMPLETE';\n    reasoni"
        },
        {
          "type": "getTextModel",
          "line": 462,
          "function": "anonymous",
          "hasRetry": false,
          "retryCount": null,
          "hasTimeout": false,
          "timeoutMs": null,
          "isParallel": false,
          "isSerial": false,
          "context": "    // 构建动态系统提示词（基于项目画像）\n    const systemPrompt = `你是一位专注于 **${industry}** 行业的产品经理。\n你的目标用户是 **${targetAudience}**。\n\n# 任务\n根据提供的 React 组件代码，描述 '${nodeLabel}' 模块的功能。\n\n# 风格要求\n${industrySpecificInstructions}\n- 关注与 ${targetAudience} 相关的功能特性。\n- 使用 ${industry} 行业的专业术语。\n- 如果用户提供的信息不完整，根据行业上下文合理推断功能细节。\n\n# 输出要求\n- 生成一个清晰的模块标题（使用中文）\n- 生成功能需求列表（使用中文）\n- 使用简洁的中文描述\n- 确保需求可执行且符合 ${industry} 行业特点\n- **所有输出内容必须使用中文**，禁止使用英文`;\n\n    // Extract UI summary for context\n    let uiSummaryContext = '';\n    if (isHTMLContent"
        },
        {
          "type": "getTextModel",
          "line": 598,
          "function": "anonymous",
          "hasRetry": false,
          "retryCount": null,
          "hasTimeout": false,
          "timeoutMs": null,
          "isParallel": false,
          "isSerial": false,
          "context": "      throw new Error('OPENAI_API_KEY 未配置。请在 .env.local 文件中添加 OPENAI_API_KEY=your_api_key');\n    }\n\n    if (!input.requirements || input.requirements.length === 0) {\n      throw new Error('需求列表为空，无法生成测试用例');\n    }\n\n    // 构建系统提示词\n    const systemPrompt = `你是一位专业的QA测试工程师，擅长编写全面的测试用例。\n\n# 任务\n根据提供的功能需求，生成详细的测试用例列表。\n\n# 输出要求\n1. 每个测试用例应该包含：\n   - 测试场景描述（清晰、具体）\n   - 测试步骤（可选，如果场景复杂）\n   - 预期结果\n2. 测试用例应该覆盖：\n   - 正常流程（Happy Path）\n   - 边界条件（Boundary Cases）\n   - 异常情况（Error Cases）\n   - 数据验证（Validation）\n   - UI交"
        },
        {
          "type": "getTextModel",
          "line": 2894,
          "function": "anonymous",
          "hasRetry": false,
          "retryCount": null,
          "hasTimeout": false,
          "timeoutMs": null,
          "isParallel": false,
          "isSerial": false,
          "context": "\\`\\`\\`${isHTMLContent(input.codeContext) ? 'html' : 'tsx'}\n${input.codeContext}\n\\`\\`\\`\n\n## UI元素摘要（用于减少幻觉，确保需求绑定到具体元素）：\n${uiSummaryContext}\n${existingRequirementsText}\n\n${!hasExistingRequirements ? `**输出要求：**\n1. 必须使用Markdown表格格式，表格结构如下（严格遵循）：\n\n| 功能ID | UI区域 | 元素名称 | 功能说明 | 展示规范 |\n|--------|--------|----------|----------|----------|\n\n2. 分析代码中的所有功能点和UI元素，为每个功能点创建一行表格\n3. 功能ID从${functionIdExample}\n4. 所有描述使用中文，确保易读易懂，使用业务语言而非技术术语\n\n5. **功能说明列（Column 4）**要详细说明：\n   - **交互元素（按钮、输入框、链接等）**：描述用户操作和系统响应\n    "
        }
      ]
    },
    {
      "file": "app/actions/parse-topology.ts",
      "function": "anonymous",
      "calls": [
        {
          "type": "generateObject",
          "line": 106,
          "function": "anonymous",
          "hasRetry": false,
          "retryCount": null,
          "hasTimeout": true,
          "timeoutMs": null,
          "isParallel": false,
          "isSerial": true,
          "context": "/**\n * 解析拓扑图，识别节点和连接关系\n */\nexport const parseTopology = createServerAction()\n  .input(ParseTopologyInputSchema)\n  .handler(async ({ input }) => {\n    const startTime = Date.now();\n    const requestId = `topo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;\n    \n    log('='.repeat(80));\n    log(`🗺️ [parseTopology] 开始解析拓扑图 [${requestId}]`);\n    log(`📋 [parseTopology] 输入参数 [${requestId}]:`, {\n      imageBase64Length: input.imageBase64?.length || 0,\n      hasPrompt: !!input.prompt,\n     "
        },
        {
          "type": "getVisionModel",
          "line": 96,
          "function": "anonymous",
          "hasRetry": false,
          "retryCount": null,
          "hasTimeout": true,
          "timeoutMs": null,
          "isParallel": false,
          "isSerial": false,
          "context": "\nconst ParseTopologyInputSchema = z.object({\n  imageBase64: z.string().describe('拓扑图图片的 base64 编码'),\n  prompt: z.string().optional().describe('可选的用户提示词，用于指导解析'),\n  aiConfig: z.object({\n    visionModel: z.string().optional(),\n    textModel: z.string().optional(),\n  }).optional().describe('AI模型配置，如果未提供则使用环境变量或默认值'),\n});\n\n/**\n * 解析拓扑图，识别节点和连接关系\n */\nexport const parseTopology = createServerAction()\n  .input(ParseTopologyInputSchema)\n  .handler(async ({ input }) => {\n    const startTime = Date.now();"
        }
      ]
    },
    {
      "file": "lib/ai/llm.ts",
      "function": "anonymous",
      "calls": [
        {
          "type": "generateText",
          "line": 203,
          "function": "anonymous",
          "hasRetry": true,
          "retryCount": 0,
          "hasTimeout": true,
          "timeoutMs": null,
          "isParallel": false,
          "isSerial": true,
          "context": "  const keyHash = stableHash(keyInput);\n  const taskKey: GatewayTaskKey = `${model}:${actionName}:${keyHash}`;\n\n  // Check cooldown gate (fast-fail, <= 2s)\n  const cooldownCheck = checkCooldownGate();\n  if (cooldownCheck.blocked) {\n    log('🚫 [LLM Gateway] Request blocked by cooldown gate', {\n      requestId,\n      cooldownSeconds: cooldownCheck.cooldownSeconds,\n    });\n    return {\n      ok: false,\n      type: 'RATE_LIMIT',\n      message: `请求过多，请在 ${cooldownCheck.cooldownSeconds} 秒后重试`,\n      "
        },
        {
          "type": "getOpenAIClient",
          "line": 184,
          "function": "anonymous",
          "hasRetry": true,
          "retryCount": 0,
          "hasTimeout": true,
          "timeoutMs": null,
          "isParallel": false,
          "isSerial": true,
          "context": "  actionName?: string; // For task key generation\n  attachments?: string; // For task key generation\n  mode?: string; // For task key generation\n}): Promise<AIResult<string>> {\n  const {\n    model,\n    prompt,\n    timeoutMs = 30000, // Default 30s timeout\n    maxOutputTokens,\n    aiConfig,\n    actionName = 'callText',\n    attachments = '',\n    mode = '',\n  } = params;\n\n  const requestId = `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;\n\n  // Generate stable task key: model + act"
        }
      ]
    },
    {
      "file": "lib/ai-config.ts",
      "function": "anonymous",
      "calls": [
        {
          "type": "getVisionModel",
          "line": 16,
          "function": "anonymous",
          "hasRetry": false,
          "retryCount": null,
          "hasTimeout": false,
          "timeoutMs": null,
          "isParallel": false,
          "isSerial": false,
          "context": "/**\n * AI 模型配置工具函数\n * 用于在服务器端和客户端获取当前使用的 AI 模型\n */\n\n// 默认模型配置\nexport const DEFAULT_AI_CONFIG = {\n  visionModel: 'gpt-5.1-chat-2025-11-13',\n  textModel: 'gpt-5.1-chat-2025-11-13',\n} as const;\n\n/**\n * 获取视觉模型（用于 UI 生成、拓扑解析等）\n * 优先级：用户配置 > 环境变量 > 默认值\n */\nexport function getVisionModel(userConfig?: { visionModel?: string }): string {\n  // 优先使用用户配置\n  if (userConfig?.visionModel) {\n    return userConfig.visionModel;\n  }\n  \n  // 其次使用环境变量\n  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_AI"
        },
        {
          "type": "getTextModel",
          "line": 35,
          "function": "anonymous",
          "hasRetry": false,
          "retryCount": null,
          "hasTimeout": false,
          "timeoutMs": null,
          "isParallel": false,
          "isSerial": false,
          "context": "/**\n * AI 模型配置工具函数\n * 用于在服务器端和客户端获取当前使用的 AI 模型\n */\n\n// 默认模型配置\nexport const DEFAULT_AI_CONFIG = {\n  visionModel: 'gpt-5.1-chat-2025-11-13',\n  textModel: 'gpt-5.1-chat-2025-11-13',\n} as const;\n\n/**\n * 获取视觉模型（用于 UI 生成、拓扑解析等）\n * 优先级：用户配置 > 环境变量 > 默认值\n */\nexport function getVisionModel(userConfig?: { visionModel?: string }): string {\n  // 优先使用用户配置\n  if (userConfig?.visionModel) {\n    return userConfig.visionModel;\n  }\n  \n  // 其次使用环境变量\n  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_AI"
        }
      ]
    },
    {
      "file": "lib/openai-client.ts",
      "function": "anonymous",
      "calls": [
        {
          "type": "getOpenAIClient",
          "line": 314,
          "function": "anonymous",
          "hasRetry": true,
          "retryCount": null,
          "hasTimeout": true,
          "timeoutMs": null,
          "isParallel": false,
          "isSerial": false,
          "context": "            }\n            \n            const retryResponse = await fetch(url, fetchOptions);\n            clearTimeout(timeoutId);\n            requestContexts.delete(requestId);\n            return retryResponse;\n          } catch (retryError) {\n            const totalElapsed = Date.now() - startTime;\n            logError('🌐 [OpenAI Client] Network retry failed', {\n              requestId,\n              totalElapsedMs: totalElapsed,\n              retryAttempt: attemptNumber + 1,\n            });\n "
        },
        {
          "type": "getOpenAIClient",
          "line": 333,
          "function": "compatible",
          "hasRetry": true,
          "retryCount": null,
          "hasTimeout": false,
          "timeoutMs": null,
          "isParallel": false,
          "isSerial": false,
          "context": "            networkError.type = 'network_error';\n            networkError.retryable = false;\n            requestContexts.delete(requestId);\n            throw networkError;\n          }\n        } else {\n          // Already retried, fail fast\n          const networkError = new Error('Network error') as Error & {\n            type: 'network_error';\n            retryable: boolean;\n          };\n          networkError.type = 'network_error';\n          networkError.retryable = false;\n          requestCo"
        }
      ]
    }
  ],
  "callGraph": {
    "app/actions/generate-graph.ts": [
      {
        "to": "generateObject",
        "line": 438,
        "retry": 2,
        "timeout": null,
        "parallel": false,
        "serial": true
      },
      {
        "to": "getVisionModel",
        "line": 236,
        "retry": null,
        "timeout": null,
        "parallel": false,
        "serial": false
      },
      {
        "to": "getTextModel",
        "line": 481,
        "retry": 2,
        "timeout": null,
        "parallel": false,
        "serial": false
      }
    ],
    "app/actions/generate-tailwind-config.ts": [
      {
        "to": "generateText",
        "line": 132,
        "retry": null,
        "timeout": null,
        "parallel": false,
        "serial": true
      },
      {
        "to": "getOpenAIClient",
        "line": 11,
        "retry": null,
        "timeout": null,
        "parallel": false,
        "serial": false
      },
      {
        "to": "getTextModel",
        "line": 131,
        "retry": null,
        "timeout": null,
        "parallel": false,
        "serial": false
      }
    ],
    "app/actions/node-operations.ts": [
      {
        "to": "generateText",
        "line": 337,
        "retry": null,
        "timeout": null,
        "parallel": false,
        "serial": true
      },
      {
        "to": "generateText",
        "line": 467,
        "retry": null,
        "timeout": null,
        "parallel": false,
        "serial": true
      },
      {
        "to": "generateText",
        "line": 604,
        "retry": null,
        "timeout": null,
        "parallel": false,
        "serial": true
      },
      {
        "to": "generateText",
        "line": 1667,
        "retry": 0,
        "timeout": null,
        "parallel": false,
        "serial": true
      },
      {
        "to": "generateText",
        "line": 2900,
        "retry": null,
        "timeout": null,
        "parallel": false,
        "serial": true
      },
      {
        "to": "getOpenAIClient",
        "line": 335,
        "retry": null,
        "timeout": null,
        "parallel": false,
        "serial": false
      },
      {
        "to": "getOpenAIClient",
        "line": 465,
        "retry": null,
        "timeout": null,
        "parallel": false,
        "serial": false
      },
      {
        "to": "getOpenAIClient",
        "line": 601,
        "retry": null,
        "timeout": null,
        "parallel": false,
        "serial": false
      },
      {
        "to": "getOpenAIClient",
        "line": 1628,
        "retry": 0,
        "timeout": null,
        "parallel": false,
        "serial": false
      },
      {
        "to": "getOpenAIClient",
        "line": 2897,
        "retry": null,
        "timeout": null,
        "parallel": false,
        "serial": false
      },
      {
        "to": "getVisionModel",
        "line": 1615,
        "retry": 0,
        "timeout": null,
        "parallel": false,
        "serial": false
      },
      {
        "to": "getTextModel",
        "line": 292,
        "retry": null,
        "timeout": null,
        "parallel": false,
        "serial": false
      },
      {
        "to": "getTextModel",
        "line": 462,
        "retry": null,
        "timeout": null,
        "parallel": false,
        "serial": false
      },
      {
        "to": "getTextModel",
        "line": 598,
        "retry": null,
        "timeout": null,
        "parallel": false,
        "serial": false
      },
      {
        "to": "getTextModel",
        "line": 2894,
        "retry": null,
        "timeout": null,
        "parallel": false,
        "serial": false
      }
    ],
    "app/actions/parse-topology.ts": [
      {
        "to": "generateObject",
        "line": 106,
        "retry": null,
        "timeout": null,
        "parallel": false,
        "serial": true
      },
      {
        "to": "getVisionModel",
        "line": 96,
        "retry": null,
        "timeout": null,
        "parallel": false,
        "serial": false
      }
    ],
    "lib/ai/llm.ts": [
      {
        "to": "generateText",
        "line": 203,
        "retry": 0,
        "timeout": null,
        "parallel": false,
        "serial": true
      },
      {
        "to": "getOpenAIClient",
        "line": 184,
        "retry": 0,
        "timeout": null,
        "parallel": false,
        "serial": true
      }
    ],
    "lib/ai-config.ts": [
      {
        "to": "getVisionModel",
        "line": 16,
        "retry": null,
        "timeout": null,
        "parallel": false,
        "serial": false
      },
      {
        "to": "getTextModel",
        "line": 35,
        "retry": null,
        "timeout": null,
        "parallel": false,
        "serial": false
      }
    ],
    "lib/openai-client.ts": [
      {
        "to": "getOpenAIClient",
        "line": 314,
        "retry": null,
        "timeout": null,
        "parallel": false,
        "serial": false
      },
      {
        "to": "getOpenAIClient",
        "line": 333,
        "retry": null,
        "timeout": null,
        "parallel": false,
        "serial": false
      }
    ]
  },
  "retryConfigs": {},
  "timeoutConfigs": {},
  "serialCalls": [
    {
      "file": "app/actions/generate-graph.ts",
      "line": 438,
      "type": "generateObject"
    },
    {
      "file": "app/actions/generate-tailwind-config.ts",
      "line": 132,
      "type": "generateText"
    },
    {
      "file": "app/actions/node-operations.ts",
      "line": 337,
      "type": "generateText"
    },
    {
      "file": "app/actions/node-operations.ts",
      "line": 467,
      "type": "generateText"
    },
    {
      "file": "app/actions/node-operations.ts",
      "line": 604,
      "type": "generateText"
    },
    {
      "file": "app/actions/node-operations.ts",
      "line": 1667,
      "type": "generateText"
    },
    {
      "file": "app/actions/node-operations.ts",
      "line": 2900,
      "type": "generateText"
    },
    {
      "file": "app/actions/parse-topology.ts",
      "line": 106,
      "type": "generateObject"
    },
    {
      "file": "lib/ai/llm.ts",
      "line": 203,
      "type": "generateText"
    },
    {
      "file": "lib/ai/llm.ts",
      "line": 184,
      "type": "getOpenAIClient"
    }
  ],
  "parallelCalls": []
}
```
