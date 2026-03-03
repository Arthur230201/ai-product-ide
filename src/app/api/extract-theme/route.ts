import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { log, logError } from '@/lib/logger';
import { getVisionModel } from '@/lib/ai-config';
import type { UIThemeConfig } from '@/types/theme';

/**
 * UI Theme 提取 Schema - 严格匹配 UIThemeConfig 结构
 */
const UIThemeConfigSchema = z.object({
  colors: z.object({
    primary: z.string().describe('主色调（Tailwind 类名，如 blue-500）'),
    secondary: z.string().describe('次要色调（Tailwind 类名，如 purple-500）'),
    background: z.object({
      light: z.string().describe('浅色背景（Tailwind 类名）'),
      dark: z.string().describe('深色背景（Tailwind 类名）'),
    }),
    surface: z.string().describe('表面颜色（Tailwind 类名）'),
    text: z.object({
      primary: z.string().describe('主要文本颜色（Tailwind 类名）'),
      secondary: z.string().describe('次要文本颜色（Tailwind 类名）'),
    }),
    border: z.string().describe('边框颜色（Tailwind 类名）'),
  }),
  shape: z.object({
    borderRadius: z.object({
      sm: z.string().describe('小圆角（Tailwind 类名，如 rounded-sm）'),
      md: z.string().describe('中等圆角（Tailwind 类名，如 rounded-md）'),
      lg: z.string().describe('大圆角（Tailwind 类名，如 rounded-lg）'),
      full: z.string().describe('完全圆角（Tailwind 类名，如 rounded-full）'),
    }),
    borderWidth: z.string().describe('边框宽度（Tailwind 类名，如 border）'),
  }),
  typography: z.object({
    fontFamily: z.string().describe('字体族（如 sans-serif, serif, mono）'),
    baseSize: z.string().describe('基础字体大小（Tailwind 类名，如 text-base）'),
    density: z.enum(['compact', 'normal', 'spacious']).describe('密度：紧凑、正常、宽松'),
  }),
  shadows: z.object({
    cardShadow: z.string().describe('卡片阴影（Tailwind 类名，如 shadow-lg）'),
    buttonShadow: z.string().describe('按钮阴影（Tailwind 类名，如 shadow-md）'),
  }),
  vibe: z.string().describe('风格描述（如 "Professional Logistics", "Cyberpunk", "Modern Minimalist"）'),
});

export async function POST(request: Request) {
  const startTime = Date.now();
  log('🎨 [extract-theme] 开始提取UI风格');
  
  try {
    const body = await request.json();
    const { imageBase64, aiConfig } = body;

    if (!imageBase64) {
      logError('❌ [extract-theme] 缺少图片数据');
      return Response.json(
        { error: '缺少图片数据' },
        { status: 400 }
      );
    }

    // 处理 base64 数据（可能包含 data URL 前缀）
    let base64Data = imageBase64;
    if (imageBase64.includes(',')) {
      base64Data = imageBase64.split(',')[1];
    }

    // 获取模型配置
    const visionModel = getVisionModel(aiConfig);
    log(`📸 [extract-theme] 图片数据准备完成，开始调用 ${visionModel} Vision`);

    // 使用 generateObject 强制返回结构化 JSON
    const result = await generateObject({
      model: openai(visionModel),
      schema: UIThemeConfigSchema,
      messages: [
        {
          role: 'system',
          content: `你是一个专业的UI设计专家。你的任务是分析用户上传的界面截图，提取设计令牌（Design Tokens）并转换为严格的结构化JSON对象。

要求：
1. 仔细分析图片中的颜色、形状、字体、阴影等设计元素
2. 将颜色转换为最接近的 Tailwind CSS 类名（如 blue-500, slate-900）
3. 将圆角转换为 Tailwind 类名（如 rounded-md, rounded-lg）
4. 将阴影转换为 Tailwind 类名（如 shadow-md, shadow-lg）
5. 识别整体风格（vibe），用简洁的中文或英文描述
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
              image: base64Data,
            },
          ],
        },
      ],
      temperature: 0.3, // 较低温度以确保输出稳定
    });

    const duration = Date.now() - startTime;
    log(`✅ [extract-theme] UI风格提取成功，耗时: ${duration}ms`);
    log('📊 [extract-theme] 提取的主题:', result.object);

    return Response.json({
      theme: result.object as UIThemeConfig,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logError(`❌ [extract-theme] 提取失败，耗时: ${duration}ms`);
    logError('❌ [extract-theme] 错误详情:', error);

    const errorMessage = error instanceof Error 
      ? error.message 
      : 'UI风格提取失败';
    
    return Response.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

