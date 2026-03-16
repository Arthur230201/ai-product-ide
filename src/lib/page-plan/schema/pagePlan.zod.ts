/**
 * PagePlan IR v1.0 — strict, compilable. CompositeRef avoids id collisions across nodes.
 */
import { z } from 'zod';

/** nodeId may contain hyphens from canvas ids */
export const CompositeRefSchema = z
  .string()
  .regex(
    /^[a-zA-Z0-9_-]+::[A-Za-z0-9_-]+$/,
    'CompositeRef must be `${nodeId}::${localId}`'
  );

export const EdgeRefSchema = z
  .string()
  .regex(
    /^[a-zA-Z0-9_-]+::[a-zA-Z0-9_-]+(?:::[A-Za-z0-9_-]+)?$/,
    'EdgeRef must be `source::target` or `source::target::localId`'
  );

export const PageTemplateIdSchema = z.enum([
  'list',
  'detail',
  'form',
  'dashboard',
  'list_detail_split',
  'search_results',
  'wizard',
  'review_approve',
  'settings',
]);
export const DensitySchema = z.enum(['compact', 'comfortable', 'airy']);
export const NavigationModeSchema = z.enum(['topnav', 'sidebar', 'tabs', 'none']);

export const PagePlanMetaSchema = z.object({
  pageId: z.string().min(1),
  pageLabel: z.string().min(1),
  pageType: z.enum(['View', 'Action']),
  sourceNodeId: z.string().min(1),
});

export const TemplateDecisionSchema = z.object({
  templateId: PageTemplateIdSchema,
  density: DensitySchema.default('comfortable'),
  navigationMode: NavigationModeSchema.default('none'),
  primaryCtaIntent: z
    .enum(['create', 'edit', 'submit', 'save', 'next', 'none'])
    .default('none'),
});

export const SlotTextSchema = z.object({
  kind: z.literal('text'),
  text: z.string().max(120),
});

export const SlotIconSchema = z.object({
  kind: z.literal('icon'),
  name: z.string().max(64),
});

export const SlotListSchema = z.object({
  kind: z.literal('list'),
  items: z.array(z.string().max(120)).max(12),
});

export const ComponentSlotSchema = z.union([SlotTextSchema, SlotIconSchema, SlotListSchema]);

export const ComponentInstanceSchema = z.object({
  id: z.string().regex(/^[a-z0-9_]+$/, 'component.id must be snake_case'),
  name: z.string().min(1),
  props: z
    .record(
      z.string(),
      z.union([z.string(), z.number(), z.boolean(), z.null()])
    )
    .default({}),
  slots: z.array(ComponentSlotSchema).optional(),
  bindings: z
    .object({
      dataQueryRef: CompositeRefSchema.optional(),
      eventRef: CompositeRefSchema.optional(),
      edgeRef: EdgeRefSchema.optional(),
    })
    .optional(),
});

export const SectionKindSchema = z.enum([
  'header',
  'subheader',
  'filterBar',
  'content',
  'results',
  'summary',
  'formBody',
  'actions',
  'states',
  'footer',
]);

export const PageSectionSchema = z.object({
  id: z.string().regex(/^[a-z0-9_]+$/, 'section.id must be snake_case'),
  kind: SectionKindSchema,
  title: z.string().max(80).optional(),
  components: z.array(ComponentInstanceSchema).min(1),
});

export const StateCoverageSchema = z.object({
  includeLoading: z.boolean().default(true),
  includeEmpty: z.boolean().default(true),
  includeError: z.boolean().default(true),
});

export const BindingSchema = z.object({
  data: z
    .array(
      z.object({
        id: z.string().regex(/^[a-z0-9_]+$/),
        dataQueryRef: CompositeRefSchema,
        usage: z.enum(['primary', 'secondary']).default('primary'),
        note: z.string().max(120).optional(),
      })
    )
    .default([]),
  events: z
    .array(
      z.object({
        id: z.string().regex(/^[a-z0-9_]+$/),
        eventRef: CompositeRefSchema,
        usage: z.enum(['submit', 'saveDraft', 'approve', 'reject', 'custom']).default('submit'),
        note: z.string().max(120).optional(),
      })
    )
    .default([]),
  nav: z
    .array(
      z.object({
        id: z.string().regex(/^[a-z0-9_]+$/),
        edgeRef: EdgeRefSchema,
        trigger: z
          .enum(['UI_CLICK', 'SYSTEM_REDIRECT', 'ROLE_ENTRY', 'PERMISSION_ENTRY'])
          .default('UI_CLICK'),
        note: z.string().max(120).optional(),
      })
    )
    .default([]),
});

export const CopySlotsSchema = z
  .object({
    headline: z.string().max(80).optional(),
    subheadline: z.string().max(140).optional(),
    primaryCtaText: z.string().max(24).optional(),
    secondaryCtaText: z.string().max(24).optional(),
    emptyStateTitle: z.string().max(60).optional(),
    emptyStateBody: z.string().max(140).optional(),
    errorStateTitle: z.string().max(60).optional(),
    errorStateBody: z.string().max(140).optional(),
  })
  .strict()
  .optional();

export const PagePlanSchema = z
  .object({
    version: z.literal('1.0'),
    meta: PagePlanMetaSchema,
    template: TemplateDecisionSchema,
    stateCoverage: StateCoverageSchema.default({
      includeLoading: true,
      includeEmpty: true,
      includeError: true,
    }),
    sections: z.array(PageSectionSchema).min(2),
    bindings: BindingSchema.default({ data: [], events: [], nav: [] }),
    copy: CopySlotsSchema,
  })
  .strict();

export type PagePlan = z.infer<typeof PagePlanSchema>;
