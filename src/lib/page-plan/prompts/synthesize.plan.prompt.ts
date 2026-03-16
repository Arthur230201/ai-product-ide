/**
 * Stage2: build prompt string for synthesizing PagePlan JSON (composite refs, no rawHtml).
 */
export function buildSynthesizePlanPrompt(args: {
  userInput: string;
  graphNodeJson: string;
  graphEdgesJson: string;
  templateRulesJson: string;
  componentRegistrySnippet: string;
}): string {
  return `
你是“UI 规划编译器”。你必须输出严格符合 PagePlanSchema 的 JSON，禁止输出任何解释性文字。

【用户需求】
${args.userInput}

【当前页面节点（Graph Node JSON）】
${args.graphNodeJson}

【相关边（Graph Edges JSON，可为空）】
${args.graphEdgesJson}

【模板规则（必须遵守）】
${args.templateRulesJson}

【组件注册表（JSON，必须遵守：仅允许使用 allowedComponents 中的 name，props 仅允许各组件 propEnums 内的键与值；globalDonts 为禁止项）】
${args.componentRegistrySnippet}

【硬性纪律（必须遵守）】
1) 只输出一个 JSON（不允许 Markdown，不允许代码块）。
2) PagePlan.version 固定为 "1.0"；meta.sourceNodeId 必须等于 graph node 的 id；meta.pageType 必须等于 node 的 View/Action。
3) template.templateId 必须等于模板规则中的 templateId；density 若不确定用 "comfortable"。
4) sections：
   - 只能使用模板规则 allowedSections 中的 kind；
   - 必须包含模板规则 requiredSections；
   - 每个 section.components 至少 1 个 ComponentInstance；
5) 组件实例：
   - 禁止输出 className / style / 任意 HTML 字符串；
   - 禁止出现 #hex、px、以及任何内联 CSS；
   - name 只能来自组件注册表片段；props 只用注册表允许的键和值。
   - slots 只用 {kind:"text"|"icon"|"list"}，禁止 rawHtml。
6) 绑定：dataQueryRef / eventRef 一律使用 \`\${nodeId}::\${localId}\`。
   - View：bindings.data 至少 1 条 usage="primary"；results 主组件带 bindings.dataQueryRef。
   - Action：bindings.events 至少 1 条 submit；actions 主按钮带 bindings.eventRef。
7) stateCoverage/includeLoading/includeError 为 true；list 模板 includeEmpty=true；必须有 kind="states" 的 section。

【输出】唯一 JSON，字段：version/meta/template/stateCoverage/sections/bindings（copy 可选）。
`.trim();
}
