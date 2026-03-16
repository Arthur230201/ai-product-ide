/**
 * validatePlan — Zod + template rules + composite refs + binding baselines.
 */
import { PagePlanSchema, CompositeRefSchema, type PagePlan } from '../schema/pagePlan.zod';
import type { PlanError } from './errorCodes';
import { fatal, warn } from './errorCodes';
import { runBindingRequirementsChecks } from './bindingRequirementsChecks';
import type { TemplateRulesTyped } from './templateRules.types';

export type { TemplateIdUnion, TemplateRulesTyped } from './templateRules.types';

/** 落盘 JSON 与代码共用；bindingRequirements 结构化校验见 bindingRequirementsChecks */
export type TemplateRules = {
  templateId: string;
  defaultDensity: 'compact' | 'comfortable' | 'airy';
  allowedSections: string[];
  requiredSections: string[];
  ctaRules?: Record<string, unknown>;
  stateRules?: {
    requireLoading?: boolean;
    requireEmpty?: boolean;
    requireError?: boolean;
  };
  layoutRules?: Record<string, unknown>;
  maxComponentsPerSection?: Record<string, number>;
  bindingRequirements?: Record<string, unknown>;
};

export type ComponentRegistryLite = {
  [componentName: string]: {
    allowedPropKeys?: string[];
    propEnums?: Record<string, (string | number | boolean | null)[]>;
  };
};

