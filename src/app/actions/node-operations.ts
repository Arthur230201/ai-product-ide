'use server';

import { createServerAction } from 'zsa';
import { z } from 'zod';
import { createOpenAI, openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { log, logError } from '@/lib/logger';
import { getVisionModel, getTextModel } from '@/lib/ai-config';

// 创建自定义 OpenAI 客户端，通过自定义 fetch 增加超时时间
const openaiClient = createOpenAI({
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
      model: openai(textModel),
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

      // 构建动态系统提示词（基于项目画像）
      const systemPrompt = `你是一个专业的 React 前端开发专家，专注于 ${projectMeta.industry} 行业。

项目背景：
- 项目名称: "${projectMeta.projectName}"
- 目标用户: ${projectMeta.targetAudience}
- 项目简介: ${projectMeta.description || '未指定'}

你的任务是根据用户提供的UI截图，生成完全可交互的 React + Tailwind CSS 组件代码。

# 精确复刻模式 (Pixel-Perfect Recreation Mode)
**核心原则：精确还原图片中的所有视觉细节和布局结构**

## 输入理解
将上传的图片视为**精确的设计规范**，你的目标是**像素级精确复刻**，包括：
- 所有UI元素的精确位置和尺寸
- 所有颜色、字体大小、间距的精确还原
- 所有图标、状态指示器、标签的完整还原
- 所有布局层次和视觉层次的准确还原

## 必须精确还原的元素

### 1. 导航栏和头部区域
- **顶部状态栏**：如果图片包含状态栏（时间、信号、电池等），必须完整还原
- **导航栏**：精确还原左侧返回按钮、中间标题、右侧操作按钮的布局和样式
- **搜索栏和筛选器**：完整还原搜索框、占位符文本、筛选按钮的位置和样式

### 2. 标签栏和分类
- **标签列表**：完整还原所有分类标签（如"全部指令"、"创意落地"等）
- **激活状态**：精确还原当前激活标签的视觉样式（下划线、颜色变化等）
- **标签间距和布局**：使用 flex 或 grid 精确还原标签的排列方式

### 3. 列表项和卡片
- **列表结构**：完整还原每个列表项的完整结构，包括：
  - 任务类型标签（如"转发推送"、"创意落地"等）
  - 任务标题（包括书名号等特殊字符）
  - 状态标签（"已完成"、"进行中"等）及其颜色
  - 负责人信息和发布时间
  - 平台/渠道列表及其状态图标（✓、时钟图标等）
  - 操作按钮（如"催办"按钮）
- **视觉层次**：精确还原文本大小、颜色、粗细的层次关系
- **间距和对齐**：精确还原元素之间的间距和对齐方式

### 4. 状态指示器和图标
- **状态标签**：完整还原所有状态标签（已完成、进行中等）及其颜色
- **图标**：使用 Lucide React 图标库精确还原所有图标（搜索、筛选、用户、平台等）
- **状态图标**：完整还原完成状态图标（✓）和待处理图标（时钟等）

### 5. 颜色和样式
- **精确颜色匹配**：仔细识别图片中的颜色，使用最接近的 Tailwind 颜色类
- **背景色**：精确还原页面背景色、卡片背景色
- **文本颜色**：精确还原标题、正文、辅助文本的颜色层次
- **按钮颜色**：精确还原按钮的背景色、文字颜色、边框颜色

## 布局结构精确还原
- **整体布局**：识别并精确还原页面的整体布局结构（移动端单列、桌面端多列等）
- **容器宽度**：精确还原内容区域的宽度和边距
- **滚动区域**：如果图片显示滚动列表，确保列表可以滚动

## 严格 Tailwind 使用约束
- **禁止**：永远不要使用内联样式进行定位
- **必须**：使用 Tailwind 的布局系统（flex, grid, gap-*, p-*, m-*）
- **精确间距**：仔细测量图片中的间距，使用最接近的 Tailwind 间距类（p-2, p-3, p-4, gap-2, gap-3, gap-4等）
- **响应式**：如果是移动端UI，使用移动端优先的 Tailwind 类名

## 交互功能要求
1. **完整还原所有UI元素**：
   - 导航栏（返回按钮、标题、操作按钮）
   - 搜索栏和筛选器
   - 分类标签栏
   - 列表项（包括所有子元素：类型标签、标题、状态、负责人、平台列表、操作按钮等）
   - 所有图标和状态指示器

2. **所有元素必须完全可交互**：
   - **导航按钮**：返回按钮、新增按钮等必须使用onClick事件处理器
   - **搜索框**：使用useState管理搜索关键词，实现实时搜索
   - **筛选器**：点击可切换排序方式，使用useState管理排序状态
   - **分类标签**：点击可切换分类，使用useState管理当前激活的标签，精确还原激活状态的视觉样式
   - **列表项**：点击可展开详情（如果有展开功能），使用useState管理展开状态
   - **操作按钮**：如"催办"按钮，必须使用onClick事件处理器
   - **所有按钮**：添加hover和active状态的视觉反馈（hover:bg-opacity-80, active:scale-95等）

3. **必须使用React Hooks进行状态管理**：
   - useState：管理搜索关键词、当前分类、展开状态、排序方式等
   - useEffect：处理数据加载、筛选逻辑等副作用

4. **数据展示**：
   - 使用示例数据完整还原图片中显示的所有内容
   - 确保数据格式和展示方式与图片完全一致
   - 状态标签的颜色必须与图片一致（已完成=绿色，进行中=蓝色等）

5. **样式精确还原**：
   - 使用Tailwind CSS实现所有样式，禁止内联样式
   - 精确匹配图片中的颜色、字体大小、间距、圆角等
   - 使用Lucide React图标库（从'lucide-react'导入）还原所有图标

6. **代码要求**：
   - 代码必须可直接运行
   - 包含完整的交互逻辑和状态管理
   - 如果是移动端UI，使用移动端优先的响应式设计
   - 组件名称必须是 App（function App() 或 const App = ()）
   - 只返回代码，不要包含任何解释文字、markdown标记或注释${designSystemEnforcement}

输出格式要求：
- 直接输出 React 组件代码
- 不要包含 \`\`\`tsx 或 \`\`\`jsx 等markdown标记
- 不要包含任何注释或说明文字`;

      // 构建用户提示词（结合用户输入和默认提示）
      const defaultUserPrompt = `请精确复刻这张UI截图，生成完全可交互的React组件代码。

**重要要求：**
1. **精确还原**：必须完整还原图片中的所有UI元素，包括：
   - 顶部导航栏（返回按钮、标题、操作按钮）
   - 搜索栏和筛选器
   - 分类标签栏（包括激活状态的视觉样式）
   - 列表项的所有细节（类型标签、标题、状态标签、负责人信息、平台列表、操作按钮等）
   - 所有图标和状态指示器

2. **视觉精确匹配**：
   - 精确匹配所有颜色（背景色、文本色、按钮色、状态标签颜色等）
   - 精确匹配字体大小和粗细层次
   - 精确匹配间距和对齐方式
   - 精确匹配圆角和阴影效果

3. **布局结构**：
   - 完整还原页面的整体布局结构
   - 精确还原每个元素的相对位置和尺寸
   - 如果是移动端UI，确保使用移动端优先的布局

4. **交互功能**：
   - 所有按钮必须可点击
   - 搜索框必须可输入
   - 分类标签必须可切换（并精确还原激活状态的视觉样式）
   - 列表项如果有展开功能，必须实现展开/收起

5. **数据展示**：
   - 使用示例数据完整还原图片中显示的所有内容
   - 确保数据格式和展示方式与图片完全一致`;

      const userPrompt = input.prompt.trim() || defaultUserPrompt;
      log('💬 [generateUIFromImage] 用户提示词:', {
        promptLength: userPrompt.length,
        promptPreview: userPrompt.substring(0, 100),
      });

      // 调用 OpenAI 视觉模型生成代码
      // 获取模型配置
      const visionModel = getVisionModel(input.aiConfig);
      log(`🤖 [generateUIFromImage] 开始调用 OpenAI API (${visionModel})...`);
      log('⏱️ [generateUIFromImage] 超时设置: 360秒 (6分钟), 最大重试次数: 3次');
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
        temperature: 0.3, // 较低的温度以确保代码生成的稳定性和准确性
        maxRetries: 3, // 最多重试 3 次
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
      const systemPrompt = `你是一个专业的产品需求分析师。你的任务是根据React组件代码，生成或更新结构化的产品需求文档（PRD）。

核心要求：
1. **必须使用Markdown表格格式输出**，表格包含以下列：
   - 功能ID：唯一标识符（格式：{前缀}{序号}，如 ZLL001, ZLL002, ZLL003...）
   - UI区域：组件所在的页面区域（如：顶部导航、主要内容区、侧边栏、底部等）
   - 组件名称：具体的UI组件名称（如：导航栏、搜索框、产品卡片、按钮等）
   - 功能/逻辑：详细描述组件的功能、交互逻辑、状态管理方式（使用useState、useEffect等）
   - 数据规则：描述数据的显示规则、业务规则、格式要求等（例如：价格显示格式、日期显示格式、数据来源说明、展示数量限制等，不要涉及技术实现细节如数据类型、API结构等）

2. **所有内容必须使用中文**，确保非技术人员也能轻松理解

3. **易读性要求**：
   - 功能描述要清晰具体，避免技术术语，使用通俗易懂的语言
   - 交互逻辑要说明用户操作和系统响应
   - 数据规则要说明数据的显示格式、业务规则、来源等（如：价格显示为"¥99.00"格式，日期显示为"2024-01-01"，最多显示10条记录等）
   - 每个功能点独立一行，便于阅读和追踪

4. **分析要求**：
   - 仔细分析代码中的所有UI元素、交互逻辑、状态管理
   - 识别所有可交互的组件（按钮、输入框、卡片、菜单等）
   - 识别所有状态管理（useState、useEffect等）
   - 识别所有数据结构和数据流

5. ${functionIdPrefixInstruction}

6. **如果提供了现有需求**，必须在保持原有表格格式和内容的基础上，补充新增的需求`;

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
1. 必须使用Markdown表格格式，表格结构如下：

| 功能ID | UI区域 | 组件名称 | 功能/逻辑 | 数据规则 |
|--------|--------|----------|-----------|----------|

2. 分析代码中的所有功能点和UI元素，为每个功能点创建一行表格
3. 功能ID从${functionIdExample}
4. 所有描述使用中文，确保易读易懂
5. 功能/逻辑列要详细说明：
   - 组件的具体功能
   - 用户的交互操作（点击、输入、悬停等）
   - 系统的响应（状态变化、页面跳转、数据更新等）
   - 使用的React Hooks（useState、useEffect等）
6. 数据规则列要说明显示规则和业务规则（不要涉及技术实现细节）：
   - 数据展示格式（如：价格显示为"¥99.00"，日期显示为"2024年1月1日"，百分比显示为"50%"等）
   - 数据来源说明（如：来自用户个人中心、来自商品列表、用户手动输入等）
   - 展示规则（如：最多显示10条记录、超出部分显示"更多..."、空数据时显示"暂无数据"等）
   - 业务规则（如：仅显示已发布的内容、仅显示当前用户的数据、按创建时间倒序排列等）
   - 注意：不要写技术术语如"字符串类型"、"数组类型"、"API"、"useState"等
7. 只返回Markdown表格，不要包含标题、说明文字或其他内容` : ''}`;

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