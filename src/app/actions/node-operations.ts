'use server';

import { createServerAction } from 'zsa';
import { z } from 'zod';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { log, logError } from '@/lib/logger';
import { getVisionModel, getTextModel } from '@/lib/ai-config';

// 创建自定义 OpenAI 客户端，通过自定义 fetch 增加超时时间
const openaiClient = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  fetch: async (url, options) => {
    // 创建带超时的 fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 360000); // 6 分钟超时
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  },
});

// ==================== 直接调用的函数（用于 NodeDetailPanel）====================

export async function refineUI(code: string, prompt: string): Promise<{ code: string }> {
  // TODO: 实现 UI 优化逻辑
  return { code };
}

export async function reverseGenerateSpec(input: {
  code: string;
  nodeLabel: string;
  projectMeta?: {
    projectName: string;
    industry: string;
    targetAudience: string;
    description: string;
    version: string;
  };
  aiConfig?: {
    visionModel?: string;
    textModel?: string;
  };
}): Promise<{ title: string; requirements: string[] }> {
  try {
    // 检查环境变量
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY 未配置。请在 .env.local 文件中添加 OPENAI_API_KEY=your_api_key');
    }

    // 获取项目画像配置
    const projectMeta = input.projectMeta || {
      projectName: '未命名项目',
      industry: 'General Internet',
      targetAudience: 'General Users',
      description: '',
      version: '1.0.0',
    };

    const { industry, targetAudience, nodeLabel } = { ...projectMeta, nodeLabel: input.nodeLabel };

    // 根据行业动态调整术语和功能重点
    let industrySpecificInstructions = '';
    const industryLower = industry.toLowerCase();
    
    if (industryLower.includes('gaming') || industryLower.includes('游戏')) {
      industrySpecificInstructions = '使用游戏行业的术语（如：Inventory/库存、Buff/增益、Quest/任务、Character/角色、Level/等级等）。';
    } else if (industryLower.includes('logistics') || industryLower.includes('物流')) {
      industrySpecificInstructions = '使用物流行业的术语（如：Waybill/运单、Dispatch/调度、Tracking/追踪、Warehouse/仓库、Delivery/配送等）。';
    } else if (industryLower.includes('finance') || industryLower.includes('fintech') || industryLower.includes('金融')) {
      industrySpecificInstructions = '使用金融行业的术语（如：Account/账户、Transaction/交易、Balance/余额、Payment/支付、Security/安全等）。注意：如果是登录相关模块，需要假设2FA（双因素认证）功能。';
    } else if (industryLower.includes('healthcare') || industryLower.includes('医疗')) {
      industrySpecificInstructions = '使用医疗行业的术语（如：Patient/患者、Record/病历、Prescription/处方、Appointment/预约、Diagnosis/诊断等）。注意数据隐私和合规性要求。';
    } else if (industryLower.includes('e-commerce') || industryLower.includes('电商')) {
      industrySpecificInstructions = '使用电商行业的术语（如：Product/商品、Cart/购物车、Order/订单、Payment/支付、Review/评价等）。';
    } else {
      industrySpecificInstructions = '使用清晰、通用的术语描述功能。';
    }

    // 构建动态系统提示词（基于项目画像）
    const systemPrompt = `You are a specialized Product Manager in the **${industry}** sector.
Your target users are **${targetAudience}**.

# Task
Describe the functionality of the '${nodeLabel}' module based on the provided React component code.

# Style Instructions
${industrySpecificInstructions}
- Focus on features relevant to ${targetAudience}.
- Use terminology specific to ${industry}.
- If the user provided sparse information, infer functional details based on the industry context.

# Output Requirements
- Generate a clear title for this module
- Generate a list of functional requirements
- Use concise Chinese descriptions
- Ensure requirements are actionable and specific to the ${industry} industry`;

    const userPrompt = `请分析以下React组件代码，生成'${nodeLabel}'模块的需求描述：

\`\`\`tsx
${input.code}
\`\`\`

要求：
1. 生成一个简洁的模块标题
2. 生成功能需求列表（每个需求一行，使用中文）
3. 使用${industry}行业的术语和概念
4. 关注${targetAudience}用户的需求
5. 如果代码信息不完整，根据${industry}行业的常见做法进行合理推断`;

    // 获取模型配置
    const textModel = getTextModel(input.aiConfig);
    const result = await generateText({
      model: openaiClient(textModel),
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0.5,
    });

    // 解析生成的文本，提取标题和需求列表
    const generatedText = result.text.trim();
    
    // 尝试提取标题（通常在文本开头，可能是 "标题：xxx" 或 "# xxx" 或直接是标题）
    let title = nodeLabel;
    let requirementsText = generatedText;

    // 查找标题模式
    const titlePatterns = [
      /标题[：:]\s*(.+?)(?:\n|$)/i,
      /#\s*(.+?)(?:\n|$)/,
      /^(.+?)(?:\n\n|\n\d+[\.、]|\n[-*])/m,
    ];

    for (const pattern of titlePatterns) {
      const match = generatedText.match(pattern);
      if (match && match[1]) {
        title = match[1].trim();
        requirementsText = generatedText.replace(pattern, '').trim();
        break;
      }
    }

    // 解析需求列表（按行分割，过滤空行）
    const requirements = requirementsText
      .split('\n')
      .map(line => {
        // 移除列表标记（-、*、1.、1、等）
        return line.replace(/^[-*\d.\s、]+/, '').trim();
      })
      .filter(line => line.length > 0)
      .slice(0, 50); // 限制最多50条需求

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
    apiEndpoints: [],
    dbSchema: '-- 待生成',
  };
}

export async function generateTestCases(input: {
  title: string;
  requirements: string[];
}): Promise<{ cases: string[] }> {
  // TODO: 实现生成测试用例逻辑
      return {
    cases: [],
  };
}

// ==================== Server Actions（用于 CommandBar）====================

const GenerateUIFromImageInputSchema = z.object({
  prompt: z.string(),
  imageBase64: z.string(),
  themeConfig: z.any().optional().describe('UI主题配置，用于应用设计系统'),
  aiConfig: z.object({
    visionModel: z.string().optional(),
    textModel: z.string().optional(),
  }).optional().describe('AI模型配置，如果未提供则使用环境变量或默认值'),
});

