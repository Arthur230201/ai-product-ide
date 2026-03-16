/**
 * Stage 1: rule-based template selection (decision tree).
 * 模板数量沿正交维度扩展；密度/导航走参数，不走新模板。输出单一 templateId。
 */
export type TemplateId =
  | 'list'
  | 'detail'
  | 'form'
  | 'dashboard'
  | 'list_detail_split'
  | 'search_results'
  | 'wizard'
  | 'review_approve'
  | 'settings';

export interface NodeTemplateInput {
  pageType: 'View' | 'Action';
  dataQueriesCount?: number;
  eventsCount?: number;
  hasFiltering?: boolean;
  /** 用于 View：narrative/label 含「概览/统计/总览」→ dashboard */
  narrativeHint?: string;
  /** 用于 View：用户故事或描述含「搜索/检索」→ search_results */
  searchHint?: boolean;
  /** 有 list→detail 边且希望常驻详情 → list_detail_split */
  hasListToDetailEdge?: boolean;
  /** 用于 Action：多步骤/流程 → wizard（或 processFlow 步数 >= 4） */
  hasMultiStepFlow?: boolean;
  /** Action：流程步骤数，>=4 倾向 wizard */
  eventProcessFlowLength?: number;
  /** View：边 target 标签/ id 含 detail/详情 → list_detail_split */
  edgeTargetHint?: string;
  /** 用于 Action：approve/reject 语义 → review_approve */
  hasApproveRejectHint?: boolean;
  /** 用于 Action：配置/偏好/账户 → settings */
  settingsHint?: boolean;
}

export function selectTemplate(node: NodeTemplateInput): TemplateId {
  if (node.pageType === 'Action') {
    const text = ((node.narrativeHint ?? '') + ' ').toLowerCase();
    if (/(审核|审批|通过|驳回|approve|reject)/.test(text) || node.hasApproveRejectHint) return 'review_approve';
    if (/(设置|偏好|配置|settings|preferences)/.test(text) || node.settingsHint) return 'settings';
    const steps = node.eventProcessFlowLength ?? 0;
    if (steps >= 4 || (node.hasMultiStepFlow && (node.eventsCount ?? 0) > 0)) return 'wizard';
    if ((node.eventsCount ?? 0) > 0) return 'form';
    return 'form';
  }

  if (node.pageType === 'View') {
    const qCount = node.dataQueriesCount ?? 0;
    const narrative = (node.narrativeHint ?? '').toLowerCase();
    const edgeHint = (node.edgeTargetHint ?? '').toLowerCase();
    const hasListToDetail =
      node.hasListToDetailEdge || /detail|详情/.test(edgeHint);
    if (/(总览|仪表盘|统计|概览|dashboard|overview)/.test(narrative) || (qCount >= 2 && /概览|统计|总览|dashboard/.test(narrative)))
      return 'dashboard';
    if ((node.hasFiltering && /(搜索|检索|search)/.test(narrative)) || node.searchHint) return 'search_results';
    if (hasListToDetail && qCount > 0) return 'list_detail_split';
    if (qCount > 0 && node.hasFiltering) return 'list';
    if (qCount > 0) return 'list';
    return 'detail';
  }

  return 'form';
}
