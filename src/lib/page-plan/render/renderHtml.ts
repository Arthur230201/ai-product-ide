/**
 * renderHtml(PagePlan v1.0) -> single-file HTML. BehaviorInjector-friendly.
 * Class strings come only from classMap + theme.tokens — no Tailwind arbitrary values [].
 */
import type { PagePlan } from '../schema/pagePlan.zod';
import { getDensityClasses, recipes, buttonClasses } from './classMap';
import { wrapFullHtml } from './tailwindCdnWrapper';
import type { DataQueryLite } from './buildDataQueryRuntime';
import { buildDataQueryRuntimePayload, runtimePayloadToScript } from './buildDataQueryRuntime';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function propString(props: Record<string, unknown>, k: string): string | undefined {
  const v = props[k];
  return v != null ? String(v) : undefined;
}

/** First slots entry with kind text */
function slotText(components: { slots?: { kind: string; text?: string }[] }[]): string | undefined {
  for (const c of components) {
    const t = c.slots?.find((s) => s.kind === 'text' && s.text);
    if (t?.text) return t.text;
  }
  return undefined;
}

export type RenderHtmlOptions = {
  /** When set, embeds runtime script + emits data-data-query-ref on bound tables */
  dataQueries?: DataQueryLite[];
  /** Optional real rows by query id; overrides mock for that id */
  rowsByQueryId?: Record<string, string[][]>;
};