export const generateUIFromImage = createServerAction()
  .input(GenerateUIFromImageInputSchema)
  .handler(async ({ input }) => {
    const startTime = Date.now();
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    log('='.repeat(80));
    log(`🚀 [generateUIFromImage] 开始处理图片生成UI请求 [${requestId}]`);
    log(`📋 [generateUIFromImage] 输入参数 [${requestId}]:`, {
      promptLength: input.prompt?.length || 0,
      imageBase64Length: input.imageBase64?.length || 0,
      hasPrompt: !!input.prompt,
      hasImage: !!input.imageBase64,
      timestamp: new Date().toISOString(),
    });
      log('='.repeat(80));

    try {
      // 检查环境变量
      if (!process.env.OPENAI_API_KEY) {
        logError('❌ [generateUIFromImage] OPENAI_API_KEY 未配置');
        throw new Error('OPENAI_API_KEY 未配置。请在 .env.local 文件中添加 OPENAI_API_KEY=your_api_key');
      }
      log('✅ [generateUIFromImage] OPENAI_API_KEY 已配置');

      // 处理 base64 图片数据
      // 输入可能是：
      // 1. 完整的 data URL: "data:image/png;base64,iVBORw0KGgo..."
      // 2. 纯 base64 字符串: "iVBORw0KGgo..."
      let base64Data: string;
      if (input.imageBase64.includes(',')) {
        // 包含逗号，说明是完整的 data URL，提取 base64 部分
        base64Data = input.imageBase64.split(',')[1];
        log('📝 [generateUIFromImage] 检测到 data URL 格式，已提取 base64 部分');
      } else {
        // 不包含逗号，说明已经是纯 base64 数据
        base64Data = input.imageBase64;
        log('📝 [generateUIFromImage] 检测到纯 base64 格式');
      }
      
      // 验证 base64 数据格式
      if (!base64Data || base64Data.length < 100) {
        logError('❌ [generateUIFromImage] 图片数据格式无效:', {
          base64Length: base64Data?.length || 0,
          isValid: !!base64Data && base64Data.length >= 100,
        });
        throw new Error('图片数据格式无效或数据过短');
      }
      
      log('📸 [generateUIFromImage] 图片数据验证通过:', {
        inputLength: input.imageBase64.length,
        base64Length: base64Data.length,
        base64Prefix: base64Data.substring(0, 30),
      });

      // 构建设计系统约束（如果提供了主题配置）
      let designSystemEnforcement = '';
      if (input.themeConfig) {
        const theme = input.themeConfig;
        const isDarkBackground = theme.colors?.background?.dark?.includes('slate-9') || 
                                 theme.colors?.background?.dark?.includes('zinc-9') ||
                                 theme.colors?.background?.dark?.includes('gray-9');
        
        designSystemEnforcement = `

[DESIGN SYSTEM ENFORCEMENT]
你必须严格遵循以下设计配置（优先级高于默认 Tailwind 选择）：
- 主色调：使用 bg-${theme.colors?.primary || 'blue-500'} 和 text-${theme.colors?.primary || 'blue-500'}（用于主要操作按钮、链接、强调元素）
- 次要色调：使用 bg-${theme.colors?.secondary || 'purple-500'} 和 text-${theme.colors?.secondary || 'purple-500'}（用于次要操作）
- 背景色：使用 bg-${theme.colors?.background?.dark || 'slate-900'}（页面背景）
- 表面色：使用 bg-${theme.colors?.surface || 'slate-800'}（卡片、面板背景）
- 主要文本：使用 text-${theme.colors?.text?.primary || 'slate-50'}（标题、重要文本）
- 次要文本：使用 text-${theme.colors?.text?.secondary || 'slate-400'}（描述、辅助文本）
- 边框色：使用 border-${theme.colors?.border || 'slate-700'}（所有边框）
- 圆角：所有按钮、卡片、输入框必须使用 ${theme.shape?.borderRadius?.md || 'rounded-md'}
- 按钮阴影：使用 ${theme.shadows?.buttonShadow || 'shadow-md'}
- 卡片阴影：使用 ${theme.shadows?.cardShadow || 'shadow-lg'}
- 密度：${theme.typography?.density === 'compact' ? '使用紧凑间距（p-2, gap-2）' : theme.typography?.density === 'spacious' ? '使用宽松间距（p-6, gap-6）' : '使用正常间距（p-4, gap-4）'}
${isDarkBackground ? '- 注意：背景是深色，确保所有文本使用浅色类（text-white, text-gray-200, text-slate-50等）' : ''}
- 风格描述：${theme.vibe || 'Modern Professional'}

重要：这些设计令牌必须严格应用，不要使用其他颜色或样式。`;
      }

      // 获取项目画像配置
      const projectMeta = input.projectMeta || {
        projectName: '未命名项目',
        industry: 'General',
        targetAudience: 'General Users',
        coreValue: '提供优质的用户体验',
      };

      // 根据行业动态调整语调和风格
      let toneInstruction = '';
      const industry = projectMeta.industry.toLowerCase();
      if (industry.includes('finance') || industry.includes('fintech') || industry.includes('healthcare') || industry.includes('医疗')) {
        toneInstruction = '采用严谨、正式的设计风格，注重数据准确性和安全性。';
      } else if (industry.includes('gaming') || industry.includes('游戏') || industry.includes('social') || industry.includes('社交')) {
        toneInstruction = '采用生动、富有创意的设计风格，注重用户体验和视觉吸引力。';
      } else if (industry.includes('logistics') || industry.includes('物流') || industry.includes('enterprise') || industry.includes('企业')) {
        toneInstruction = '采用专业、高效的设计风格，注重信息清晰度和操作效率。';
      } else {
        toneInstruction = '采用清晰、专业、用户友好的设计风格。';
      }

      // 构建动态系统提示词（新版本：结构化提示词）
      const systemPrompt = `# Role
Senior Frontend Architect & UI/UX Expert.

你是一个专业的 React 前端开发专家，专注于 ${projectMeta.industry} 行业。

项目背景：
- 项目名称: "${projectMeta.projectName}"
- 目标用户: ${projectMeta.targetAudience}
${projectMeta.description ? `- 项目简介: ${projectMeta.description}` : ''}

# Task
Generate production-ready **React + Tailwind CSS** code based on the uploaded image.

# 核心要求

## 1. 像素级精确复刻
- **精确还原**图片中的所有UI元素，包括：
  - 布局结构：精确匹配容器层次、排列方式（Flex/Grid）
  - 颜色：精确匹配背景色、文本色、按钮色、状态标签颜色等
  - 字体：精确匹配字体大小、粗细、行高
  - 间距：精确匹配 padding、margin、gap 等间距
  - 圆角：精确匹配 rounded 类名
  - 图标和状态指示器：完整还原所有图标、状态图标
- **严格按照图片还原**：不要修改、不要规范化，完全按照图片中的样子复刻

## 2. 忽略系统UI元素
- **完全忽略**手机系统状态栏（时间、信号图标、Wi-Fi图标、电池图标等）
- **只关注应用内容**：从应用自己的导航栏、搜索栏等应用UI元素开始还原

## 3. 文本颜色（强制要求 - 必须为所有文本元素添加颜色类名）
⚠️ **关键要求：所有文本元素必须明确设置Tailwind的text-*颜色类名，不能省略！**

**错误示例（禁止）：**
- \`<div>标题</div>\` ❌ 缺少颜色类名
- \`<p className="text-sm">描述</p>\` ❌ 只有字体大小，缺少颜色
- \`<span>文本</span>\` ❌ 完全没有样式类名

**正确示例（必须）：**
- \`<div className="text-gray-900">标题</div>\` ✅ 明确指定颜色
- \`<p className="text-sm text-gray-500">描述</p>\` ✅ 同时有字体大小和颜色
- \`<span className="text-blue-600">状态</span>\` ✅ 明确指定颜色

**颜色规则（根据背景色选择）：**
- **浅色背景**（bg-white, bg-gray-50等）：
  - 主要文本（标题、重要内容）：**必须使用** \`text-gray-900\` 或 \`text-black\`
  - 次要文本（描述、元信息、日期）：**必须使用至少** \`text-gray-500\`（**严格禁止 text-gray-400 或更浅**）
  - 状态文本（蓝色/紫色/绿色）：**必须使用至少 600 级别**（如 \`text-blue-600\`, \`text-purple-600\`, \`text-green-600\`，**严格禁止 400 或更浅**）
- **深色背景**（bg-gray-900等）：
  - 主要文本：**必须使用** \`text-white\` 或 \`text-gray-50\`
  - 次要文本：**必须使用至少** \`text-gray-300\`

**检查清单：**
- [ ] 每个文本元素（div, p, span, h1-h6, label等）都必须有text-*颜色类名
- [ ] 不能依赖默认颜色，必须明确指定
- [ ] 如果图片中文本颜色较浅但可读，保持原色；如果不可读，调整为上述规则中的颜色

## 4. 文字换行控制
- 按钮/标签内的单行文字：使用 \`whitespace-nowrap\`
- 标题单行显示：使用 \`truncate\` 或调整容器宽度
- 禁止因容器宽度导致文字换行

## 5. 交互功能
- 所有按钮可点击，使用 onClick 和 useState
- 搜索框可输入，使用 useState 管理状态
- 标签可切换，使用 useState 管理激活状态
- 添加 hover 和 active 状态反馈

## 6. 技术要求
- 使用 React Hooks（useState, useEffect）
- 使用 Tailwind CSS 实现所有样式，禁止内联样式
- 使用 Lucide React 图标库（从 'lucide-react' 导入）
- 组件名称：App（function App() 或 const App = ()）
- 代码可直接运行，包含完整交互逻辑
${designSystemEnforcement}

# Output
- 只返回完整的 .tsx 代码
- 不要包含 markdown 标记、注释或说明文字`;

      // 构建用户提示词（新版本：结构化提示词）
      const defaultUserPrompt = `Analyze the uploaded image and generate production-ready React + Tailwind CSS code.

**Step 1: Classify the Image**
- Is this a high-fidelity design mockup? -> Use "Pixel-Perfect Clone" strategy.
- Is this a wireframe/sketch? -> Use "Professional Interpretation" strategy.

**Step 2: Apply Universal Rules**
- Every text element MUST have an explicit \`text-*\` color class (e.g., \`text-gray-900\`, \`text-slate-600\`).
- Headings: Use dark colors (\`text-gray-900\` / \`text-slate-800\`).
- Body text: Use medium-dark colors (\`text-gray-600\` / \`text-slate-500\`).
- NEVER use light gray text (\`text-gray-300\` or lighter) on white backgrounds.
- Look for indicator bars (colored side strips) and implement them with \`absolute\` positioning.

**Step 3: Generate Code**
- Use React Hooks (useState, useEffect) for interactivity.
- Use Tailwind CSS for all styling (NO inline styles).
- Import icons from \`lucide-react\`.
- Ignore phone system status bar elements.
- Ensure all buttons, inputs, and tabs are interactive.

Generate the complete .tsx code now.`;

      const userPrompt = input.prompt.trim() || defaultUserPrompt;
      log('💬 [generateUIFromImage] 用户提示词:', {
        promptLength: userPrompt.length,
        promptPreview: userPrompt.substring(0, 100),
      });

      // 调用 OpenAI 视觉模型生成代码
      // 获取模型配置
      const visionModel = getVisionModel(input.aiConfig);
      log(`🤖 [generateUIFromImage] 开始调用 OpenAI API (${visionModel})...`);
      log('⏱️ [generateUIFromImage] 超时设置: 360秒 (6分钟), 最大重试次数: 2次');
      const apiStartTime = Date.now();
      const result = await generateText({
        model: openaiClient(visionModel), // 使用自定义客户端，支持视觉输入
        messages: [
          {
            role: 'system',
            content: systemPrompt,
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
                image: base64Data,
              },
            ],
          },
        ],
        temperature: 0.1, // 极低温度确保严格遵循指令，实现像素级精确复刻
        maxRetries: 2, // 减少重试次数以提高响应速度
      });
      const apiDuration = Date.now() - apiStartTime;
      log(`✅ [generateUIFromImage] OpenAI API 调用完成，耗时: ${apiDuration}ms`);

      // 提取生成的代码
      let generatedCode = result.text.trim();
      log('📝 [generateUIFromImage] 原始生成结果:', {
        textLength: result.text.length,
        trimmedLength: generatedCode.length,
        preview: generatedCode.substring(0, 200),
      });

      // 清理代码：移除可能的 markdown 代码块标记
      generatedCode = generatedCode
        .replace(/^```(?:tsx|jsx|typescript|javascript)?\n?/gm, '')
        .replace(/\n?```$/gm, '')
        .trim();
      log('🧹 [generateUIFromImage] 代码清理后:', {
        cleanedLength: generatedCode.length,
        preview: generatedCode.substring(0, 200),
      });

      // 验证代码是否有效（不是空字符串）
      if (!generatedCode || generatedCode.length < 50) {
        logError('❌ [generateUIFromImage] 生成的代码太短:', {
          codeLength: generatedCode?.length || 0,
        });
        throw new Error('生成的代码太短或不完整，请重试');
      }

      // 确保代码包含 React 组件（简单验证）
      if (!generatedCode.includes('function') && !generatedCode.includes('const') && !generatedCode.includes('=>')) {
        logError('❌ [generateUIFromImage] 生成的代码不包含有效的React组件');
        throw new Error('生成的代码不包含有效的React组件');
      }

      const totalDuration = Date.now() - startTime;
      log(`🎉 [generateUIFromImage] UI代码生成成功！总耗时: ${totalDuration}ms`);
      log('📊 [generateUIFromImage] 最终代码统计:', {
        codeLength: generatedCode.length,
        hasFunction: generatedCode.includes('function'),
        hasConst: generatedCode.includes('const'),
        hasArrow: generatedCode.includes('=>'),
      });

      return {
        code: generatedCode,
      };
    } catch (error) {
      const errorDuration = Date.now() - startTime;
      logError(`❌ [generateUIFromImage] 发生错误！耗时: ${errorDuration}ms`);
      logError('❌ [generateUIFromImage] 错误详情:', error);
      
      // 改进错误消息提取
      let errorMessage = '';
      if (error instanceof Error) {
        errorMessage = error.message;
        logError('❌ [generateUIFromImage] 错误类型: Error, 消息:', errorMessage);
        if (error.stack) {
          logError('❌ [generateUIFromImage] 错误堆栈:', error.stack);
        }
      } else if (error && typeof error === 'object') {
        errorMessage = (error as any).message || (error as any).error || (error as any).msg || JSON.stringify(error);
        logError('❌ [generateUIFromImage] 错误类型: Object, 内容:', error);
      } else {
        errorMessage = String(error);
        logError('❌ [generateUIFromImage] 错误类型: Other, 值:', errorMessage);
      }
      
      // 如果是 OpenAI API 相关错误，提供更友好的提示
      if (errorMessage.includes('API key') || errorMessage.includes('OPENAI')) {
        logError('❌ [generateUIFromImage] OpenAI API 配置错误');
        throw new Error(`UI代码生成失败: OpenAI API 配置错误。请检查 .env.local 文件中的 OPENAI_API_KEY 是否正确配置`);
      }
      
      logError('❌ [generateUIFromImage] 抛出最终错误:', errorMessage);
      throw new Error(`UI代码生成失败: ${errorMessage}`);
    }
  });

