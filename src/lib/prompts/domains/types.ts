/**
 * 领域提示词模块类型
 * 用于意图加工时按行业/系统类型注入 Scope、典型页面、UI 约束等
 */

export interface DomainModule {
  /** 领域唯一 key，如 management-system、ecommerce */
  id: string;
  /** 用于检测用户输入的关键词或正则（优先匹配） */
  keywords: RegExp | string[];
  /**
   * 生图时追加的范围说明（自然语言），
   * 会拼到用户 prompt 末尾或作为 system 的 Scope Rule 补充
   */
  scopeRuleCreate: string;
  /** 典型页面标签列表，供生图节点建议与 fallback 使用 */
  typicalPages: Array<{ id: string; label: string; description?: string }>;
  /**
   * 生成 UI 时追加的系统提示词片段（如布局、组件约定）
   * 可选，不提供则不追加
   */
  forUISystemPrompt?: string;
}

export type DomainId = string;
