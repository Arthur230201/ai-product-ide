/**
 * AI 模型配置工具函数
 * 用于在服务器端和客户端获取当前使用的 AI 模型
 */

// 默认模型配置
export const DEFAULT_AI_CONFIG = {
  visionModel: 'gpt-5-2025-08-07',
  textModel: 'gpt-5-2025-08-07',
} as const;

/**
 * 获取视觉模型（用于 UI 生成、拓扑解析等）
 * 优先级：用户配置 > 环境变量 > 默认值
 */
export function getVisionModel(userConfig?: { visionModel?: string }): string {
  // 优先使用用户配置
  if (userConfig?.visionModel) {
    return userConfig.visionModel;
  }
  
  // 其次使用环境变量
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_AI_VISION_MODEL) {
    return process.env.NEXT_PUBLIC_AI_VISION_MODEL;
  }
  
  // 最后使用默认值
  return DEFAULT_AI_CONFIG.visionModel;
}

/**
 * 获取文本模型（用于 PRD 生成、代码分析等）
 * 优先级：用户配置 > 环境变量 > 默认值
 */
export function getTextModel(userConfig?: { textModel?: string }): string {
  // 优先使用用户配置
  if (userConfig?.textModel) {
    return userConfig.textModel;
  }
  
  // 其次使用环境变量
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_AI_TEXT_MODEL) {
    return process.env.NEXT_PUBLIC_AI_TEXT_MODEL;
  }
  
  // 最后使用默认值
  return DEFAULT_AI_CONFIG.textModel;
}