const GenerateAnalysisFromCodeInputSchema = z.object({
  codeContext: z.string(),
  pageTitle: z.string().optional().describe('页面标题，用于生成功能ID前缀'),
  existingRequirements: z.array(z.string()).optional().describe('现有的需求列表，用于在原有基础上增加新内容'),
  projectMeta: z.object({
    projectName: z.string(),
    industry: z.string(),
    targetAudience: z.string(),
    description: z.string(),
    version: z.string(),
  }).optional().describe('项目画像配置，用于动态生成角色提示词'),
  aiConfig: z.object({
    visionModel: z.string().optional(),
    textModel: z.string().optional(),
  }).optional().describe('AI模型配置，如果未提供则使用环境变量或默认值'),
});

const GenerateUIFromTextInputSchema = z.object({
  prompt: z.string().describe('页面描述，用于生成UI代码'),
  nodeLabel: z.string().describe('节点名称'),
  projectMeta: z.object({
    projectName: z.string(),
    industry: z.string(),
    targetAudience: z.string(),
    description: z.string(),
    version: z.string(),
  }).optional().describe('项目画像配置'),
  themeConfig: z.any().optional().describe('UI主题配置'),
  aiConfig: z.object({
    visionModel: z.string().optional(),
    textModel: z.string().optional(),
  }).optional().describe('AI模型配置'),
});

