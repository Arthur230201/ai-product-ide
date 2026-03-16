/**
 * Repair: minimal patch to plan JSON from validatePlan errors.
 */
export function buildRepairPlanPrompt(args: {
  originalPlanJson: string;
  errorsJson: string;
  templateRulesJson: string;
  componentRegistrySnippet: string;
}): string {
  return `
你是“PagePlan 修复器”。你必须在最小改动下修复 PagePlan，使其通过校验。

【原始 PagePlan JSON】
${args.originalPlanJson}

【校验错误】
${args.errorsJson}

【模板规则】
${args.templateRulesJson}

【组件注册表片段】
${args.componentRegistrySnippet}

【修复纪律】
1) 只输出修复后的单个 JSON。
2) 只修改 errors 中 path 指向的字段。
3) 禁止 className/style/rawHtml/#hex/px。
4) bindings 必须用复合引用 \`\${nodeId}::\${localId}\`。

现在输出修复后的唯一 JSON。
`.trim();
}
