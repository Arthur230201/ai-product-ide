/**
 * AI 模型配置工具函数
 * 用于在服务器端和客户端获取当前使用的 AI 模型
 */

/** 统一错误文案：OPENAI_API_KEY 未配置 */
export const OPENAI_KEY_MESSAGE =
  'OPENAI_API_KEY 未配置。请在 .env.local 文件中添加 OPENAI_API_KEY=your_api_key';

/**
 * 获取 OPENAI_API_KEY（不抛错）
 * @returns key 或 null
 */
export function getOpenAIKey(): string | null {
  if (typeof process === 'undefined') return null;
  const key = process.env.OPENAI_API_KEY;
  return key && key.trim() !== '' ? key : null;
}

/**
 * 确保 OPENAI_API_KEY 已配置（仅服务端使用）
 * @throws Error 未配置时
 */
export function ensureOpenAIKey(): string {
  const key = getOpenAIKey();
  if (!key) throw new Error(OPENAI_KEY_MESSAGE);
  return key;
}

// 默认模型配置：UI 生成等质量任务使用 GPT-5.2
export const DEFAULT_AI_CONFIG = {
  visionModel: 'gpt-5.2',
  textModel: 'gpt-5.2',
} as const;

/** Stitch 方案：快速草稿用轻量模型，降低 TTFT，默认与 quality 同模型时可设环境变量覆盖 */
export const DEFAULT_FAST_AI_CONFIG = {
  visionModel: 'gpt-4o-mini',
  textModel: 'gpt-4o-mini',
} as const;

/** 生成档位：draft=快速预览/草稿，quality=高质量（复杂/图像/正式） */
export type GenerationTier = 'draft' | 'quality';

/**
 * Stitch 双模型分轨：按档位返回模型
 * - draft：快速模型，适合草稿/MVP、TTFT 优先
 * - quality：重量模型，适合复杂输入、图像、正式产出
 */
export function getModelForTier(
  tier: GenerationTier,
  type: 'vision' | 'text',
  userConfig?: { visionModel?: string; textModel?: string }
): string {
  if (tier === 'draft') {
    const fastVision =
      (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_AI_FAST_VISION_MODEL) ||
      DEFAULT_FAST_AI_CONFIG.visionModel;
    const fastText =
      (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_AI_FAST_TEXT_MODEL) ||
      DEFAULT_FAST_AI_CONFIG.textModel;
    return type === 'vision' ? fastVision : fastText;
  }
  return type === 'vision' ? getVisionModel(userConfig) : getTextModel(userConfig);
}

/**
 * 获取视觉模型（用于 UI 生成、拓扑解析等）
 * 优先级：用户配置 > 环境变量 > 默认值
 */
export function getVisionModel(userConfig?: { visionModel?: string }): string {
  if (userConfig?.visionModel) return userConfig.visionModel;
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_AI_VISION_MODEL) {
    return process.env.NEXT_PUBLIC_AI_VISION_MODEL;
  }
  return DEFAULT_AI_CONFIG.visionModel;
}

/**
 * 获取文本模型（用于 PRD 生成、代码分析等）
 * 优先级：用户配置 > 环境变量 > 默认值
 */
export function getTextModel(userConfig?: { textModel?: string }): string {
  if (userConfig?.textModel) return userConfig.textModel;
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_AI_TEXT_MODEL) {
    return process.env.NEXT_PUBLIC_AI_TEXT_MODEL;
  }
  return DEFAULT_AI_CONFIG.textModel;
}

