/**
 * 提示词加工层：在用户基本信息基础上，注入 200 家设计调研归纳的「设计意图」与「页面目标」约束。
 * 仅使用通用表述，不按领域词分支；用于生成 UI 时提升首轮高质量产出率。
 * @see docs/COMPONENT_AND_PROMPT_DECISION.md
 */

/** 设计意图块：2–3 句，从 DESIGN_PHILOSOPHY / HIGH_QUALITY_UI_DEFINITION 提炼 */
const DESIGN_INTENT_BLOCK = `
【设计意图（必须满足）】本页须体现：内容优先、主内容区与页面目标一致、使用提供的组件与推荐写法；禁止主区空白或占位文案。保持清晰层级与留白，单一主色、白底。
`.trim();

export interface EnrichContext {
  nodeLabel?: string;
  baseDesc?: string;
}

/** 兜底约束：无法推断具体目标时仍要求主区有实质内容，避免整页空白 */
const FALLBACK_MAIN_CONTENT = '主内容区必须包含 PageHeader 与至少 2–3 个 ListItem/Card/StatCard 等实质内容，禁止整页空白或仅导航与图标。';

/**
 * 根据节点名与描述推断页面目标，返回一句约束（泛化关键词，无领域词）
 */
function inferPageGoalConstraint(nodeLabel: string, baseDesc: string): string | null {
  const text = `${nodeLabel} ${baseDesc}`.toLowerCase();
  // 数据/列表/管理/仪表盘/首页/购物车/订单 → 主区须有数据展示
  if (
    /列表|管理|数据|仪表盘|首页|概览|统计|dashboard|list|overview|购物车|购物|订单|车|cart|order/.test(text) ||
    (/\d+个?(页面|页)/.test(text) && /首页|主/.test(text))
  ) {
    return '主内容区须含列表或统计块（StatCard/ListItem/Card）及合理数量模拟数据（至少 3–5 条），不得空白。';
  }
  // 表单/编辑/新建
  if (/表单|编辑|新建|创建|填写|录入|form|edit|create/.test(text)) {
    return '主内容区须含完整表单项（Label+Input/Select 等），不得仅占位。';
  }
  // 详情
  if (/详情|查看|详情页|detail/.test(text)) {
    return '主内容区须含完整信息块（标题、字段、说明），不得仅占位。';
  }
  return null;
}

/**
 * 在已有 user prompt 后追加「设计意图」与可选的「页面目标」约束。
 * 不修改原文，仅追加一段，保证模型在当页上下文中再次收到设计约束。
 */
export function enrichUserPromptWithDesignIntent(
  userPrompt: string,
  context: EnrichContext
): string {
  const trimmed = userPrompt.trim();
  const nodeLabel = context.nodeLabel?.trim() ?? '';
  const baseDesc = context.baseDesc?.trim() ?? '';
  const combined = `${trimmed} ${nodeLabel} ${baseDesc}`.trim();

  const pageGoalLine = nodeLabel || baseDesc ? inferPageGoalConstraint(nodeLabel, baseDesc) : null;
  // 有具体目标用目标句，否则用兜底约束，确保任何页面都不会被生成成空白
  const contentRequirement = pageGoalLine ?? FALLBACK_MAIN_CONTENT;
  const extra = `${DESIGN_INTENT_BLOCK}\n${contentRequirement}`;

  if (!trimmed) return extra;
  return `${trimmed}\n\n${extra}`;
}
