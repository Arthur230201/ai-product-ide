# PagePlan HTML-first 编译流水线

- **IR**：`schema/pagePlan.zod.ts` — 禁止 `className` / `style` / `rawHtml`；bindings 使用 `nodeId` + `queryId`/`eventId`。
- **模板库**：`registry/templates/*.json` — 共 9 个模板，可控扩展：
  - View：`list`、`detail`、`dashboard`、`list_detail_split`、`search_results`
  - Action：`form`、`wizard`、`review_approve`、`settings`
  - 每模板含：requiredSections、allowedSections、ctaRules、stateRules、layoutRules、**maxComponentsPerSection**、**bindingRequirements**（密度/导航走参数，不新增模板）。
- **Stage1**：`selectTemplate.ts` — 规则决策树（narrative/search/list→detail/approve/settings 等）输出单一 templateId。
- **组件**：`registry/components/*.json` + `componentNames.ts` — props 枚举供 validate 使用。
- **校验**：`validate/validatePlan.ts` + `bindingRequirementsChecks.ts` — Zod + required/allowed sections + **maxComponentsPerSection**（E_TEMPLATE_RULE_VIOLATION）+ **bindingRequirements**（results 绑定、content 绑定、list_detail_split nav、search_results Search+filter、wizard Tabs、review_approve 双按钮、settings 次按钮 warn）。
- **渲染**：`render/renderHtml.ts` — 按 templateId 布局分发（dashboard 卡片网格、list_detail_split 双栏、wizard 步骤条等），Tailwind CDN，与 BehaviorInjector 约定一致。
- **入口**：工具栏 **LayoutTemplate**（规则生成）/ **Sparkles**（AI 生成）→ `buildFallbackPlan` 或 `/api/page-plan/synthesize` → `validatePlan` → `renderHtml` → `view.code`。

Stage2 LLM 合成：`prompts/synthesize.plan.prompt.ts`；修复：`repair.plan.prompt.ts`。
