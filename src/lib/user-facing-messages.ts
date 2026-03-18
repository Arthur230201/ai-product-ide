/**
 * 用户可见文案统一口径
 * 以 docs/expert-team/UX_THIRD_PARTY_REVIEW.md「最终执行版口径」为准，全项目仅此处维护错误类→用户可见文案。
 */

import type { AIErrorType } from '@/lib/ai/llm';

/** UI Pipeline 等返回的错误类型（含 VALIDATION） */
export type PipelineErrorType = AIErrorType | 'VALIDATION';

/**
 * 根据 AI 错误类型与可选冷却秒数，返回用户可见的一句可操作建议。
 * 不向用户展示原始 error.message；技术信息仅开发环境或日志。
 */
export function getUserFacingErrorDescription(
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
    case 'PROVIDER':
      return '服务暂时不可用，请稍后重试。';
    case 'PARSE':
      return '生成结果解析失败，请简化描述后重试。';
    case 'VALIDATION':
      return '请求无效，请检查输入后重试。';
    default:
      return '出了点问题，请稍后重试。';
  }
}

/** 同步状态说明（tooltip/帮助） */
export const SYNC_STATE_TOOLTIP = '仅表示最近一次更新来源，非实时同步。';

/** 无选中节点时详情区文案 */
export const NO_NODE_SELECTED_MESSAGE = '请先选择画布上的节点。';

/** 空白画布主文案（创建模式 P2：主行动引导） */
export const EMPTY_CANVAS_PRIMARY = '用一句话描述产品，或拖入文件';

/** 空白画布次句（引导打开右侧对话） */
export const EMPTY_CANVAS_SECONDARY = '打开右侧 AI 对话开始';

/** 四维 Tab tooltip 中文短说明 */
export const TAB_TOOLTIPS: Record<string, string> = {
  View: 'UI',
  Spec: '需求',
  Impl: '实现',
  Test: '测试',
};