export const generateUIFromText = createServerAction()
  .input(GenerateUIFromTextInputSchema)
  .handler(async ({ input }) => {
    const startTime = Date.now();
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    log('='.repeat(80));
    log(`🚀 [generateUIFromText] 开始处理文本生成UI请求 [${requestId}]`);
    log(`📋 [generateUIFromText] 输入参数 [${requestId}]:`, {
      promptLength: input.prompt?.length || 0,
      nodeLabel: input.nodeLabel,
      hasPrompt: !!input.prompt,
      timestamp: new Date().toISOString(),
    });
    log('='.repeat(80));

    try {
      // 检查环境变量
      if (!process.env.OPENAI_API_KEY) {
        logError('❌ [generateUIFromText] OPENAI_API_KEY 未配置');
        throw new Error('OPENAI_API_KEY 未配置。请在 .env.local 文件中添加 OPENAI_API_KEY=your_api_key');
      }

      // 获取项目画像配置
      const projectMeta = input.projectMeta || {
        projectName: '未命名项目',
        industry: 'General Internet',
        targetAudience: 'General Users',
        description: '',
        version: '1.0.0',
      };

      // 根据行业动态调整设计风格
      let toneInstruction = '';
      const industry = projectMeta.industry.toLowerCase();
      if (industry.includes('finance') || industry.includes('fintech') || industry.includes('healthcare') || industry.includes('医疗')) {
        toneInstruction = '采用严谨、正式的设计风格，注重数据准确性和安全性。';
      } else if (industry.includes('gaming') || industry.includes('游戏') || industry.includes('social') || industry.includes('社交')) {
        toneInstruction = '采用生动、富有创意的设计风格，注重用户体验和视觉吸引力。';
      } else if (industry.includes('logistics') || industry.includes('物流') || industry.includes('enterprise') || industry.includes('企业')) {
        toneInstruction = '采用专业、高效的设计风格，注重信息清晰度和操作效率。';
      } else {
        toneInstruction = '采用清晰、专业、用户友好的设计风格。';
      }

      // 构建设计系统约束（如果提供了主题配置）
      let designSystemEnforcement = '';
      if (input.themeConfig) {
        const theme = input.themeConfig;
        const isDarkBackground = theme.colors?.background?.dark?.includes('slate-9') || 
                                 theme.colors?.background?.dark?.includes('zinc-9') ||
                                 theme.colors?.background?.dark?.includes('gray-9');
        
        designSystemEnforcement = `

[DESIGN SYSTEM ENFORCEMENT]
你必须严格遵循以下设计配置（优先级高于默认 Tailwind 选择）：
- 主色调：使用 bg-${theme.colors?.primary || 'blue-500'} 和 text-${theme.colors?.primary || 'blue-500'}
- 次要色调：使用 bg-${theme.colors?.secondary || 'purple-500'} 和 text-${theme.colors?.secondary || 'purple-500'}
- 背景色：使用 bg-${theme.colors?.background?.dark || 'slate-900'}
- 表面色：使用 bg-${theme.colors?.surface || 'slate-800'}
- 主要文本：使用 text-${theme.colors?.text?.primary || 'slate-50'}
- 次要文本：使用 text-${theme.colors?.text?.secondary || 'slate-400'}
- 边框色：使用 border-${theme.colors?.border || 'slate-700'}
- 圆角：所有按钮、卡片、输入框必须使用 ${theme.shape?.borderRadius?.md || 'rounded-md'}
- 按钮阴影：使用 ${theme.shadows?.buttonShadow || 'shadow-md'}
- 卡片阴影：使用 ${theme.shadows?.cardShadow || 'shadow-lg'}
- 密度：${theme.typography?.density === 'compact' ? '使用紧凑间距（p-2, gap-2）' : theme.typography?.density === 'spacious' ? '使用宽松间距（p-6, gap-6）' : '使用正常间距（p-4, gap-4）'}
${isDarkBackground ? '- 注意：背景是深色，确保所有文本使用浅色类（text-white, text-gray-200, text-slate-50等）' : ''}
- 风格描述：${theme.vibe || 'Modern Professional'}

重要：这些设计令牌必须严格应用，不要使用其他颜色或样式。`;
      }

      // 构建系统提示词
      const systemPrompt = `# Role
Senior Frontend Architect & UI/UX Expert

你是一个专业的 React 前端开发专家，专注于 ${projectMeta.industry} 行业。

项目背景：
- 项目名称: "${projectMeta.projectName}"
- 目标用户: ${projectMeta.targetAudience}
${projectMeta.description ? `- 项目简介: ${projectMeta.description}` : ''}

# Task
Generate production-ready **React + Tailwind CSS** code based on the page description.

# 核心要求

## 1. 基于描述生成UI
- **理解需求**：仔细分析页面描述，理解页面的核心功能和用户场景
- **设计UI结构**：根据描述设计合理的页面布局和UI组件
- **实现交互**：为所有可交互元素添加完整的状态管理和事件处理
- **语言要求**：**所有文本内容必须使用中文**，包括按钮文字、标签、提示信息等（除非用户明确要求英文）

## 2. 背景色和文本颜色（强制要求）

⚠️ **关键要求：**
1. **默认背景色必须是白色**：最外层容器必须使用 \`bg-white\` 或 \`bg-gray-50\`
2. **所有文本元素必须明确设置Tailwind的text-*颜色类名，不能省略！**

**背景色规则（强制要求）：**
- **最外层容器（App组件的根div）**：**必须使用** \`bg-white\`（**禁止使用** \`bg-gray-50\`、\`bg-gray-100\` 或其他非白色背景）
- **卡片、面板等容器**：**必须使用** \`bg-white\`（**禁止使用**深色背景如 \`bg-gray-900\`、\`bg-slate-900\`、\`bg-zinc-900\`、\`bg-blue-900\`、\`bg-purple-900\` 等）
- **严格禁止使用深色背景**：除非用户**明确要求**深色主题，否则**所有背景必须是白色**（\`bg-white\`）
- **错误示例（禁止）：**
  - ❌ \`<div className="bg-gray-900">...</div>\` - 深色背景
  - ❌ \`<div className="bg-slate-800">...</div>\` - 深色背景
  - ❌ \`<div className="bg-blue-900">...</div>\` - 深色背景
- **正确示例（必须）：**
  - ✅ \`<div className="bg-white">...</div>\` - 白色背景

**文本颜色规则（基于白色背景）：**
- **主要文本（标题、重要内容）**：**必须使用** \`text-gray-900\` 或 \`text-black\`
- **次要文本（描述、辅助信息）**：**必须使用至少** \`text-gray-600\` 或 \`text-slate-600\`（**严格禁止 text-gray-400、text-gray-300、text-gray-200、text-gray-100、text-white 或更浅**）
- **状态文本（蓝色/紫色/绿色）**：**必须使用至少 600 级别**（如 \`text-blue-600\`、\`text-purple-600\`、\`text-green-600\`，**严格禁止 400、300、200、100 或更浅**）
- **禁用文本**：可以使用 \`text-gray-400\` 或 \`text-gray-500\`（但仅用于禁用状态）
- **严格禁止**在白色背景上使用以下颜色（会导致不可见或难以阅读）：
  - ❌ \`text-white\` - 完全不可见
  - ❌ \`text-gray-100\` - 几乎不可见
  - ❌ \`text-gray-200\` - 几乎不可见
  - ❌ \`text-gray-300\` - 难以阅读
  - ❌ \`text-gray-400\` - 仅用于禁用状态，不能用于正常文本
  - ❌ \`text-blue-400\`、\`text-purple-400\`、\`text-green-400\` 等浅色状态文本

**检查清单（必须全部满足）：**
- [ ] 最外层容器有 \`bg-white\` 或 \`bg-gray-50\`（默认白色背景）
- [ ] 每个文本元素都有明确的 text-* 颜色类名
- [ ] 所有正常文本颜色在白色背景上清晰可见（至少 text-gray-600 或更深）
- [ ] **没有使用** text-white、text-gray-100、text-gray-200、text-gray-300 在白色背景上
- [ ] **没有使用** text-gray-400 用于正常文本（仅可用于禁用状态）
- [ ] **没有使用** text-blue-400、text-purple-400 等浅色状态文本（必须使用 600 或更深）

**常见错误示例（禁止）：**
- ❌ \`<div className="bg-white"><p className="text-white">标题</p></div>\` - 白色文字在白色背景上不可见
- ❌ \`<div className="bg-white"><span className="text-gray-300">描述</span></div>\` - 浅灰色文字在白色背景上难以阅读
- ❌ \`<div className="bg-white"><button className="text-blue-400">按钮</button></div>\` - 浅蓝色文字在白色背景上不够清晰

**正确示例（必须）：**
- ✅ \`<div className="bg-white"><p className="text-gray-900">标题</p></div>\` - 深色文字在白色背景上清晰可见
- ✅ \`<div className="bg-white"><span className="text-gray-600">描述</span></div>\` - 中等深色文字在白色背景上清晰可见
- ✅ \`<div className="bg-white"><button className="text-blue-600">按钮</button></div>\` - 深色状态文字在白色背景上清晰可见

## 3. 响应式设计（移动端优先）

⚠️ **关键要求：移动端布局约束**

- **默认生成移动端UI**：优先考虑移动端体验，使用移动端友好的布局
- **容器宽度**：**必须使用** \`w-full\`（不要使用 \`max-w-md\` 或其他限制宽度的类，确保内容不超出屏幕）
- **防止内容溢出**：
  - 最外层容器：**必须使用** \`w-full overflow-x-hidden\` 防止横向滚动
  - 所有容器：**禁止使用**固定宽度（如 \`w-[500px]\`）或超出屏幕的宽度
  - 文本容器：使用 \`break-words\` 或 \`truncate\` 防止文本溢出
  - 列表和卡片：使用 \`w-full\` 确保不超出屏幕宽度
- **间距**：使用移动端友好的间距（\`p-4\`, \`gap-4\` 等），避免过大的 padding 导致内容被挤压
- **字体大小**：使用移动端友好的字体大小（标题 \`text-2xl\` 或 \`text-3xl\`，正文 \`text-base\` 或 \`text-sm\`）
- **触摸目标**：按钮和交互元素至少 \`min-h-[44px]\`（移动端触摸标准）
- **垂直布局**：优先使用垂直布局（\`flex-col\`），避免横向布局导致内容超出屏幕
- **如果用户明确要求PC端UI**：可以使用更宽的布局（\`max-w-4xl\` 或 \`max-w-6xl\`），更大的字体和间距

**检查清单：**
- [ ] 最外层容器使用 \`w-full overflow-x-hidden\`
- [ ] 没有使用固定宽度（如 \`w-[500px]\`）
- [ ] 所有文本容器有 \`break-words\` 或适当的文本处理
- [ ] 内容在移动端屏幕（375px宽度）内完整显示，不超出屏幕

## 4. 代码要求
- 使用 React Hooks（useState, useEffect, useMemo, useCallback）进行状态管理
- 使用 Tailwind CSS 实现所有样式，禁止内联样式
- 使用 Lucide React 图标库（从 'lucide-react' 导入）添加合适的图标
- 所有按钮、输入框、链接等交互元素必须可交互
- 添加 hover 和 active 状态的视觉反馈
- 组件名称必须是 App（function App() 或 const App = ()）
- 代码必须可直接运行，包含完整的交互逻辑

## 5. 语言和内容要求

⚠️ **关键要求：中文内容**

- **所有文本内容必须使用中文**：
  - 按钮文字：使用中文（如"搜索"、"保存"、"创建"等）
  - 标签和分类：使用中文（如"技术"、"设计"、"产品"等）
  - 提示信息：使用中文（如"暂无结果"、"加载中"等）
  - 标题和描述：使用中文
  - **禁止使用英文**：除非用户明确要求英文内容，否则所有文本必须是中文
- **示例：**
  - ❌ "Search items" → ✅ "搜索项目"
  - ❌ "Create" → ✅ "创建"
  - ❌ "No results found" → ✅ "暂无结果"
  - ❌ "Save" → ✅ "保存"
  - ❌ "Filter" → ✅ "筛选"

## 6. 设计风格
${toneInstruction}
- 使用现代化的UI设计模式
- 确保响应式设计（移动端优先）
- 使用合适的间距、圆角、阴影等视觉元素
${designSystemEnforcement}

# Output
- Return **ONLY** the full \`.tsx\` code.
- Ensure all icons are imported from \`lucide-react\`.
- 不要包含 \`\`\`tsx 或 \`\`\`jsx 等markdown标记
- 不要包含任何注释或说明文字`;

      // 构建用户提示词
      const userPrompt = input.prompt.trim() || `请为"${input.nodeLabel}"页面生成完整的React组件代码。

要求：
1. 根据页面名称和描述，设计合理的UI布局
2. 实现所有必要的交互功能
3. 使用现代化的设计风格
4. 确保代码可以直接运行
5. **必须使用白色背景**（\`bg-white\`），禁止使用深色背景
6. **所有文本内容必须使用中文**，包括按钮、标签、提示信息等
7. **确保内容在移动端屏幕内完整显示，不超出屏幕范围**（使用 \`w-full overflow-x-hidden\`）`;

      // 获取模型配置
      const textModel = getTextModel(input.aiConfig);
      log(`🤖 [generateUIFromText] 使用模型: ${textModel}`);
      
      const apiStartTime = Date.now();
      const result = await generateText({
        model: openaiClient(textModel),
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        temperature: 0.5,
        maxRetries: 3,
      });
      const apiDuration = Date.now() - apiStartTime;
      log(`✅ [generateUIFromText] OpenAI API 调用完成，耗时: ${apiDuration}ms`);

      // 提取生成的代码
      let generatedCode = result.text.trim();
      log('📝 [generateUIFromText] 原始生成结果:', {
        textLength: result.text.length,
        trimmedLength: generatedCode.length,
        preview: generatedCode.substring(0, 200),
      });

      // 清理代码：移除可能的 markdown 代码块标记
      generatedCode = generatedCode
        .replace(/^```(?:tsx|jsx|typescript|javascript)?\n?/gm, '')
        .replace(/\n?```$/gm, '')
        .trim();
      log('🧹 [generateUIFromText] 代码清理后:', {
        cleanedLength: generatedCode.length,
        preview: generatedCode.substring(0, 200),
      });

      // 验证代码是否有效
      if (!generatedCode || generatedCode.length < 50) {
        logError('❌ [generateUIFromText] 生成的代码太短:', {
          codeLength: generatedCode?.length || 0,
        });
        throw new Error('生成的代码太短或不完整，请重试');
      }

      // 确保代码包含 React 组件
      if (!generatedCode.includes('function') && !generatedCode.includes('const') && !generatedCode.includes('=>')) {
        logError('❌ [generateUIFromText] 生成的代码不包含有效的React组件');
        throw new Error('生成的代码不包含有效的React组件');
      }

      const totalDuration = Date.now() - startTime;
      log(`🎉 [generateUIFromText] UI代码生成成功！总耗时: ${totalDuration}ms`);
      log('📊 [generateUIFromText] 最终代码统计:', {
        codeLength: generatedCode.length,
        hasFunction: generatedCode.includes('function'),
        hasConst: generatedCode.includes('const'),
        hasArrow: generatedCode.includes('=>'),
      });

      return {
        code: generatedCode,
      };
    } catch (error) {
      const errorDuration = Date.now() - startTime;
      logError(`❌ [generateUIFromText] 发生错误！耗时: ${errorDuration}ms`);
      logError('❌ [generateUIFromText] 错误详情:', error);
      
      let errorMessage = '';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object') {
        errorMessage = (error as any).message || (error as any).error || (error as any).msg || JSON.stringify(error);
      } else {
        errorMessage = String(error);
      }
      
      if (errorMessage.includes('API key') || errorMessage.includes('OPENAI')) {
        throw new Error(`UI代码生成失败: OpenAI API 配置错误。请检查 .env.local 文件中的 OPENAI_API_KEY 是否正确配置`);
      }
      
      throw new Error(`UI代码生成失败: ${errorMessage}`);
    }
});

