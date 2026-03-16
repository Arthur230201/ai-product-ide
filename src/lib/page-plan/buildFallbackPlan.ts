/**
 * Minimal PagePlan v1.0 for pipeline without LLM — composite refs + states section.
 */
import type { PagePlan } from './schema/pagePlan.zod';
import type { TemplateId } from './selectTemplate';

function ref(nodeId: string, localId: string): string {
  return `${nodeId}::${localId}`;
}

export function buildFallbackPlan(params: {
  pageId: string;
  pageType: 'View' | 'Action';
  title: string;
  templateId: TemplateId;
  dataQueryIds?: string[];
  eventIds?: string[];
}): PagePlan {
  const nodeId = params.pageId;
  const primaryQuery = params.dataQueryIds?.[0] ?? 'Q-001';
  const primaryEvent = params.eventIds?.[0] ?? 'EVT-001';

  const statesComponents: PagePlan['sections'][number]['components'] = [
    { id: 'sk_loading', name: 'Skeleton', props: { shape: 'rect' } },
    { id: 'es_empty', name: 'EmptyState', props: {} },
    { id: 'al_error', name: 'Alert', props: { variant: 'destructive' } },
  ];

  if (params.templateId === 'list') {
    return {
      version: '1.0',
      meta: {
        pageId: nodeId,
        pageLabel: params.title,
        pageType: params.pageType,
        sourceNodeId: nodeId,
      },
      template: {
        templateId: 'list',
        density: 'comfortable',
        navigationMode: 'none',
        primaryCtaIntent: 'create',
      },
      stateCoverage: { includeLoading: true, includeEmpty: true, includeError: true },
      sections: [
        {
          id: 'hdr',
          kind: 'header',
          components: [
            {
              id: 'btn_new',
              name: 'Button',
              props: { variant: 'default', size: 'lg' },
              slots: [{ kind: 'text', text: '新建' }],
            },
          ],
        },
        {
          id: 'flt',
          kind: 'filterBar',
          components: [{ id: 'inp_search', name: 'Input', props: { type: 'search' } }],
        },
        {
          id: 'res',
          kind: 'results',
          components: [
            {
              id: 'tbl_main',
              name: 'Table',
              props: { density: 'comfortable' },
              bindings: { dataQueryRef: ref(nodeId, primaryQuery) },
            },
          ],
        },
        {
          id: 'sta',
          kind: 'states',
          components: statesComponents,
        },
      ],
      bindings: {
        data: [{ id: 'dq_primary', dataQueryRef: ref(nodeId, primaryQuery), usage: 'primary' }],
        events: [],
        nav: [],
      },
      copy: {
        headline: params.title,
        primaryCtaText: '新建',
        emptyStateTitle: '暂无数据',
        errorStateTitle: '加载失败',
      },
    };
  }

  if (params.templateId === 'detail') {
    return {
      version: '1.0',
      meta: {
        pageId: nodeId,
        pageLabel: params.title,
        pageType: 'View',
        sourceNodeId: nodeId,
      },
      template: {
        templateId: 'detail',
        density: 'comfortable',
        navigationMode: 'none',
        primaryCtaIntent: 'none',
      },
      stateCoverage: { includeLoading: true, includeEmpty: false, includeError: true },
      sections: [
        {
          id: 'hdr',
          kind: 'header',
          components: [
            {
              id: 'btn_back',
              name: 'Button',
              props: { variant: 'outline', size: 'md' },
              slots: [{ kind: 'text', text: '返回' }],
            },
          ],
        },
        {
          id: 'sum',
          kind: 'summary',
          components: [{ id: 'c1', name: 'Card', props: { variant: 'default' } }],
        },
        {
          id: 'sta',
          kind: 'states',
          components: statesComponents,
        },
      ],
      bindings: {
        data: [{ id: 'dq_primary', dataQueryRef: ref(nodeId, primaryQuery), usage: 'primary' }],
        events: [],
        nav: [],
      },
      copy: { headline: params.title },
    };
  }

  if (params.templateId === 'dashboard') {
    return {
      version: '1.0',
      meta: { pageId: nodeId, pageLabel: params.title, pageType: 'View', sourceNodeId: nodeId },
      template: { templateId: 'dashboard', density: 'comfortable', navigationMode: 'none', primaryCtaIntent: 'create' },
      stateCoverage: { includeLoading: true, includeEmpty: false, includeError: true },
      sections: [
        { id: 'hdr', kind: 'header', components: [{ id: 'btn_new', name: 'Button', props: { variant: 'default', size: 'lg' }, slots: [{ kind: 'text', text: '新建' }] }] },
        {
          id: 'cnt',
          kind: 'content',
          components: [
            { id: 'c1', name: 'Card', props: { variant: 'default' }, bindings: { dataQueryRef: ref(nodeId, primaryQuery) } },
            { id: 'c2', name: 'Card', props: { variant: 'default' } },
            { id: 'c3', name: 'Card', props: { variant: 'default' } },
          ],
        },
        { id: 'sta', kind: 'states', components: statesComponents },
      ],
      bindings: { data: [{ id: 'dq_primary', dataQueryRef: ref(nodeId, primaryQuery), usage: 'primary' }], events: [], nav: [] },
      copy: { headline: params.title, primaryCtaText: '新建' },
    };
  }

  if (params.templateId === 'list_detail_split') {
    return {
      version: '1.0',
      meta: { pageId: nodeId, pageLabel: params.title, pageType: 'View', sourceNodeId: nodeId },
      template: { templateId: 'list_detail_split', density: 'comfortable', navigationMode: 'none', primaryCtaIntent: 'create' },
      stateCoverage: { includeLoading: true, includeEmpty: true, includeError: true },
      sections: [
        { id: 'hdr', kind: 'header', components: [{ id: 'btn_new', name: 'Button', props: { variant: 'default', size: 'md' }, slots: [{ kind: 'text', text: '新建' }] }] },
        { id: 'res', kind: 'results', components: [{ id: 'tbl_main', name: 'Table', props: { density: 'comfortable' }, bindings: { dataQueryRef: ref(nodeId, primaryQuery) } }] },
        { id: 'sum', kind: 'summary', components: [{ id: 'card_detail', name: 'Card', props: { variant: 'default' } }] },
        { id: 'sta', kind: 'states', components: statesComponents },
      ],
      bindings: {
        data: [{ id: 'dq_primary', dataQueryRef: ref(nodeId, primaryQuery), usage: 'primary' }],
        events: [],
        nav: [{ id: 'nav_detail', edgeRef: `${nodeId}::detail`, trigger: 'UI_CLICK' }],
      },
      copy: { headline: params.title, primaryCtaText: '新建', emptyStateTitle: '暂无数据', errorStateTitle: '加载失败' },
    };
  }

  if (params.templateId === 'search_results') {
    return {
      version: '1.0',
      meta: { pageId: nodeId, pageLabel: params.title, pageType: 'View', sourceNodeId: nodeId },
      template: { templateId: 'search_results', density: 'comfortable', navigationMode: 'none', primaryCtaIntent: 'create' },
      stateCoverage: { includeLoading: true, includeEmpty: true, includeError: true },
      sections: [
        { id: 'hdr', kind: 'header', components: [{ id: 'btn_new', name: 'Button', props: { variant: 'default', size: 'md' }, slots: [{ kind: 'text', text: '新建' }] }] },
        {
          id: 'flt',
          kind: 'filterBar',
          components: [
            { id: 'inp_search', name: 'Input', props: { type: 'search' } },
            { id: 'sel_filter', name: 'Select', props: {} },
          ],
        },
        { id: 'res', kind: 'results', components: [{ id: 'tbl_main', name: 'Table', props: { density: 'comfortable' }, bindings: { dataQueryRef: ref(nodeId, primaryQuery) } }] },
        { id: 'sta', kind: 'states', components: statesComponents },
      ],
      bindings: { data: [{ id: 'dq_primary', dataQueryRef: ref(nodeId, primaryQuery), usage: 'primary' }], events: [], nav: [] },
      copy: { headline: params.title, primaryCtaText: '新建', emptyStateTitle: '暂无数据', errorStateTitle: '加载失败' },
    };
  }

  if (params.templateId === 'wizard') {
    return {
      version: '1.0',
      meta: { pageId: nodeId, pageLabel: params.title, pageType: 'Action', sourceNodeId: nodeId },
      template: { templateId: 'wizard', density: 'comfortable', navigationMode: 'none', primaryCtaIntent: 'submit' },
      stateCoverage: { includeLoading: true, includeEmpty: false, includeError: true },
      sections: [
        { id: 'hdr', kind: 'header', components: [{ id: 'card_step', name: 'Card', props: { variant: 'outline' } }] },
        {
          id: 'steps',
          kind: 'content',
          components: [
            {
              id: 'tabs_wizard',
              name: 'Tabs',
              props: {},
            },
          ],
        },
        { id: 'body', kind: 'formBody', components: [{ id: 'i1', name: 'Input', props: { type: 'text' } }, { id: 'ta1', name: 'Textarea', props: { rows: '4' } }] },
        { id: 'act', kind: 'actions', components: [{ id: 'btn_next', name: 'Button', props: { variant: 'default', size: 'lg' }, slots: [{ kind: 'text', text: '下一步' }], bindings: { eventRef: ref(nodeId, primaryEvent) } }] },
        { id: 'sta', kind: 'states', components: statesComponents },
      ],
      bindings: { data: [], events: [{ id: 'ev_submit', eventRef: ref(nodeId, primaryEvent), usage: 'submit' }], nav: [] },
      copy: { headline: params.title, primaryCtaText: '下一步', secondaryCtaText: '上一步' },
    };
  }

  if (params.templateId === 'review_approve') {
    return {
      version: '1.0',
      meta: { pageId: nodeId, pageLabel: params.title, pageType: 'Action', sourceNodeId: nodeId },
      template: { templateId: 'review_approve', density: 'comfortable', navigationMode: 'none', primaryCtaIntent: 'submit' },
      stateCoverage: { includeLoading: true, includeEmpty: false, includeError: true },
      sections: [
        { id: 'hdr', kind: 'header', components: [{ id: 'btn_back', name: 'Button', props: { variant: 'outline', size: 'md' }, slots: [{ kind: 'text', text: '返回' }] }] },
        { id: 'sum', kind: 'summary', components: [{ id: 'card_info', name: 'Card', props: { variant: 'default' } }] },
        { id: 'act', kind: 'actions', components: [{ id: 'btn_reject', name: 'Button', props: { variant: 'outline', size: 'md' }, slots: [{ kind: 'text', text: '拒绝' }] }, { id: 'btn_approve', name: 'Button', props: { variant: 'default', size: 'lg' }, slots: [{ kind: 'text', text: '通过' }], bindings: { eventRef: ref(nodeId, primaryEvent) } }] },
        { id: 'sta', kind: 'states', components: statesComponents },
      ],
      bindings: { data: [], events: [{ id: 'ev_submit', eventRef: ref(nodeId, primaryEvent), usage: 'submit' }], nav: [] },
      copy: { headline: params.title, primaryCtaText: '通过', secondaryCtaText: '拒绝' },
    };
  }

  if (params.templateId === 'settings') {
    return {
      version: '1.0',
      meta: { pageId: nodeId, pageLabel: params.title, pageType: 'Action', sourceNodeId: nodeId },
      template: { templateId: 'settings', density: 'comfortable', navigationMode: 'none', primaryCtaIntent: 'submit' },
      stateCoverage: { includeLoading: true, includeEmpty: false, includeError: true },
      sections: [
        { id: 'hdr', kind: 'header', components: [{ id: 't1', name: 'Card', props: { variant: 'outline' } }] },
        { id: 'body', kind: 'formBody', components: [{ id: 'i1', name: 'Input', props: { type: 'text' } }, { id: 'i2', name: 'Input', props: { type: 'text' } }] },
        {
          id: 'act',
          kind: 'actions',
          components: [
            { id: 'btn_cancel', name: 'Button', props: { variant: 'outline', size: 'md' }, slots: [{ kind: 'text', text: '取消' }] },
            { id: 'btn_save', name: 'Button', props: { variant: 'default', size: 'lg' }, slots: [{ kind: 'text', text: '保存' }], bindings: { eventRef: ref(nodeId, primaryEvent) } },
          ],
        },
        { id: 'sta', kind: 'states', components: statesComponents },
      ],
      bindings: { data: [], events: [{ id: 'ev_submit', eventRef: ref(nodeId, primaryEvent), usage: 'submit' }], nav: [] },
      copy: { headline: params.title, primaryCtaText: '保存', secondaryCtaText: '取消' },
    };
  }

  // form (default Action)
  return {
    version: '1.0',
    meta: {
      pageId: nodeId,
      pageLabel: params.title,
      pageType: 'Action',
      sourceNodeId: nodeId,
    },
    template: {
      templateId: 'form',
      density: 'comfortable',
      navigationMode: 'none',
      primaryCtaIntent: 'submit',
    },
    stateCoverage: { includeLoading: true, includeEmpty: false, includeError: true },
    sections: [
      {
        id: 'hdr',
        kind: 'header',
        components: [{ id: 't1', name: 'Card', props: { variant: 'outline' } }],
      },
      {
        id: 'body',
        kind: 'formBody',
        components: [
          { id: 'i1', name: 'Input', props: { type: 'text' } },
          { id: 'ta1', name: 'Textarea', props: { rows: '4' } },
        ],
      },
      {
        id: 'act',
        kind: 'actions',
        components: [
          {
            id: 'btn_submit',
            name: 'Button',
            props: { variant: 'default', size: 'lg' },
            slots: [{ kind: 'text', text: '提交' }],
            bindings: { eventRef: ref(nodeId, primaryEvent) },
          },
        ],
      },
      {
        id: 'sta',
        kind: 'states',
        components: statesComponents,
      },
    ],
    bindings: {
      data: [],
      events: [{ id: 'ev_submit', eventRef: ref(nodeId, primaryEvent), usage: 'submit' }],
      nav: [],
    },
    copy: { headline: params.title, primaryCtaText: '提交' },
  };
}