export function validatePlan(
  plan: unknown,
  opts: {
    templateRules: TemplateRules;
    componentRegistry?: ComponentRegistryLite;
  }
): { ok: true; plan: PagePlan } | { ok: false; errors: PlanError[] } {
  const errors: PlanError[] = [];

  const parsed = PagePlanSchema.safeParse(plan);
  if (!parsed.success) {
    errors.push(
      fatal(
        'E_SCHEMA_INVALID',
        '$',
        'PagePlan schema validation failed.',
        'Ensure output matches PagePlanSchema (version 1.0, meta, sections, bindings).'
      )
    );
    return { ok: false, errors };
  }
  const p = parsed.data;

  if (p.template.templateId !== opts.templateRules.templateId) {
    errors.push(
      fatal(
        'E_TEMPLATE_RULE_VIOLATION',
        '$.template.templateId',
        `templateId must equal "${opts.templateRules.templateId}".`,
        `Set $.template.templateId to "${opts.templateRules.templateId}".`
      )
    );
  }

  const kinds = p.sections.map((s) => s.kind);
  for (const req of opts.templateRules.requiredSections) {
    if (!(kinds as string[]).includes(req)) {
      errors.push(
        fatal(
          'E_TEMPLATE_MISSING_REQUIRED_SECTION',
          '$.sections',
          `Missing required section kind: "${req}".`,
          `Add a section with kind="${req}" and at least one component.`
        )
      );
    }
  }
  for (let i = 0; i < p.sections.length; i++) {
    const s = p.sections[i];
    if (!opts.templateRules.allowedSections.includes(s.kind)) {
      errors.push(
        fatal(
          'E_TEMPLATE_ILLEGAL_SECTION',
          `$.sections[${i}].kind`,
          `Section kind "${s.kind}" not allowed for template "${opts.templateRules.templateId}".`,
          `Use one of: ${opts.templateRules.allowedSections.join(', ')}`
        )
      );
    }
    // maxComponentsPerSection 在 runBindingRequirementsChecks 中与 bindingRequirements 一并执行
  }

  if (!kinds.includes('states')) {
    errors.push(
      fatal(
        'E_USABILITY_MISSING_STATES_SECTION',
        '$.sections',
        'Missing "states" section.',
        'Add kind="states" with Skeleton/EmptyState/Alert components.'
      )
    );
  }

  const checkComposite = (ref: string, path: string) => {
    if (!CompositeRefSchema.safeParse(ref).success) {
      errors.push(
        fatal(
          'E_BINDING_INVALID_COMPOSITE_REF',
          path,
          `Invalid composite ref: "${ref}".`,
          'Use `${nodeId}::${localId}` e.g. home::Q-001.'
        )
      );
    }
  };

  for (let i = 0; i < p.bindings.data.length; i++) {
    checkComposite(p.bindings.data[i].dataQueryRef, `$.bindings.data[${i}].dataQueryRef`);
  }
  for (let i = 0; i < p.bindings.events.length; i++) {
    checkComposite(p.bindings.events[i].eventRef, `$.bindings.events[${i}].eventRef`);
  }

  p.sections.forEach((sec, si) => {
    sec.components.forEach((c, ci) => {
      if (c.bindings?.dataQueryRef) {
        checkComposite(c.bindings.dataQueryRef, `$.sections[${si}].components[${ci}].bindings.dataQueryRef`);
      }
      if (c.bindings?.eventRef) {
        checkComposite(c.bindings.eventRef, `$.sections[${si}].components[${ci}].bindings.eventRef`);
      }
    });
  });

  if (p.meta.pageType === 'View') {
    const hasPrimary = p.bindings.data.some((d) => d.usage === 'primary');
    if (!hasPrimary) {
      errors.push(
        fatal(
          'E_BINDING_MISSING_PRIMARY_DATA',
          '$.bindings.data',
          "View must have bindings.data with usage='primary'.",
          'Add primary dataQueryRef for results.'
        )
      );
    }
  } else {
    const hasSubmit = p.bindings.events.some((e) => e.usage === 'submit');
    if (!hasSubmit) {
      errors.push(
        fatal(
          'E_BINDING_MISSING_SUBMIT_EVENT',
          '$.bindings.events',
          "Action must have bindings.events with usage='submit'.",
          'Add eventRef for submit.'
        )
      );
    }
  }

  const header = p.sections.find((s) => s.kind === 'header');
  const actions = p.sections.find((s) => s.kind === 'actions');
  const hasButton = (sec?: { components: { name: string }[] }) =>
    !!sec?.components?.some((c) => String(c.name).toLowerCase().includes('button'));

  if (p.meta.pageType === 'View') {
    if (!hasButton(header)) {
      errors.push(
        warn(
          'E_USABILITY_MISSING_CTA',
          '$.sections',
          'Header lacks Button (primary CTA).',
          'Add Button in header.'
        )
      );
    }
  } else {
    if (!hasButton(actions)) {
      errors.push(
        fatal(
          'E_USABILITY_MISSING_CTA',
          '$.sections',
          'Form actions section must include Button.',
          'Add submit Button in actions with eventRef binding.'
        )
      );
    }
  }

  // batch-2: maxComponentsPerSection + bindingRequirements（list_detail_split nav、search_results filter、wizard Tabs 等）
  runBindingRequirementsChecks(p, opts.templateRules as TemplateRulesTyped, errors);

  if (opts.componentRegistry) {
    p.sections.forEach((sec, si) => {
      sec.components.forEach((c, ci) => {
        const reg = opts.componentRegistry![c.name];
        if (!reg) {
          errors.push(
            fatal(
              'E_COMPONENT_UNKNOWN',
              `$.sections[${si}].components[${ci}].name`,
              `Unknown component "${c.name}".`,
              'Use registered names only.'
            )
          );
          return;
        }
        if (reg.allowedPropKeys) {
          const keys = Object.keys(c.props || {});
          const illegal = keys.filter((k) => !reg.allowedPropKeys!.includes(k));
          if (illegal.length) {
            errors.push(
              fatal(
                'E_COMPONENT_PROPS_INVALID',
                `$.sections[${si}].components[${ci}].props`,
                `Illegal prop keys: ${illegal.join(', ')}.`,
                `Allowed: ${reg.allowedPropKeys!.join(', ')}`
              )
            );
          }
        }
        if (reg.propEnums) {
          for (const [k, allowed] of Object.entries(reg.propEnums)) {
            if (k in (c.props || {})) {
              const v = (c.props as Record<string, unknown>)[k];
              const ok = allowed.some((a) => a === v);
              if (!ok) {
                errors.push(
                  fatal(
                    'E_COMPONENT_PROPS_INVALID',
                    `$.sections[${si}].components[${ci}].props.${k}`,
                    `Invalid value for ${c.name}.${k}.`,
                    `Use one of: ${allowed.map(String).join(', ')}`
                  )
                );
              }
            }
          }
        }
      });
    });
  }

  if (errors.some((e) => e.severity === 'fatal')) return { ok: false, errors };
  return { ok: true, plan: p };
}