export const generateAnalysisFromCode = createServerAction()
  .input(GenerateAnalysisFromCodeInputSchema)
  .handler(async ({ input }) => {
    try {
      // 检查环境变量
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY 未配置。请在 .env.local 文件中添加 OPENAI_API_KEY=your_api_key');
      }

      // 获取页面标题，用于生成功能ID前缀
      const pageTitle = input.pageTitle || '';
      
      // 构建功能ID前缀说明
      let functionIdPrefixInstruction = '';
      let functionIdExample = '';
      if (pageTitle) {
        functionIdPrefixInstruction = `功能ID前缀规则：根据页面标题"${pageTitle}"的所有首字母生成前缀。
- 如果是中文标题，提取每个字的拼音首字母（例如："指令流" -> "ZLL"，"用户中心" -> "YZZX"，"首页" -> "SY"）
- 如果是英文标题，提取每个单词的首字母（例如："User Center" -> "UC"，"Home Page" -> "HP"）
- 如果是中英文混合，优先使用中文拼音首字母，然后加上英文首字母
- 功能ID格式：{前缀}{三位数字序号}，例如：ZLL001, ZLL002, ZLL003...`;
        functionIdExample = `页面标题"${pageTitle}"的所有首字母001开始递增（例如："指令流" -> ZLL001, ZLL002, ZLL003...）`;
      } else {
        functionIdPrefixInstruction = `功能ID格式：F001, F002, F003...（默认使用F作为前缀）`;
        functionIdExample = 'F001开始递增（F001, F002, F003...）';
      }

      // 构建系统提示词
      const systemPrompt = `# Role
Product Manager (Client-Facing)

你是一个专业的产品经理，面向客户和业务团队。你的任务是根据React组件代码，生成或更新结构化的业务需求规格表（PRD）。

# Task
Generate a **Business Requirement Specification Table** based on the provided UI Code.

# Input
React/Tailwind Code (JSX).

# Output Format (Strict Markdown Table)
| 功能ID | UI区域 | 元素名称 | 功能说明 | 展示规范 |
| :--- | :--- | :--- | :--- | :--- |

# Content Filling Rules

## Column 4: 功能说明 (Function Description)
**Focus**: What is the **Purpose** or **Interaction** of this element?
- **Case A: Interactive Elements (Buttons, Inputs)**
  - Describe the user action and system response.
  - *Example*: "点击后跳转至详情页。" or "支持输入关键词进行模糊搜索。"
- **Case B: Read-Only Elements (Labels, Titles, Status)**
  - Describe the **Business Purpose** (What info does it convey?).
  - *Example*: "用于展示当前指令的流转状态。" or "标识该指令的来源渠道。"
  - **Do NOT** write "No interaction" or "None" or "无交互". Always define its purpose.

## Column 5: 展示规范 (Display Specs)
**Focus**: Visual Style, Formats, and Defaults.
- **Visuals (Use Emojis)**:
  - Colors: Use emojis (🟢, 🔴, 🔵, 🟣, ⚪️) based on Tailwind classes.
    - \`bg-red-100\` / \`text-red-500\` -> 🔴 警示/高亮
    - \`bg-green-100\` / \`text-green-500\` -> 🟢 成功/进行中
    - \`bg-blue-500\` / \`text-blue-500\` -> 🔵 信息/链接
    - \`bg-purple-600\` / \`text-purple-600\` -> 🟣 品牌色/强调色
    - \`text-gray-400\` / \`text-slate-400\` -> ⚪️ 次要信息/置灰
    - \`rounded-full\` -> 💊 胶囊样式
    - \`rounded-lg\` -> 📦 圆角卡片
  - Icons: Describe logically (e.g., "🔍 搜索图标", "⬅️ 返回箭头", "🌍 地球图标").
- **Data Formats**:
  - Time: "YYYY-MM-DD HH:mm" or "YYYY-MM-DD HH:mm:ss"
  - Currency: "¥0.00"
  - Date: "YYYY年MM月DD日"
- **Defaults & States**:
  - "默认为空" or "超出一行显示省略号(...)" or "默认占位文本：xxx"

# Extraction Rules (Code-to-Business Translation)

## 1. Analyze the Code Structure
- **Identify Zones**: Map DOM depth to "UI区域" (e.g., \`<Header>\` -> 顶部导航, \`.map()\` list -> 列表区).
- **Identify Elements**: Translate component names to business terms (e.g., \`<Input>\` -> 搜索框).

# Example Rows
| ZLL001 | 顶部导航 | 返回按钮 | 点击后返回上一级页面。 | ⬅️ 黑色图标；位于左上角。 |
| ZLL002 | 列表区 | 状态标签 | 用于标识指令处理进度。 | 1. 样式规则：<br>   - 🟢 进行中 (绿色)<br>   - ⚪️ 已结束 (灰色)<br>2. 默认显示：进行中 |
| ZLL003 | 列表卡片 | 发布时间 | 展示指令的创建或发布时间，辅助用户判断时效性。 | 格式：YYYY-MM-DD HH:mm:ss |

# Feature ID Logic
${functionIdPrefixInstruction}

# Tone
Professional, non-technical. Make it look like a manual, not a code comment. Use business language that clients and non-technical stakeholders can understand.

# Additional Requirements
- **所有内容必须使用中文**，确保非技术人员也能轻松理解
- **易读性要求**：
   - 功能描述要清晰具体，避免技术术语，使用通俗易懂的语言
   - 交互逻辑要说明用户操作和系统响应
  - 展示规范要说明视觉样式、默认状态、占位文本等
   - 每个功能点独立一行，便于阅读和追踪
- **分析要求**：
   - 仔细分析代码中的所有UI元素、交互逻辑、状态管理
   - 识别所有可交互的组件（按钮、输入框、卡片、菜单等）
  - 识别所有只读元素（标题、标签、状态指示器等）
  - 识别所有视觉样式和默认状态
- **如果提供了现有需求**，必须在保持原有表格格式和内容的基础上，补充新增的需求`;

      // 构建用户提示词
      const hasExistingRequirements = input.existingRequirements && input.existingRequirements.length > 0;
      const existingRequirementsText = hasExistingRequirements 
        ? `\n\n**现有需求文档（必须完全保留，不要修改或删除）：**\n${input.existingRequirements.join('\n')}\n\n**更新要求：**\n1. 必须完全保留上述现有需求表格的所有行和内容\n2. 在此基础上，分析代码并补充新增的功能点到表格中\n3. 如果现有需求使用表格格式，新增需求也必须使用相同的表格格式和列结构\n4. 新增行的功能ID要延续现有编号规则：${pageTitle ? `如果现有表格中最后一行功能ID是某个前缀（如ZLL005），新增的从该前缀的下一号开始（如ZLL006）` : '如果现有表格中最后一行功能ID是F005，新增的从F006开始'}\n5. 如果现有需求是表格格式，保持表格格式；如果是列表格式，也保持列表格式\n6. 只返回完整的需求文档（包含原有内容和新增内容），不要包含其他说明文字`
        : '';

      const userPrompt = `请分析以下React组件代码，${hasExistingRequirements ? '更新（保留原有内容并补充新内容）' : '生成'}产品需求文档：

\`\`\`tsx
${input.codeContext}
\`\`\`
${existingRequirementsText}

${!hasExistingRequirements ? `**输出要求：**
1. 必须使用Markdown表格格式，表格结构如下（严格遵循）：

| 功能ID | UI区域 | 元素名称 | 功能说明 | 展示规范 |
|--------|--------|----------|----------|----------|

2. 分析代码中的所有功能点和UI元素，为每个功能点创建一行表格
3. 功能ID从${functionIdExample}
4. 所有描述使用中文，确保易读易懂，使用业务语言而非技术术语

5. **功能说明列（Column 4）**要详细说明：
   - **交互元素（按钮、输入框、链接等）**：描述用户操作和系统响应
     - 示例："点击后跳转至详情页。"、"支持输入关键词进行模糊搜索。"
   - **只读元素（标题、标签、状态指示器等）**：描述业务目的（传达什么信息）
     - 示例："用于展示当前指令的流转状态。"、"标识该指令的来源渠道。"
     - **禁止**说"无交互"、"No interaction"、"None"

6. **展示规范列（Column 5）**要说明：
   - **视觉样式（使用Emoji）**：
     - 颜色：🟢 成功/进行中、🔴 警示/高亮、🔵 信息/链接、🟣 品牌色/强调色、⚪️ 次要信息/置灰
     - 样式：💊 胶囊样式、📦 圆角卡片
     - 图标：🔍 搜索图标、⬅️ 返回箭头、🌍 地球图标等
   - **数据格式**：
     - 时间："YYYY-MM-DD HH:mm" 或 "YYYY-MM-DD HH:mm:ss"
     - 货币："¥0.00"
     - 日期："YYYY年MM月DD日"
   - **默认状态和规则**：
     - "默认为空"、"超出一行显示省略号(...)"、"默认占位文本：xxx"
     - 展示规则（如：最多显示10条记录、空数据时显示"暂无数据"等）
   - **注意**：不要写技术术语如"字符串类型"、"数组类型"、"API"、"useState"等

7. **示例行格式**：
| ZLL001 | 顶部导航 | 返回按钮 | 点击后返回上一级页面。 | ⬅️ 黑色图标；位于左上角。 |
| ZLL002 | 列表区 | 状态标签 | 用于标识指令处理进度。 | 1. 样式规则：<br>   - 🟢 进行中 (绿色)<br>   - ⚪️ 已结束 (灰色)<br>2. 默认显示：进行中 |
| ZLL003 | 列表卡片 | 发布时间 | 展示指令的创建或发布时间，辅助用户判断时效性。 | 格式：YYYY-MM-DD HH:mm:ss |

8. 只返回Markdown表格，不要包含标题、说明文字或其他内容` : ''}`;

      // 获取模型配置
      const textModel = getTextModel(input.aiConfig);
      // 调用 OpenAI 生成 PRD
      const result = await generateText({
        model: openaiClient(textModel), // 使用自定义客户端
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        temperature: 0.5,
      });

      // 提取生成的 Markdown
      let markdown = result.text.trim();

      // 清理 Markdown（移除可能的代码块标记）
      markdown = markdown
        .replace(/^```(?:markdown)?\n?/gm, '')
        .replace(/\n?```$/gm, '')
        .trim();

      // 验证生成的文档是否有效
      if (!markdown || markdown.length < 20) {
        throw new Error('生成的PRD文档太短或不完整');
      }

      return {
        markdown,
      };
    } catch (error) {
      logError('❌ [generateAnalysisFromCode] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'PRD生成失败，请检查API配置和网络连接';
      throw new Error(`PRD文档生成失败: ${errorMessage}`);
    }
  });

const UpdateNodeArtifactsInputSchema = z.object({
  nodeId: z.string(),
  nodeTitle: z.string().optional(),
  userPrompt: z.string().optional(),
  currentArtifacts: z.any().optional(),
  attachments: z.array(z.any()).optional(),
  });

export const updateNodeArtifacts = createServerAction()
  .input(UpdateNodeArtifactsInputSchema)
  .handler(async ({ input }) => {
    // TODO: 实现更新节点逻辑
    return {
      view: { code: '' },
      spec: { title: '', requirements: [] },
      impl: { apiEndpoints: [], dbSchema: '' },
      test: { cases: [] },
    };
  });