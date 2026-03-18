export type GoldenCase = {
  name: string;
  input: {
    projectName?: string;
    industry?: string;
    description?: string;
    nodeLabel: string;
    pageDescription?: string;
    prompt?: string;
  };
  expectStyleId: string;
};

export type GoldenFixture = {
  engineVersion: string;
  cases: GoldenCase[];
  generated?: {
    targetCount: number;
    variantPerPair?: number;
  };
};

const INDUSTRIES: Array<{ label: string; normalized: string }> = [
  // Long-tail industries first so parity always covers them.
  { label: '制造业', normalized: '制造业' },
  { label: '能源', normalized: '能源' },
  { label: '零售', normalized: '零售' },
  { label: '保险', normalized: '保险' },
  { label: '文旅', normalized: '文旅' },
  { label: 'SaaS', normalized: 'saas' },
  { label: 'fintech', normalized: 'fintech' },
  { label: '电商', normalized: '电商' },
  { label: '教育', normalized: '教育' },
  { label: '政务', normalized: '政务' },
  { label: '医疗', normalized: '医疗' },
  { label: '物流', normalized: '物流' },
  { label: '内容资讯', normalized: '内容资讯' },
];

const PRODUCT_TYPES = [
  'landing',
  'mobile-app',
  'form-flow',
  'checkout',
  'approval',
  'dashboard',
  'admin',
  'list-detail',
] as const;

type ProductType = (typeof PRODUCT_TYPES)[number];

function expectedStyleId(ind: { label: string; normalized: string }, pt: ProductType): string {
  // Anchors / known overrides to keep generated cases stable.
  if (ind.normalized === '电商') return 'ecommerce-mobile-warm';
  if (ind.normalized === 'saas') {
    if (pt === 'dashboard' || pt === 'admin' || pt === 'list-detail') return 'saas-dashboard-neutral';
    return `gen-${ind.label}-${pt}`;
  }
  if (ind.normalized === 'fintech') {
    // Avoid anchor collisions by limiting generated fintech to “flow” types.
    return `gen-${ind.label}-${pt}`;
  }
  return `gen-${ind.label}-${pt}`;
}

function productTypeText(pt: ProductType, indLabel: string, variant: number): { nodeLabel: string; pageDescription: string; description: string } {
  const v = variant + 1;
  switch (pt) {
    case 'landing':
      return {
        nodeLabel: '官网首页',
        description: `${indLabel} 官网落地页与定价 v${v}`,
        pageDescription: 'hero、功能区块、价格表、FAQ、CTA',
      };
    case 'mobile-app':
      return {
        nodeLabel: '移动端首页',
        description: `${indLabel} 移动端任务/列表 v${v}`,
        pageDescription: '卡片列表、触控优先、底部操作、CTA',
      };
    case 'form-flow':
      return {
        nodeLabel: '表单申报',
        description: `${indLabel} 多步骤表单流程 v${v}`,
        pageDescription: '多步骤表单、材料清单、校验、保存草稿',
      };
    case 'checkout':
      return {
        nodeLabel: '结算页',
        description: `${indLabel} 下单与结算 v${v}`,
        pageDescription: '地址、支付方式、优惠券、提交订单',
      };
    case 'approval':
      return {
        nodeLabel: '审批中心',
        description: `${indLabel} 风控/合规审核 v${v}`,
        pageDescription: '审批、时间线、操作记录、审计字段',
      };
    case 'dashboard':
      return {
        nodeLabel: '数据看板',
        description: `${indLabel} 指标与趋势概览 v${v}`,
        pageDescription: '指标卡片、趋势占位、列表、筛选',
      };
    case 'admin':
      return {
        nodeLabel: '后台管理',
        description: `${indLabel} 后台配置与权限 v${v}`,
        pageDescription: '侧栏、表格、筛选、分页、批量操作',
      };
    case 'list-detail':
      return {
        nodeLabel: '列表与详情',
        description: `${indLabel} 列表检索与详情 v${v}`,
        pageDescription: '列表、搜索、筛选、详情、操作记录',
      };
  }
}

function shouldGeneratePair(ind: { label: string; normalized: string }, pt: ProductType): boolean {
  // Fintech: generate only flow-like types to avoid anchor taking over dashboard/list/admin.
  if (ind.normalized === 'fintech') return ['landing', 'mobile-app', 'form-flow', 'checkout', 'approval'].includes(pt);
  // Ecommerce: allow all, but expected always anchor (stable).
  return true;
}

export function expandGoldenFixture(fx: GoldenFixture): GoldenFixture {
  const gen = fx.generated;
  if (!gen?.targetCount || gen.targetCount <= fx.cases.length) return fx;

  const variantPerPair = Math.max(1, gen.variantPerPair ?? 2);
  const existingNames = new Set(fx.cases.map((c) => c.name));
  const out: GoldenCase[] = [...fx.cases];

  for (const ind of INDUSTRIES) {
    for (const pt of PRODUCT_TYPES) {
      if (!shouldGeneratePair(ind, pt)) continue;
      for (let v = 0; v < variantPerPair; v += 1) {
        if (out.length >= gen.targetCount) break;
        const name = `gen:${ind.label}:${pt}:v${v + 1}`;
        if (existingNames.has(name)) continue;
        existingNames.add(name);
        const t = productTypeText(pt, ind.label, v);
        out.push({
          name,
          input: {
            projectName: 'Golden',
            industry: ind.label,
            description: t.description,
            nodeLabel: t.nodeLabel,
            pageDescription: t.pageDescription,
            prompt: '',
          },
          expectStyleId: expectedStyleId(ind, pt),
        });
      }
    }
  }

  // If still not enough (should not happen), pad with more variants on safer industries.
  let pad = 0;
  while (out.length < gen.targetCount && pad < 200) {
    pad += 1;
    const ind = INDUSTRIES[pad % INDUSTRIES.length];
    const pt = PRODUCT_TYPES[pad % PRODUCT_TYPES.length];
    if (!shouldGeneratePair(ind, pt)) continue;
    const name = `gen:${ind.label}:${pt}:pad${pad}`;
    if (existingNames.has(name)) continue;
    const t = productTypeText(pt, ind.label, pad);
    out.push({
      name,
      input: {
        projectName: 'Golden',
        industry: ind.label,
        description: t.description,
        nodeLabel: t.nodeLabel,
        pageDescription: t.pageDescription,
        prompt: '',
      },
      expectStyleId: expectedStyleId(ind, pt),
    });
  }

  return { ...fx, cases: out.slice(0, gen.targetCount) };
}