export function renderHtml(plan: PagePlan, options?: RenderHtmlOptions): string {
  const d = getDensityClasses(plan.template.density);
  const title = plan.copy?.headline ?? plan.meta.pageLabel;
  const templateId = plan.template.templateId;
  let viewStateContainerOpen = false;
  type SplitPhase = '' | 'left' | 'right';
  let listDetailSplitPhase: SplitPhase = '';

  const parts: string[] = [];
  parts.push(`<div class="${recipes.pageShell}">`);
  parts.push(`<div class="${d.container} flex flex-col ${d.gap}">`);

  for (const section of plan.sections) {
    if (templateId === 'list_detail_split' && listDetailSplitPhase === 'right' && (section.kind === 'states' || section.kind === 'footer')) {
      parts.push(`</div></div>`);
      listDetailSplitPhase = '';
    }
    if (templateId === 'list_detail_split' && listDetailSplitPhase === 'left' && (section.kind === 'states' || section.kind === 'footer')) {
      parts.push(`</div></div>`);
      listDetailSplitPhase = '';
    }

    if (section.kind === 'header') {
      if (templateId === 'wizard') {
        parts.push(`<div class="flex gap-2 mb-4 text-sm text-slate-600" role="progressbar" aria-valuenow="1" aria-valuemin="1" aria-valuemax="3">步骤 1 / 3</div>`);
      }
      parts.push(`<header class="${d.container} ${recipes.headerRow}">`);
      parts.push(`<h1 class="${d.title}">${esc(title)}</h1>`);
      parts.push(`<div class="flex gap-2">`);
      const btn = section.components.find((c) => c.name === 'Button');
      if (btn) {
        const cls = buttonClasses(propString(btn.props, 'variant'), propString(btn.props, 'size'));
        const label = slotText([btn]) ?? plan.copy?.primaryCtaText ?? '新建';
        parts.push(`<button type="button" class="${cls}" data-action="submit">${esc(label)}</button>`);
      } else {
        parts.push(`<button type="button" class="${recipes.buttonPrimary}" data-action="submit">新建</button>`);
      }
      parts.push(`</div></header>`);
      continue;
    }
    if (section.kind === 'filterBar') {
      parts.push(`<div class="flex flex-wrap gap-2 ${d.gap}">`);
      parts.push(
        `<input class="${recipes.input} max-w-xs" type="search" placeholder="搜索" aria-label="搜索" />`
      );
      parts.push(
        `<button type="button" class="${recipes.buttonOutline} filter active" data-filter="all">全部</button>`
      );
      parts.push(`</div>`);
      continue;
    }
    if (section.kind === 'results') {
      if (templateId === 'list_detail_split') {
        parts.push(`<div class="flex gap-6 w-full"><div class="w-5/12 min-w-0 shrink-0">`);
        listDetailSplitPhase = 'left';
      }
      const tableCmp = section.components.find((c) => c.name === 'Table');
      const dataQueryRef =
        tableCmp?.bindings?.dataQueryRef != null ? String(tableCmp.bindings.dataQueryRef) : undefined;
      const dataAttr = dataQueryRef
        ? ` data-data-query-ref="${esc(dataQueryRef)}"`
        : '';
      const useRuntimeTbody =
        Boolean(dataQueryRef && options?.dataQueries?.length && plan.meta.sourceNodeId);
      if (templateId !== 'list_detail_split') {
        viewStateContainerOpen = true;
        parts.push(
          `<div data-view-state-container data-view-state="loading"><div data-state-block="content" class="hidden">`
        );
      }
      parts.push(`<div class="${recipes.card} ${d.card} overflow-hidden">`);
      parts.push(`<table class="${recipes.table}" role="grid"${dataAttr}>`);
      parts.push(
        `<thead class="${recipes.tableHead}"><tr><th class="${recipes.tableHeaderCell}">名称</th><th class="${recipes.tableHeaderCell}">状态</th></tr></thead>`
      );
      parts.push(`<tbody${useRuntimeTbody ? ' data-bind-body="true"' : ''}>`);
      if (!useRuntimeTbody) {
        for (let i = 0; i < 3; i++) {
          parts.push(
            `<tr class="data-item" data-filter="active"><td class="${recipes.tableCell}">示例 ${i + 1}</td><td class="${recipes.tableCell}">进行中</td></tr>`
          );
        }
      }
      parts.push(`</tbody></table></div>`);
      if (templateId !== 'list_detail_split') parts.push(`</div>`);
      continue;
    }
    if (section.kind === 'summary') {
      if (templateId === 'list_detail_split' && listDetailSplitPhase === 'left') {
        parts.push(`</div><div class="w-7/12 min-w-0 shrink-0">`);
        listDetailSplitPhase = 'right';
      }
      parts.push(
        `<div class="${recipes.card} ${d.card} ${d.container}"><p class="${d.body}">${esc(plan.copy?.subheadline ?? '摘要')}</p></div>`
      );
      continue;
    }
    if (section.kind === 'content') {
      if (templateId === 'list_detail_split' && listDetailSplitPhase === 'left') {
        parts.push(`</div><div class="w-7/12 min-w-0 shrink-0">`);
        listDetailSplitPhase = 'right';
      }
      if (templateId === 'wizard' && section.components.some((c) => c.name === 'Tabs')) {
        parts.push(`<div class="${recipes.tabList} mb-4" role="tablist">`);
        parts.push(`<button type="button" role="tab" class="${recipes.tabActive}" data-tab="step1" aria-selected="true">步骤 1</button>`);
        parts.push(`<button type="button" role="tab" class="${recipes.tabInactive}" data-tab="step2" aria-selected="false">步骤 2</button>`);
        parts.push(`</div>`);
        parts.push(`<div id="step1" role="tabpanel" class="${recipes.tabPanel}">当前步骤内容</div>`);
        parts.push(`<div id="step2" role="tabpanel" class="${recipes.tabPanelHidden}" style="display:none">下一步内容</div>`);
        continue;
      }
      if (templateId === 'dashboard') {
        parts.push(`<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">`);
        const cards = section.components.filter((c) => c.name === 'Card');
        for (let i = 0; i < Math.max(cards.length, 3); i++) {
          parts.push(`<div class="${recipes.card} ${d.card} ${d.container}"><p class="${d.body}">${i === 0 ? '指标/概览' : i === 1 ? '最近动态' : '快捷入口'}</p></div>`);
        }
        parts.push(`</div>`);
        continue;
      }
      parts.push(
        `<div class="${recipes.card} ${d.card} ${d.container}"><p class="${d.body}">内容区</p></div>`
      );
      continue;
    }
    if (section.kind === 'formBody') {
      parts.push(`<div class="${recipes.card} ${d.card} ${d.container}">`);
      parts.push(`<form class="flex flex-col ${d.gap}">`);
      parts.push(
        `<label class="${d.body}"><span class="block mb-1 font-medium">名称</span><input class="${recipes.input}" name="name" data-bind="name" /></label>`
      );
      parts.push(
        `<label class="${d.body}"><span class="block mb-1 font-medium">描述</span><textarea class="${recipes.input} ${recipes.textarea}" name="desc" rows="4"></textarea></label>`
      );
      parts.push(`</form></div>`);
      continue;
    }
    if (section.kind === 'actions') {
      parts.push(`<div class="flex justify-end gap-2 border-t border-slate-200 bg-white p-4">`);
      parts.push(`<button type="button" class="${recipes.buttonOutline}">${esc(plan.copy?.secondaryCtaText ?? '取消')}</button>`);
      const submitBtn = section.components.find((c) => c.name === 'Button');
      const submitLabel = submitBtn ? slotText([submitBtn]) ?? '提交' : '提交';
      parts.push(
        `<button type="button" class="${recipes.buttonPrimary}" data-action="submit">${esc(submitLabel)}</button>`
      );
      parts.push(`</div>`);
      continue;
    }
    if (section.kind === 'states') {
      parts.push(`<div class="h-8 ${recipes.skeleton} w-1/3" data-state-block="loading"></div>`);
      parts.push(
        `<div class="${recipes.emptyBox} hidden" data-state-block="empty"><p class="${d.body} mb-4">${esc(plan.copy?.emptyStateTitle ?? '暂无数据')}</p><button type="button" class="${recipes.buttonPrimary}">去添加</button></div>`
      );
      parts.push(
        `<div class="${recipes.alertError} hidden" role="alert" data-state-block="error"><p class="mb-2">${esc(plan.copy?.errorStateTitle ?? '加载失败')}</p><button type="button" class="${recipes.buttonOutline} border-red-300 text-red-800" data-action="submit">重试</button></div>`
      );
      if (viewStateContainerOpen) {
        parts.push(`</div>`);
        viewStateContainerOpen = false;
      }
      continue;
    }
    if (section.kind === 'footer') {
      parts.push(`<footer class="${d.body} border-t pt-4">页脚</footer>`);
      continue;
    }
    if (section.kind === 'subheader') {
      parts.push(`<p class="${d.body}">${esc(section.title ?? '')}</p>`);
      continue;
    }
  }

  parts.push(`</div></div>`);
  const body = parts.join('\n');
  const runtimeScript =
    options?.dataQueries && plan.meta.sourceNodeId
      ? runtimePayloadToScript(
          buildDataQueryRuntimePayload({
            nodeId: plan.meta.sourceNodeId,
            dataQueries: options.dataQueries,
            rowsByQueryId: options.rowsByQueryId,
          })
        )
      : '';
  return wrapFullHtml(body, title, runtimeScript);
}
