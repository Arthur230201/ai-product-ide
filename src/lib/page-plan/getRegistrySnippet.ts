/**
 * Server-side: build template rules JSON and component registry snippet for prompts.
 * 组件片段按 templateId 子集注入（RAG 按需），来自 registry/components/*.json。
 */
import listTemplateRules from './registry/templates/list.json';
import detailTemplateRules from './registry/templates/detail.json';
import formTemplateRules from './registry/templates/form.json';
import dashboardTemplateRules from './registry/templates/dashboard.json';
import listDetailSplitTemplateRules from './registry/templates/list_detail_split.json';
import searchResultsTemplateRules from './registry/templates/search_results.json';
import wizardTemplateRules from './registry/templates/wizard.json';
import reviewApproveTemplateRules from './registry/templates/review_approve.json';
import settingsTemplateRules from './registry/templates/settings.json';
import type { TemplateId } from './selectTemplate';
import { getRegistrySubset } from './registry/getRegistrySubset';

const templateMap: Record<TemplateId, unknown> = {
  list: listTemplateRules,
  detail: detailTemplateRules,
  form: formTemplateRules,
  dashboard: dashboardTemplateRules,
  list_detail_split: listDetailSplitTemplateRules,
  search_results: searchResultsTemplateRules,
  wizard: wizardTemplateRules,
  review_approve: reviewApproveTemplateRules,
  settings: settingsTemplateRules,
};

export function getTemplateRulesJson(templateId: TemplateId): string {
  const rules = templateMap[templateId];
  return JSON.stringify(rules, null, 2);
}

/**
 * 按模板返回组件子集 JSON，供 synthesize prompt 注入。模型只能使用 allowedComponents 中的 name/props 枚举。
 */
export function getComponentRegistrySnippet(options: { templateId: TemplateId; pageType?: 'View' | 'Action' }): string {
  const subset = getRegistrySubset(options);
  return JSON.stringify(subset, null, 2);
}
