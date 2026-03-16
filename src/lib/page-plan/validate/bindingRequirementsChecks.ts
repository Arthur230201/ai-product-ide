/**
 * Template bindingRequirements + maxComponents 校验（batch-2 增量）。
 * 使用 E_TEMPLATE_RULE_VIOLATION / 已有 E_BINDING_* 避免新增 error code。
 */
import type { PagePlan } from '../schema/pagePlan.zod';
import type { PlanError } from './errorCodes';
import { fatal, warn } from './errorCodes';
import type { TemplateRulesTyped } from './templateRules.types';

function findComponents(p: PagePlan, predicate: (c: { name: string; props?: Record<string, unknown>; bindings?: unknown }) => boolean) {
  return p.sections.flatMap((s) => s.components.filter(predicate));
}

export function runBindingRequirementsChecks(p: PagePlan, rules: TemplateRulesTyped, errors: PlanError[]): void {
  const maxMap = rules.maxComponentsPerSection ?? {};
  p.sections.forEach((sec, si) => {
    const max = maxMap[sec.kind];
    if (typeof max === 'number' && sec.components.length > max) {
      errors.push(
        fatal(
          'E_TEMPLATE_RULE_VIOLATION',
          `$.sections[${si}].components`,
          `Section "${sec.kind}" has too many components (${sec.components.length}). Max allowed is ${max}.`,
          `Remove extra components in section "${sec.kind}" until it has <= ${max} components.`
        )
      );
    }
  });

  const hasComponent = (name: string) => p.sections.some((s) => s.components.some((c) => c.name === name));
  const primaryDataCount = p.bindings.data.filter((d) => d.usage === 'primary').length;
  const submitEventCount = p.bindings.events.filter((e) => e.usage === 'submit').length;
  const br = rules.bindingRequirements ?? {};

  if (p.meta.pageType === 'View' && br.view) {
    const v = br.view;
    if (typeof v.minPrimaryDataQueries === 'number' && primaryDataCount < v.minPrimaryDataQueries) {
      errors.push(
        fatal(
          'E_BINDING_MISSING_PRIMARY_DATA',
          '$.bindings.data',
          `Template "${rules.templateId}" requires >= ${v.minPrimaryDataQueries} primary data bindings.`,
          `Add bindings.data entries with usage="primary" and composite dataQueryRef.`
        )
      );
    }
    if (typeof v.maxPrimaryDataQueries === 'number' && primaryDataCount > v.maxPrimaryDataQueries) {
      errors.push(
        fatal(
          'E_TEMPLATE_RULE_VIOLATION',
          '$.bindings.data',
          `Template "${rules.templateId}" allows at most ${v.maxPrimaryDataQueries} primary data bindings.`,
          `Reduce bindings.data with usage="primary".`
        )
      );
    }
    if (v.requireResultsDataBinding) {
      const resultsSecIdx = p.sections.findIndex((s) => s.kind === 'results');
      if (resultsSecIdx >= 0) {
        const okBind = p.sections[resultsSecIdx].components.some((c) => !!c.bindings && typeof c.bindings === 'object' && 'dataQueryRef' in (c.bindings as object));
        if (!okBind) {
          errors.push(
            fatal(
              'E_TEMPLATE_RULE_VIOLATION',
              `$.sections[${resultsSecIdx}].components`,
              `Template "${rules.templateId}" requires results section with bindings.dataQueryRef on a component.`,
              `Add bindings.dataQueryRef to the main results component (e.g. Table).`
            )
          );
        }
      }
    }
    if (v.requireAtLeastOneDataBindingInContent) {
      const content = p.sections.find((s) => s.kind === 'content');
      const ok = !!content?.components?.some((c) => !!c.bindings && typeof c.bindings === 'object' && 'dataQueryRef' in (c.bindings as object));
      if (!ok) {
        errors.push(
          fatal(
            'E_TEMPLATE_RULE_VIOLATION',
            '$.sections',
            `Template "${rules.templateId}" requires at least one component in "content" with bindings.dataQueryRef.`,
            `Add a Card (or other) in content with bindings.dataQueryRef.`
          )
        );
      }
    }
    if (v.requireSelectionToDetailNav) {
      const navOk = p.bindings.nav.length > 0 || findComponents(p, (c) => !!c.bindings && typeof c.bindings === 'object' && 'edgeRef' in (c.bindings as object)).length > 0;
      if (!navOk) {
        errors.push(
          fatal(
            'E_TEMPLATE_RULE_VIOLATION',
            '$.bindings.nav',
            `Template "list_detail_split" requires selection→detail nav (edgeRef or bindings.nav).`,
            `Add bindings.nav with edgeRef or set bindings.edgeRef on results component.`
          )
        );
      }
    }
    if (v.requireSearchInput) {
      const ok = findComponents(
        p,
        (c) => c.name === 'Input' && (c.props?.type === 'search' || c.props?.type === 'text')
      ).length > 0;
      if (!ok) {
        errors.push(
          fatal(
            'E_TEMPLATE_RULE_VIOLATION',
            '$.sections',
            `Template "${rules.templateId}" requires a search input (Input type="search").`,
            `Add Input with props.type="search" in filterBar or header.`
          )
        );
      }
    }
    if (v.requireFiltering) {
      const filterBar = p.sections.find((s) => s.kind === 'filterBar');
      const ok =
        !!filterBar &&
        (filterBar.components.length >= 2 ||
          filterBar.components.some((c) => ['Select', 'Checkbox', 'Radio'].includes(c.name)));
      if (!ok) {
        errors.push(
          fatal(
            'E_TEMPLATE_RULE_VIOLATION',
            '$.sections',
            `Template "${rules.templateId}" requires filtering controls in filterBar.`,
            `Add Select/Checkbox/Radio or multiple controls in filterBar.`
          )
        );
      }
    }
  }

  if (p.meta.pageType === 'Action' && br.action) {
    const a = br.action;
    if (typeof a.minSubmitEvents === 'number' && submitEventCount < a.minSubmitEvents) {
      errors.push(
        fatal(
          'E_BINDING_MISSING_SUBMIT_EVENT',
          '$.bindings.events',
          `Template "${rules.templateId}" requires >= ${a.minSubmitEvents} submit event bindings.`,
          `Add bindings.events with usage="submit".`
        )
      );
    }
    if (a.allowStepProgression && !hasComponent('Tabs')) {
      errors.push(
        fatal(
          'E_TEMPLATE_RULE_VIOLATION',
          '$.sections',
          `Template "wizard" requires step progression UI (Tabs for v1).`,
          `Add a Tabs component in content or formBody.`
        )
      );
    }
    if (a.preferTwoActionsApproveReject) {
      const actionsSecIdx = p.sections.findIndex((s) => s.kind === 'actions');
      const btnCount =
        actionsSecIdx >= 0
          ? p.sections[actionsSecIdx].components.filter((c) => String(c.name).toLowerCase().includes('button')).length
          : 0;
      if (btnCount < 2) {
        errors.push(
          fatal(
            'E_TEMPLATE_RULE_VIOLATION',
            actionsSecIdx >= 0 ? `$.sections[${actionsSecIdx}].components` : '$.sections',
            `Template "review_approve" requires at least two actions (e.g. Approve/Reject).`,
            `Add two Button components in actions section.`
          )
        );
      }
    }
    if (a.allowSaveDraft) {
      const actionsSec = p.sections.find((s) => s.kind === 'actions');
      const btns = actionsSec?.components?.filter((c) => c.name === 'Button') ?? [];
      if (btns.length < 2) {
        errors.push(
          warn(
            'E_TEMPLATE_RULE_VIOLATION',
            '$.sections',
            `Template "settings" recommends secondary action (Cancel/Save draft).`,
            `Add a secondary Button in actions (variant outline/secondary).`
          )
        );
      }
    }
  }
}
