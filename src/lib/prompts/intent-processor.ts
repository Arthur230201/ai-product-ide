/**
 * 意图加工层：用户输入 → 加工后的 prompt（语义澄清与上下文补全）
 * 创建模式：仅传递用户意图，不规定页数/典型页，由 LLM 推断。
 * 生成 UI 模式：拼节点上下文与用户补充，不再按领域注入强约束（避免过拟合）。
 */

import { detectDomain } from './domains';

export interface CreateModeResult {
  enrichedUserPrompt: string;
  systemPromptSuffix: string;
  detectedDomain: string | undefined;
}

export interface GenerateUIModeResult {
  enrichedUserPrompt: string;
  systemPromptSuffix: string;
  detectedDomain: string | undefined;
}

/**
 * 创建模式（生图）意图加工
 * 只做语义澄清与上下文补全，不规定页面数量或典型页列表；页数/结构交给 LLM 推断。
 */
export function processIntentForCreate(rawUserInput: string): CreateModeResult {
  const trimmed = (rawUserInput || '').trim();
  // 不再按领域追加 scopeRuleCreate（避免过拟合）；仅传递用户意图，由 LLM 自行推断 scope
  return {
    enrichedUserPrompt: trimmed,
    systemPromptSuffix: '',
    detectedDomain: undefined,
  };
}

/**
 * 生成 UI 模式意图加工
 * 在拼 effectivePrompt 时或服务端 generateUIFromText 入口调用
 * nodeLabel、baseDesc 用于无用户输入时拼默认描述；有用户输入时可在其基础上补全领域约定
 */
export function processIntentForGenerateUI(
  rawUserInput: string,
  context: { nodeLabel?: string; baseDesc?: string }
): GenerateUIModeResult {
  const trimmed = (rawUserInput || '').trim();
  const domain = detectDomain(trimmed || (context.baseDesc ?? '') || (context.nodeLabel ?? ''));

  let enrichedUserPrompt: string;
  if (!trimmed && context.nodeLabel) {
    enrichedUserPrompt = context.baseDesc
      ? `请生成【${context.nodeLabel}】页的 UI。页面名称即页面类型，必须与之一致。本页说明：${context.baseDesc}`
      : `请为【${context.nodeLabel}】页面生成完整、可用、有真实内容的 React 组件代码。`;
  } else if (trimmed) {
    if (context.nodeLabel) {
      enrichedUserPrompt = context.baseDesc
        ? `【${context.nodeLabel}】本页说明：${context.baseDesc}\n\n用户补充：${trimmed}`
        : `【${context.nodeLabel}】用户要求：${trimmed}`;
    } else {
      enrichedUserPrompt = trimmed;
    }
  } else {
    enrichedUserPrompt = context.nodeLabel
      ? `请为【${context.nodeLabel}】页面生成完整、可用、有真实内容的 React 组件代码。`
      : '请生成当前页面的完整 UI 代码。';
  }

  // 不再按领域注入布局/组件强约束，避免过拟合；观感由统一设计系统+组件库保证
  const systemPromptSuffix = '';

  return {
    enrichedUserPrompt,
    systemPromptSuffix,
    detectedDomain: domain?.id,
  };
}
