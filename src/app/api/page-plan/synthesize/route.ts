/**
 * Stage2 + Repair: synthesize PagePlan from node context via LLM, validate, repair up to 2 times.
 */
import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { getOpenAIKey } from '@/lib/ai-config';
import {
  buildSynthesizePlanPrompt,
  buildRepairPlanPrompt,
  validatePlan,
  parsePagePlanFromText,
  getTemplateRulesJson,
  getComponentRegistrySnippet,
} from '@/lib/page-plan';
import type { TemplateRules } from '@/lib/page-plan';
import type { TemplateId } from '@/lib/page-plan';
import listTemplateRules from '@/lib/page-plan/registry/templates/list.json';
import detailTemplateRules from '@/lib/page-plan/registry/templates/detail.json';
import formTemplateRules from '@/lib/page-plan/registry/templates/form.json';
import dashboardTemplateRules from '@/lib/page-plan/registry/templates/dashboard.json';
import listDetailSplitTemplateRules from '@/lib/page-plan/registry/templates/list_detail_split.json';
import searchResultsTemplateRules from '@/lib/page-plan/registry/templates/search_results.json';
import wizardTemplateRules from '@/lib/page-plan/registry/templates/wizard.json';
import reviewApproveTemplateRules from '@/lib/page-plan/registry/templates/review_approve.json';
import settingsTemplateRules from '@/lib/page-plan/registry/templates/settings.json';

const templateRulesMap: Record<TemplateId, TemplateRules> = {
  list: listTemplateRules as TemplateRules,
  detail: detailTemplateRules as TemplateRules,
  form: formTemplateRules as TemplateRules,
  dashboard: dashboardTemplateRules as TemplateRules,
  list_detail_split: listDetailSplitTemplateRules as TemplateRules,
  search_results: searchResultsTemplateRules as TemplateRules,
  wizard: wizardTemplateRules as TemplateRules,
  review_approve: reviewApproveTemplateRules as TemplateRules,
  settings: settingsTemplateRules as TemplateRules,
};

const MAX_REPAIR_ATTEMPTS = 2;

export async function POST(request: NextRequest) {
  if (!getOpenAIKey()) {
    return NextResponse.json({ error: 'OPENAI_API_KEY 未配置' }, { status: 500 });
  }

  let body: {
    nodeId: string;
    nodeLabel?: string;
    pageType: 'View' | 'Action';
    templateId: TemplateId;
    dataQueries?: { id: string; description?: string }[];
    events?: { id: string }[];
    userInput?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '请求体非 JSON' }, { status: 400 });
  }

  const { nodeId, nodeLabel, pageType, templateId, dataQueries = [], events = [], userInput = '' } = body;
  if (!nodeId || !pageType || !templateId) {
    return NextResponse.json(
      { error: '缺少 nodeId / pageType / templateId' },
      { status: 400 }
    );
  }

  const templateRules = templateRulesMap[templateId];
  const graphNodeJson = JSON.stringify(
    {
      id: nodeId,
      label: nodeLabel || nodeId,
      pageType,
      dataQueries: dataQueries.map((q) => ({ id: q.id, description: q.description })),
      events: events.map((e) => ({ id: e.id })),
    },
    null,
    2
  );
  const graphEdgesJson = '[]';
  const templateRulesJson = getTemplateRulesJson(templateId);
  const componentRegistrySnippet = getComponentRegistrySnippet({ templateId, pageType });

  async function callSynthesize(): Promise<string> {
    const prompt = buildSynthesizePlanPrompt({
      userInput: userInput || `为页面「${nodeLabel || nodeId}」生成 PagePlan，templateId=${templateId}，pageType=${pageType}。`,
      graphNodeJson,
      graphEdgesJson,
      templateRulesJson,
      componentRegistrySnippet,
    });
    const result = await generateText({
      model: openai('gpt-4o'),
      prompt,
      temperature: 0.2,
      maxOutputTokens: 4096,
    });
    return result.text;
  }

  async function callRepair(originalPlanJson: string, errorsJson: string): Promise<string> {
    const prompt = buildRepairPlanPrompt({
      originalPlanJson,
      errorsJson,
      templateRulesJson,
      componentRegistrySnippet,
    });
    const result = await generateText({
      model: openai('gpt-4o'),
      prompt,
      temperature: 0.1,
      maxOutputTokens: 4096,
    });
    return result.text;
  }

  let lastPlanJson: string | null = null;
  let lastErrors: { code: string; path: string; message: string }[] = [];

  for (let attempt = 0; attempt <= MAX_REPAIR_ATTEMPTS; attempt++) {
    const raw = attempt === 0 ? await callSynthesize() : await callRepair(lastPlanJson!, JSON.stringify(lastErrors, null, 2));
    const plan = parsePagePlanFromText(raw);
    if (!plan) {
      return NextResponse.json(
        {
          ok: false,
          error: 'LLM 输出无法解析为 PagePlan JSON',
          raw: raw.slice(0, 500),
        },
        { status: 200 }
      );
    }
    lastPlanJson = JSON.stringify(plan, null, 2);
    const validated = validatePlan(plan, { templateRules });
    if (validated.ok) {
      return NextResponse.json({ ok: true, plan: validated.plan });
    }
    lastErrors = validated.errors.map((e) => ({
      code: e.code,
      path: e.path,
      message: e.message,
      hint: e.hint,
      severity: e.severity,
    }));
    if (attempt === MAX_REPAIR_ATTEMPTS) {
      return NextResponse.json(
        {
          ok: false,
          error: '校验未通过（已尝试 repair 达上限）',
          errors: lastErrors,
        },
        { status: 200 }
      );
    }
  }

  return NextResponse.json({ ok: false, error: '未预期分支' }, { status: 500 });
}
