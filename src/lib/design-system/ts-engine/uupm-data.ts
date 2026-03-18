import { z } from 'zod';

/**
 * TS 引擎内置数据（可版本化替换为外部包 / 生成物）。
 * 目标：在生产环境无 Python 时提供可复现的 UIUXProMax 子集能力。
 */

export const UupmTsEngineDataSchema = z.object({
  version: z.string().min(1),
  /** 多域知识库（对齐 UIUXProMax：产品类型/风格/Pattern/色板/字体/动效/反模式/A11y） */
  domains: z.object({
    industries: z.array(z.string().min(1)).min(1),
    productTypes: z.array(z.string().min(1)).min(1),
    patterns: z.array(
      z.object({
        id: z.string().min(1),
        tags: z.array(z.string().min(1)).min(1),
        summary: z.string().min(1),
      })
    ),
    colorPalettes: z.array(
      z.object({
        id: z.string().min(1),
        tags: z.array(z.string().min(1)).min(1),
        colors: z.object({
          primary: z.string().min(1),
          secondary: z.string().min(1),
          cta: z.string().min(1),
          background: z.string().min(1),
          text: z.string().min(1),
          notes: z.string().optional(),
        }),
      })
    ),
    typographyProfiles: z.array(
      z.object({
        id: z.string().min(1),
        tags: z.array(z.string().min(1)).min(1),
        typography: z.string().min(1),
      })
    ),
    effectsProfiles: z.array(
      z.object({
        id: z.string().min(1),
        tags: z.array(z.string().min(1)).min(1),
        keyEffects: z.string().min(1),
      })
    ),
    antiPatterns: z.array(
      z.object({
        id: z.string().min(1),
        tags: z.array(z.string().min(1)).min(1),
        items: z.array(z.string().min(1)).min(1),
      })
    ),
    a11yRules: z.array(
      z.object({
        id: z.string().min(1),
        tags: z.array(z.string().min(1)).min(1),
        rules: z.array(z.string().min(1)).min(1),
      })
    ),
  }),
  styles: z.array(
    z.object({
      id: z.string().min(1),
      /** 供检索命中的标签（行业/场景/组件/气质关键词） */
      tags: z.array(z.string().min(1)).min(1),
      style: z.object({
        name: z.string().min(1),
        keywords: z.array(z.string().min(1)).min(1),
      }),
      patternSummary: z.string().min(1),
      colors: z.object({
        primary: z.string().min(1),
        secondary: z.string().min(1),
        cta: z.string().min(1),
        background: z.string().min(1),
        text: z.string().min(1),
        notes: z.string().optional(),
      }),
      typography: z.string().min(1),
      keyEffects: z.string().min(1),
      antiPatterns: z.array(z.string().min(1)).min(1),
    })
  ),
});

export type UupmTsEngineData = z.infer<typeof UupmTsEngineDataSchema>;

type DomainPattern = UupmTsEngineData['domains']['patterns'][number];
type DomainPalette = UupmTsEngineData['domains']['colorPalettes'][number];
type DomainTypography = UupmTsEngineData['domains']['typographyProfiles'][number];
type DomainEffects = UupmTsEngineData['domains']['effectsProfiles'][number];
type DomainAvoid = UupmTsEngineData['domains']['antiPatterns'][number];
type DomainA11y = UupmTsEngineData['domains']['a11yRules'][number];
type StyleEntry = UupmTsEngineData['styles'][number];

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function pickByTag<T extends { tags: string[] }>(items: T[], tags: string[]): T[] {
  const q = new Set(tags.map((t) => t.toLowerCase()));
  return items.filter((it) => it.tags.some((t) => q.has(t.toLowerCase())));
}

function pickBestByOverlap<T extends { tags: string[] }>(items: T[], tags: string[]): T | null {
  if (!items.length) return null;
  const want = tags.map((t) => t.toLowerCase());
  let best: { item: T; score: number } | null = null;
  for (const it of items) {
    const have = new Set(it.tags.map((t) => t.toLowerCase()));
    let score = 0;
    for (const w of want) if (have.has(w)) score += 1;
    if (!best || score > best.score) best = { item: it, score };
  }
  return best?.item ?? null;
}

function buildStyleName(industry: string, productType: string): string {
  const pt = (() => {
    switch (productType) {
      case 'dashboard':
        return '数据看板';
      case 'admin':
        return '企业后台';
      case 'landing':
        return '落地页';
      case 'list-detail':
        return '列表详情';
      case 'form-flow':
        return '表单流程';
      case 'approval':
        return '审批流';
      case 'checkout':
        return '结算体验';
      case 'mobile-app':
        return '移动端';
      default:
        return productType;
    }
  })();
  if (industry === 'fintech' || industry === '金融' || industry === '支付') return `稳重可信·${pt}`;
  if (industry === '电商') return `温暖高转化·${pt}`;
  if (industry === '政务') return `清晰合规·${pt}`;
  if (industry === '医疗') return `克制可信·${pt}`;
  if (industry === '教育') return `清爽友好·${pt}`;
  if (industry === '物流') return `高效可靠·${pt}`;
  if (industry === '内容资讯') return `编辑友好·${pt}`;
  if (industry === '制造业') return `精益可控·${pt}`;
  if (industry === '能源') return `稳健安全·${pt}`;
  if (industry === '零售') return `清爽高效·${pt}`;
  if (industry === '保险') return `稳重可信·${pt}`;
  if (industry === '文旅') return `沉浸叙事·${pt}`;
  // 默认包含行业前缀，避免跨行业同名导致检索/验收歧义
  return `${industry}·${pt}`;
}

function buildScaledDomains(base: UupmTsEngineData['domains']): UupmTsEngineData['domains'] {
  const industries = base.industries;
  const productTypes = base.productTypes;

  const patterns: DomainPattern[] = [...base.patterns];
  const patternVariants: Array<{ key: string; summary: string; tags: string[] }> = [
    { key: 'metrics', tags: ['dashboard', 'admin', 'metrics'], summary: '增加指标卡片区：3–6 张卡片，含趋势/同比/环比；关键指标可钻取。' },
    { key: 'filters', tags: ['dashboard', 'admin', '筛选'], summary: '筛选区分“常用筛选”与“高级筛选抽屉”，并提供一键重置与已选条件展示。' },
    { key: 'timeline', tags: ['approval', 'audit', '审计'], summary: '详情侧加入时间线/操作记录，突出可追溯性；关键字段分组与高亮。' },
    { key: 'wizard', tags: ['form-flow', '政务', '医疗'], summary: '多步骤向导：步骤条 + 分段校验 + 保存草稿；材料清单与进度状态常驻。' },
    { key: 'commerce', tags: ['电商', 'checkout', 'mobile'], summary: '底部固定结算条；优惠券/促销信息在价格附近；关键 CTA 永远可达。' },
    { key: 'search-sort', tags: ['list', 'search', 'sort'], summary: '列表区提供搜索与排序（时间/状态/金额等）；支持保存筛选条件与最近使用。' },
    { key: 'empty-states', tags: ['empty', 'onboarding'], summary: '为空/无权限/无结果提供明确空状态：解释原因 + 主 CTA；避免“空白屏”。' },
    { key: 'bulk-actions', tags: ['table', 'bulk'], summary: '表格支持批量选择与批量操作条；危险操作需二次确认并可撤销。' },
    { key: 'responsive', tags: ['responsive', 'mobile'], summary: '响应式策略明确：桌面分栏/多列；移动端单列与底部操作条；避免横向滚动表格（必要时提供列选择）。' },
  ];
  const industryPatternVariants: Array<{ industry: string; key: string; tags: string[]; summary: string }> = [
    {
      industry: '制造业',
      key: 'shopfloor-ops',
      tags: ['industry-special', 'dashboard', 'admin', 'alarm', 'status', 'shift'],
      summary:
        '制造业场景：增加「告警/停机/异常」强提示区（可一键确认/派工）；状态色必须冗余文字；支持按班次/产线/设备筛选；关键 KPI（OEE/良率/节拍）卡片可钻取到工单列表。',
    },
    {
      industry: '能源',
      key: 'safety-ops',
      tags: ['industry-special', 'dashboard', 'admin', 'map', 'alarm', 'safety'],
      summary:
        '能源场景：首屏突出站点/工况总览 + 安全告警队列；支持地图/列表切换；告警详情包含处置 SOP 与时间线；危险操作二次确认并记录。',
    },
    {
      industry: '零售',
      key: 'store-pos',
      tags: ['industry-special', 'dashboard', 'list-detail', 'pos', 'inventory', 'promo'],
      summary:
        '零售场景：门店维度的「销量/毛利/库存周转」卡片 + 促销执行看板；列表优先支持条码/商品名搜索；库存低于阈值必须突出显示并提供补货 CTA。',
    },
    {
      industry: '保险',
      key: 'claims-audit',
      tags: ['industry-special', 'approval', 'audit', 'timeline', 'risk'],
      summary:
        '保险场景：理赔/核保流程以时间线为核心，关键证据材料分组展示；风险点用标签+解释文案呈现；金额/责任范围字段高可读；审批按钮文案必须明确（通过/拒绝/补充材料）。',
    },
    {
      industry: '文旅',
      key: 'itinerary-experience',
      tags: ['industry-special', 'landing', 'mobile', 'cards', 'media', 'cta'],
      summary:
        '文旅场景：行程卡片（时间/地点/票务）层级清晰；媒体图像用于氛围但不抢信息；价格/余量/规则信息就近呈现；CTA 强但克制，避免霓虹发光。',
    },
  ];

  for (const pt of productTypes) {
    for (let i = 0; i < patternVariants.length; i += 1) {
      const v = patternVariants[i];
      patterns.push({
        id: `pattern-${pt}-${v.key}`,
        tags: uniq([pt, ...v.tags]),
        summary: `${base.patterns[0]?.summary ?? ''}\n${v.summary}`.trim(),
      });
    }
  }
  for (const ind of industries) {
    const hits = industryPatternVariants.filter((x) => x.industry === ind);
    if (!hits.length) continue;
    for (const pt of productTypes) {
      for (const v of hits) {
        patterns.push({
          id: `pattern-${ind}-${pt}-${v.key}`,
          tags: uniq([ind, pt, ...v.tags]),
          summary: `${base.patterns[0]?.summary ?? ''}\n${v.summary}`.trim(),
        });
      }
    }
  }

  const palettes: DomainPalette[] = [...base.colorPalettes];
  const hueSets = [
    { id: 'blue', primary: '#2563eb', secondary: '#64748b', cta: '#0ea5e9' },
    { id: 'indigo', primary: '#4f46e5', secondary: '#64748b', cta: '#6366f1' },
    { id: 'emerald', primary: '#10b981', secondary: '#64748b', cta: '#34d399' },
    { id: 'amber', primary: '#f59e0b', secondary: '#64748b', cta: '#f97316' },
    { id: 'rose', primary: '#f43f5e', secondary: '#64748b', cta: '#fb7185' },
    { id: 'cyan', primary: '#06b6d4', secondary: '#64748b', cta: '#22d3ee' },
    { id: 'violet', primary: '#8b5cf6', secondary: '#64748b', cta: '#a78bfa' },
    { id: 'slate', primary: '#94a3b8', secondary: '#64748b', cta: '#cbd5e1' },
    { id: 'orange', primary: '#f97316', secondary: '#fb7185', cta: '#ea580c' },
    { id: 'teal', primary: '#14b8a6', secondary: '#64748b', cta: '#2dd4bf' },
  ] as const;

  for (const ind of industries) {
    for (const h of hueSets) {
      palettes.push({
        id: `palette-${ind}-${h.id}`,
        tags: uniq([ind, 'dark', 'accessible', 'industry-tuned']),
        colors: {
          primary: h.primary,
          secondary: h.secondary,
          cta: h.cta,
          background: '#0b1220',
          text: '#e5e7eb',
          notes: `${ind}：深底配色变体（${h.id}）。行业建议：制造/能源降低饱和提升可读；零售/文旅允许更高活力但需克制；保险/金融避免霓虹与过度渐变。`,
        },
      });
    }
  }
  // 行业专属色板（更具辨识度的底色/强调色策略）
  const industryPaletteSpecial: Array<{ industry: string; id: string; primary: string; secondary: string; cta: string; bg: string; tx: string; notes: string }> = [
    { industry: '制造业', id: 'steel', primary: '#0ea5e9', secondary: '#64748b', cta: '#22c55e', bg: '#0b1220', tx: '#e5e7eb', notes: '制造业：冷静钢蓝 + 绿色处置 CTA；告警/异常色必须配文字。' },
    { industry: '制造业', id: 'amber-sop', primary: '#0ea5e9', secondary: '#334155', cta: '#f59e0b', bg: '#07121b', tx: '#e5e7eb', notes: '制造业：蓝底 + 琥珀 SOP CTA；适合派工/处置流程，强调“下一步”。' },
    { industry: '制造业', id: 'graphite', primary: '#38bdf8', secondary: '#475569', cta: '#a3e635', bg: '#070d14', tx: '#e5e7eb', notes: '制造业：石墨黑底更克制；黄绿用于“已确认/已处置”；适合车间大屏与夜班。' },
    { industry: '制造业', id: 'hazard', primary: '#0ea5e9', secondary: '#334155', cta: '#ef4444', bg: '#07121b', tx: '#e5e7eb', notes: '制造业：危险 CTA 只用于关键处置（红）并配文字；其余 CTA 仍保持绿色/蓝。' },
    { industry: '能源', id: 'safety', primary: '#22c55e', secondary: '#64748b', cta: '#f59e0b', bg: '#07121b', tx: '#e5e7eb', notes: '能源：安全绿为主，橙色用于告警处置；背景更深，减少眩光。' },
    { industry: '能源', id: 'grid-blue', primary: '#1d4ed8', secondary: '#64748b', cta: '#22c55e', bg: '#07121b', tx: '#e5e7eb', notes: '能源：电网蓝 + 安全绿 CTA；适合站点概览与功率曲线，信息更冷静。' },
    { industry: '能源', id: 'night-ops', primary: '#22c55e', secondary: '#334155', cta: '#38bdf8', bg: '#050a12', tx: '#e5e7eb', notes: '能源：夜间运维更暗底；蓝用于导航与次级 CTA；告警仍用橙但不高饱和。' },
    { industry: '能源', id: 'amber-alert', primary: '#1d4ed8', secondary: '#334155', cta: '#f59e0b', bg: '#050a12', tx: '#e5e7eb', notes: '能源：橙色仅用于“告警处置/确认”；适合告警中心与处置台。' },
    { industry: '零售', id: 'fresh', primary: '#8b5cf6', secondary: '#64748b', cta: '#f97316', bg: '#0b1220', tx: '#e5e7eb', notes: '零售：紫+橙的促销活力，但表格区域保持中性底。' },
    { industry: '零售', id: 'mint', primary: '#14b8a6', secondary: '#64748b', cta: '#f97316', bg: '#0b1220', tx: '#e5e7eb', notes: '零售：薄荷青更清爽；适合库存/补货与会员页，CTA 仍用橙保持转化。' },
    { industry: '零售', id: 'night-pos', primary: '#f97316', secondary: '#334155', cta: '#22c55e', bg: '#060a12', tx: '#e5e7eb', notes: '零售：夜间收银/门店场景更暗底；橙用于价格与促销；绿用于“确认/完成”。' },
    { industry: '零售', id: 'member-blue', primary: '#0ea5e9', secondary: '#64748b', cta: '#f97316', bg: '#0b1220', tx: '#e5e7eb', notes: '零售：会员/权益更偏蓝系可信；促销 CTA 仍保持橙，避免整屏太“热”。' },
    { industry: '保险', id: 'trust', primary: '#2563eb', secondary: '#334155', cta: '#0ea5e9', bg: '#0b1220', tx: '#e2e8f0', notes: '保险：可信蓝+低饱和灰；强调“解释性”而不是炫酷。' },
    { industry: '保险', id: 'slate-audit', primary: '#94a3b8', secondary: '#334155', cta: '#2563eb', bg: '#0b1220', tx: '#e2e8f0', notes: '保险：更审计/文档化的石板灰；适合材料/条款与时间线，CTA 用蓝保持可信。' },
    { industry: '保险', id: 'paper', primary: '#38bdf8', secondary: '#334155', cta: '#2563eb', bg: '#080f18', tx: '#e2e8f0', notes: '保险：更“文档纸感”的冷色强调；适合材料预览/条款阅读，减少彩色干扰。' },
    { industry: '保险', id: 'risk-amber', primary: '#2563eb', secondary: '#334155', cta: '#f59e0b', bg: '#080f18', tx: '#e2e8f0', notes: '保险：风险提示用琥珀但必须配解释文案；不使用红色闪烁或霓虹。' },
    { industry: '文旅', id: 'experience', primary: '#14b8a6', secondary: '#64748b', cta: '#f97316', bg: '#07121b', tx: '#e5e7eb', notes: '文旅：青绿氛围 + 橙色 CTA；媒体图像多时需更强文字对比。' },
    { industry: '文旅', id: 'sunset', primary: '#fb7185', secondary: '#64748b', cta: '#f97316', bg: '#07121b', tx: '#e5e7eb', notes: '文旅：日落粉更具情绪；适合活动/海报式落地页，但正文区仍需高对比。' },
    { industry: '文旅', id: 'ocean', primary: '#22d3ee', secondary: '#64748b', cta: '#f97316', bg: '#06121a', tx: '#e5e7eb', notes: '文旅：海洋青更清爽；适合海岛/亲子主题；CTA 仍用橙保持可发现。' },
    { industry: '文旅', id: 'forest', primary: '#22c55e', secondary: '#64748b', cta: '#f59e0b', bg: '#06121a', tx: '#e5e7eb', notes: '文旅：森林绿更自然；适合露营/徒步主题；规则/须知区块必须高对比。' },
  ];
  for (const s of industryPaletteSpecial) {
    if (!industries.includes(s.industry)) continue;
    palettes.push({
      id: `palette-${s.industry}-${s.id}`,
      tags: uniq([s.industry, 'dark', 'accessible', 'industry-special']),
      colors: {
        primary: s.primary,
        secondary: s.secondary,
        cta: s.cta,
        background: s.bg,
        text: s.tx,
        notes: s.notes,
      },
    });
  }

  const typographyProfiles: DomainTypography[] = [...base.typographyProfiles];
  const typoVariants = [
    { id: 'dense', tags: ['dashboard', 'admin', 'data-dense'], typography: '偏紧凑：表格/列表优先；数值等宽或右对齐；信息密度高但留出分组间距。' },
    { id: 'readable', tags: ['landing', 'content'], typography: '偏阅读：标题层级更明显；段落行高更舒适；长文本分段与要点列表。' },
    { id: 'mobile', tags: ['mobile', 'checkout', 'mobile-app'], typography: '移动端：按钮/标签更大；触控优先；价格与主信息更醒目。' },
    { id: 'audit', tags: ['fintech', 'approval', 'audit'], typography: '审计优先：字段名/值区分强；关键字段不弱化；避免低对比灰字。' },
    { id: 'compact', tags: ['list-detail', 'table'], typography: '更紧凑：列表/表格行高更低但分割线更清晰；批量操作条固定；避免大段描述挤占首屏。' },
    { id: 'editorial', tags: ['landing', 'media', 'story'], typography: '更叙事：标题对比更强、段落更舒展；关键卖点用引用块/要点；但 CTA 区域仍保持清晰层级。' },
    { id: 'numeric', tags: ['metrics', 'table'], typography: '数值优先：金额/指标采用等宽或右对齐；单位紧邻数值；小数位统一；关键数值不换行。' },
    { id: 'calm-readable', tags: ['content', 'no-noise'], typography: '更冷静可读：减少装饰性字体变化；分隔与层级靠间距与字重；长文本/条款阅读疲劳更低。' },
  ] as const;
  for (const pt of productTypes) {
    for (const v of typoVariants) {
      typographyProfiles.push({
        id: `typo-${pt}-${v.id}`,
        tags: uniq([pt, ...v.tags]),
        typography: v.typography,
      });
    }
  }
  // 行业专属字体系（信息密度/可信感/叙事感）
  const industryTypo: Array<{ industry: string; id: string; tags: string[]; typography: string }> = [
    { industry: '制造业', id: 'ops', tags: ['data-dense', 'status'], typography: '制造业：信息密度偏高但分组清晰；状态/告警字段“标签+短句解释”；数值列等宽与右对齐；关键值不截断。' },
    { industry: '制造业', id: 'sop', tags: ['wizard', 'instructions'], typography: '制造业：SOP/处置说明用“步骤编号+短句”；关键参数用等宽与对齐；避免长段落堆叠。' },
    { industry: '制造业', id: 'kpi', tags: ['metrics', 'table'], typography: '制造业：KPI 看板优先“数值+单位+解释”三段式；异常阈值明确；避免只用颜色表达是否达标。' },
    { industry: '能源', id: 'safety', tags: ['safety', 'alarm'], typography: '能源：安全告警优先级最高；危险级别用“图标+文字”；表格字号略大；避免低对比灰字与细线。' },
    { industry: '能源', id: 'grid', tags: ['metrics', 'charts'], typography: '能源：曲线/功率图表旁必须有数值摘要；单位与时间范围明确；关键结论置顶，避免只给图不给结论。' },
    { industry: '能源', id: 'handover', tags: ['timeline', 'audit'], typography: '能源：交接班/检修记录用时间线；每条记录有“结论→风险→措施”；关键结论加粗且可复制。' },
    { industry: '零售', id: 'store', tags: ['inventory', 'promo'], typography: '零售：商品/库存字段层级明确；促销信息就近展示但不喧宾夺主；移动端按钮/标签更大，适配收银/导购操作。' },
    { industry: '零售', id: 'pos', tags: ['pos', 'touch'], typography: '零售：收银/导购路径字号更大、行高更高；主操作区“少字大按钮”；价格与数量对齐醒目。' },
    { industry: '零售', id: 'pricing', tags: ['price', 'cta'], typography: '零售：价格/优惠信息“主价格→优惠→说明”层级清晰；避免优惠规则藏在灰字里；按钮文案短且可理解。' },
    { industry: '保险', id: 'claims', tags: ['audit', 'explain'], typography: '保险：字段名/值对比强；金额/责任范围加粗；长条款用折叠与摘要；关键结论区块用“结论→依据→材料”。' },
    { industry: '保险', id: 'policy', tags: ['documents', 'readable'], typography: '保险：条款/材料阅读模式更舒适（更大行高）；关键条款用引用块；长编号字段可复制且不截断。' },
    { industry: '保险', id: 'risk', tags: ['risk', 'explain'], typography: '保险：风险提示必须“等级→原因→影响→建议”结构；术语给出简短释义；不使用夸张红字替代解释。' },
    { industry: '文旅', id: 'story', tags: ['readable', 'media'], typography: '文旅：叙事阅读优先；标题更有层级；正文行高更舒适；媒体与文字共存时，文字必须有遮罩与足够对比。' },
    { industry: '文旅', id: 'itinerary', tags: ['timeline', 'cards'], typography: '文旅：行程/日程用时间轴或分日卡片；地点与时间加粗；规则/须知折叠但易发现。' },
    { industry: '文旅', id: 'booking', tags: ['checkout', 'cta'], typography: '文旅：预订/票务信息“日期→人数→价格→规则”顺序清晰；退款/改期规则就近展示且可一键查看详情。' },
  ];
  for (const it of industryTypo) {
    if (!industries.includes(it.industry)) continue;
    typographyProfiles.push({
      id: `typo-${it.industry}-${it.id}`,
      tags: uniq([it.industry, 'industry-special', ...it.tags]),
      typography: it.typography,
    });
  }

  const effectsProfiles: DomainEffects[] = [...base.effectsProfiles];
  const fxVariants = [
    { id: 'soft', tags: ['soft-shadow', 'hover'], keyEffects: '轻上浮+阴影（150–220ms）；focus ring 清晰；表格行 hover 高亮。' },
    { id: 'strict', tags: ['audit', 'confirm'], keyEffects: '动效克制（120–180ms）；危险操作二次确认；禁花哨发光。' },
    { id: 'mobile', tags: ['mobile', 'press'], keyEffects: '按压反馈明显；骨架屏；滚动与触控优先。' },
    { id: 'delight', tags: ['landing', 'cta'], keyEffects: 'CTA 微动效（200ms）；滚动进入轻动画；但不影响可读性与性能。' },
    { id: 'snappy', tags: ['snappy', 'reduce-motion'], keyEffects: '响应更利落（90–140ms）；禁用态/加载态更明确；支持减少动效时全部降级为淡入。' },
    { id: 'glass', tags: ['glass', 'overlay'], keyEffects: '浮层/抽屉使用玻璃磨砂+轻阴影；出现/消失淡入淡出（140–180ms）；避免大幅位移。' },
    { id: 'micro', tags: ['micro', 'feedback'], keyEffects: '微交互：按钮 hover 轻亮度变化；成功态用轻勾选动效；错误态用轻抖动（一次）并聚焦字段。' },
    { id: 'calm', tags: ['calm', 'no-bounce'], keyEffects: '更冷静：禁用弹跳/回弹；切换仅淡入淡出；滚动相关动效全部关闭，优先稳定阅读。' },
    { id: 'focus', tags: ['focus', 'keyboard'], keyEffects: '键盘/可达性优先：focus ring 与焦点过渡清晰；Esc 关闭浮层；焦点回归一致；动效不干扰定位。' },
    { id: 'data-dense', tags: ['data-dense', 'table'], keyEffects: '数据密集：表格滚动与吸顶头部稳定；行 hover 高亮不闪烁；筛选/排序反馈即时但克制。' },
  ] as const;
  for (const pt of productTypes) {
    for (const v of fxVariants) {
      effectsProfiles.push({
        id: `fx-${pt}-${v.id}`,
        tags: uniq([pt, ...v.tags]),
        keyEffects: v.keyEffects,
      });
    }
  }
  // 行业专属动效（更细腻的交互质感与风险约束）
  const industryFx: Array<{ industry: string; id: string; tags: string[]; keyEffects: string }> = [
    { industry: '制造业', id: 'ops', tags: ['alarm', 'confirm'], keyEffects: '制造业：告警行闪烁禁止；改用轻脉冲边框+图标；处置按钮 hover/press 反馈清晰；批量操作条固定但不遮挡。' },
    { industry: '制造业', id: 'dispatch', tags: ['workflow', 'press'], keyEffects: '制造业：派工/切换工位使用抽屉侧滑（160–200ms）；成功态用轻提示条；失败态聚焦到字段并高亮。' },
    { industry: '制造业', id: 'shift', tags: ['timeline', 'handover'], keyEffects: '制造业：交接班切换用淡入淡出；记录新增/更新用轻标记而非滚动跳动；大屏刷新避免闪屏。' },
    { industry: '能源', id: 'safety', tags: ['safety', 'audit'], keyEffects: '能源：动效更克制（120–160ms）；危险操作强确认；告警详情切换用淡入淡出，不使用弹跳。' },
    { industry: '能源', id: 'map', tags: ['map', 'hover'], keyEffects: '能源：地图点位 hover 提示轻浮层；点位选中高亮环；列表与地图联动滚动定位，动画克制且不晃。' },
    { industry: '能源', id: 'handover', tags: ['timeline', 'audit'], keyEffects: '能源：交接班/检修记录切换保持滚动位置；展开折叠用高度过渡（160ms）但不弹跳；可复制字段反馈清晰。' },
    { industry: '零售', id: 'fast', tags: ['pos', 'press'], keyEffects: '零售：触控/收银路径按压反馈更强；快捷搜索与条码输入有聚焦高亮；列表滚动性能优先。' },
    { industry: '零售', id: 'promo', tags: ['promo', 'cta'], keyEffects: '零售：促销/优惠提示用轻动效（180–220ms）吸引但不闪烁；价格变动用淡入数字过渡而非跳动。' },
    { industry: '零售', id: 'scan', tags: ['search', 'barcode'], keyEffects: '零售：条码/搜索输入聚焦高亮；识别成功用轻提示条；失败态聚焦并给出可操作建议（重扫/手输）。' },
    { industry: '保险', id: 'trust', tags: ['audit', 'timeline'], keyEffects: '保险：时间线/材料预览切换稳定；字段高亮用背景淡色而非发光；所有状态变化保留可追溯动画（淡入标记）。' },
    { industry: '保险', id: 'docs', tags: ['documents', 'copy'], keyEffects: '保险：长字段/编号提供一键复制反馈；材料预览加载骨架屏；切换标签页保持滚动位置。' },
    { industry: '保险', id: 'compare', tags: ['diff', 'audit'], keyEffects: '保险：条款/材料对比用高亮差异（背景淡色）；切换版本不跳动；危险操作需二次确认且可撤销（如适用）。' },
    { industry: '文旅', id: 'experience', tags: ['media', 'cta'], keyEffects: '文旅：图片卡片 hover 轻上浮+阴影；滚动进入淡入上移；但 CTA 与关键信息不受动效干扰（支持减少动效）。' },
    { industry: '文旅', id: 'gallery', tags: ['media', 'scroll'], keyEffects: '文旅：图片瀑布流/画廊滚动进入渐显；点击图片用轻缩放过渡；文字始终可读（遮罩+对比）。' },
    { industry: '文旅', id: 'booking', tags: ['checkout', 'cta'], keyEffects: '文旅：预订弹层/抽屉出现更克制（160ms）；价格变化用淡入数字过渡；规则查看不跳转离开上下文。' },
  ];
  for (const it of industryFx) {
    if (!industries.includes(it.industry)) continue;
    effectsProfiles.push({
      id: `fx-${it.industry}-${it.id}`,
      tags: uniq([it.industry, 'industry-special', ...it.tags]),
      keyEffects: it.keyEffects,
    });
  }

  const antiPatterns: DomainAvoid[] = [...base.antiPatterns];
  const avoidTemplates: Array<{ id: string; tags: string[]; items: string[] }> = [
    { id: 'noise', tags: ['dashboard', 'admin'], items: ['彩色标签过多造成噪声', '过度渐变背景干扰阅读', '弱对比灰字导致不可读'] },
    { id: 'fin', tags: ['fintech', 'audit'], items: ['霓虹发光与炫酷渐变', '危险操作放在主 CTA', '仅靠颜色表达状态'] },
    { id: 'mobile', tags: ['mobile', 'checkout'], items: ['弹窗过多打断路径', '主次 CTA 权重不清', '触控区域过小'] },
    { id: 'form', tags: ['form-flow', 'gov', '医疗', '政务'], items: ['一次性超长表单无分步', '错误提示不可定位', '必填项不明确'] },
  ];
  const industryKeywords: Record<string, string[]> = {
    SaaS: ['账号', '权限', '组织', '成员', '计费', '审计', '日志', '管理'],
    saas: ['账号', '权限', '组织', '成员', '计费', '审计', '日志', '管理'],
    fintech: ['风控', '合规', '审计', '对账', '交易', '审批', '风险'],
    电商: ['商品', '加购', '优惠券', '结算', '订单', '评价', '促销'],
    物流: ['运单', '调度', '司机', '路线', '签收', '异常', '轨迹'],
    医疗: ['预约', '挂号', '病历', '就诊', '检查', '医生', '排班'],
    教育: ['课程', '学员', '学习', '作业', '进度', '班级', '考试'],
    政务: ['事项', '材料', '申报', '审批', '进度', '办事', '大厅'],
    内容资讯: ['稿件', '频道', '编辑', '发布', '推荐', '栏目', '审核'],
    制造业: ['工单', '设备', '巡检', '工艺', '产线', '质检', 'OEE', '异常'],
    能源: ['告警', '工况', '巡检', '安全', '站点', '负荷', '功率', '检修'],
    零售: ['门店', '库存', '导购', '会员', '收银', '促销', '商品', '补货'],
    保险: ['保单', '理赔', '核保', '风控', '条款', '承保', '客户', '渠道'],
    文旅: ['行程', '门票', '景区', '导览', '酒店', '订单', '活动', '评价'],
  };
  let idx = 0;
  for (const ind of industries) {
    for (const pt of productTypes) {
      // 为每个（行业×产品类型）生成多条反模式变体，确保规模与覆盖面
      for (let v = 0; v < 4; v += 1) {
        const tpl = avoidTemplates[(idx + v) % avoidTemplates.length];
        const kw = industryKeywords[ind] ?? industryKeywords[String(ind).toLowerCase()] ?? [];
        const industrySpecific = kw.slice(0, 2).map((k) => `避免在「${k}」关键路径隐藏关键信息或弱对比展示`);
        antiPatterns.push({
          id: `avoid-${ind}-${pt}-${tpl.id}-v${v + 1}`,
          tags: uniq([ind, pt, ...tpl.tags, `variant-${v + 1}`]),
          items: [...Array.from(tpl.items), ...industrySpecific],
        });
      }
      idx += 1;
    }
  }

  const a11yRules: DomainA11y[] = [...base.a11yRules];
  const a11yTemplates: Array<{ id: string; tags: string[]; rules: string[] }> = [
    { id: 'keyboard', tags: ['global'], rules: ['所有主要操作可键盘完成（Tab/Enter/Esc）', 'focus trap 与焦点回归一致', '表单错误必须可定位'] },
    { id: 'contrast', tags: ['global'], rules: ['正文≥4.5:1，对比不足时自动调整', '状态色同时使用文字/图标', '禁用态仍可识别'] },
    { id: 'mobile', tags: ['mobile'], rules: ['触控区域≥40×40', '底部操作条不遮挡关键内容', '滚动容器可达与回顶策略明确'] },
    { id: 'fin', tags: ['fintech', 'audit'], rules: ['审计字段不省略关键值', '金额与风险等级优先级最高', '危险操作必须二次确认'] },
  ];
  for (const t of a11yTemplates) {
    a11yRules.push({ id: `a11y-${t.id}`, tags: Array.from(t.tags), rules: Array.from(t.rules) });
  }
  // 生成按产品类型的规则集（提升覆盖面与数量）
  const perProduct: Array<{ id: string; tags: string[]; rules: string[] }> = [
    { id: 'table', tags: ['dashboard', 'admin', 'table'], rules: ['表格列可读：对齐一致，重要列不截断关键值', '排序/筛选可键盘访问', '空状态必须解释原因并给出主 CTA'] },
    { id: 'form', tags: ['form-flow'], rules: ['必填项显著标记', '错误提示贴近字段且可聚焦跳转', '分步表单支持保存草稿'] },
    { id: 'approval', tags: ['approval'], rules: ['状态变更必须可追溯（时间线/日志）', '危险操作二次确认并可撤销（如适用）', '审批按钮文案明确且含禁用原因'] },
    { id: 'landing', tags: ['landing'], rules: ['标题层级正确（h1→h2）', 'CTA 文案可理解且不误导', '动效不影响可读性（支持减少动效）'] },
    { id: 'mobile-app', tags: ['mobile', 'mobile-app'], rules: ['触控区域≥40×40', '底部安全区适配', '滚动容器不嵌套过深避免卡顿'] },
  ];
  for (const pt of productTypes) {
    const hit = perProduct.filter((p) => p.tags.includes(pt) || p.tags.includes(pt === 'admin' ? 'admin' : pt));
    const list = hit.length ? hit : perProduct.slice(0, 2);
    for (let i = 0; i < list.length; i += 1) {
      const r = list[i];
      a11yRules.push({
        id: `a11y-${pt}-${r.id}-${i + 1}`,
        tags: uniq([pt, ...r.tags]),
        rules: Array.from(r.rules),
      });
    }
  }
  // 行业补充规则（金融/政务/医疗等）
  const perIndustry: Array<{ id: string; industry: string; rules: string[] }> = [
    { id: 'fintech', industry: 'fintech', rules: ['状态色必须同时用文字/图标表达', '审计字段不可省略关键值', '危险操作二次确认且记录日志'] },
    { id: 'gov', industry: '政务', rules: ['表单校验提示清晰且可定位', '流程状态可追踪', '避免花哨动效与强渐变'] },
    { id: 'medical', industry: '医疗', rules: ['信息层级清晰，避免红色滥用', '关键数据对比度更高', '交互反馈克制且可靠'] },
  ];
  for (const it of perIndustry) {
    a11yRules.push({
      id: `a11y-industry-${it.id}`,
      tags: [it.industry],
      rules: Array.from(it.rules),
    });
  }

  return {
    industries,
    productTypes,
    patterns: uniq(patterns.map((p) => JSON.stringify(p))).map((s) => JSON.parse(s) as DomainPattern),
    colorPalettes: uniq(palettes.map((p) => JSON.stringify(p))).map((s) => JSON.parse(s) as DomainPalette),
    typographyProfiles: uniq(typographyProfiles.map((p) => JSON.stringify(p))).map((s) => JSON.parse(s) as DomainTypography),
    effectsProfiles: uniq(effectsProfiles.map((p) => JSON.stringify(p))).map((s) => JSON.parse(s) as DomainEffects),
    antiPatterns: uniq(antiPatterns.map((p) => JSON.stringify(p))).map((s) => JSON.parse(s) as DomainAvoid),
    a11yRules: uniq(a11yRules.map((p) => JSON.stringify(p))).map((s) => JSON.parse(s) as DomainA11y),
  };
}

function buildScaledStyles(domains: UupmTsEngineData['domains'], anchors: StyleEntry[]): StyleEntry[] {
  const industries = domains.industries;
  const productTypes = domains.productTypes;
  const styles: StyleEntry[] = [...anchors];

  const industryKeywords: Record<string, string[]> = {
    SaaS: ['账号', '权限', '组织', '成员', '计费', '审计', '日志', '管理'],
    saas: ['账号', '权限', '组织', '成员', '计费', '审计', '日志', '管理'],
    fintech: ['风控', '合规', '审计', '对账', '交易', '审批', '风险'],
    电商: ['商品', '加购', '优惠券', '结算', '订单', '评价', '促销'],
    物流: ['运单', '调度', '司机', '路线', '签收', '异常', '轨迹'],
    医疗: ['预约', '挂号', '病历', '就诊', '检查', '医生', '排班'],
    教育: ['课程', '学员', '学习', '作业', '进度', '班级', '考试'],
    政务: ['事项', '材料', '申报', '审批', '进度', '办事', '大厅'],
    内容资讯: ['稿件', '频道', '编辑', '发布', '推荐', '栏目', '审核'],
    制造业: ['工单', '设备', '巡检', '工艺', '产线', '质检', 'OEE', '异常'],
    能源: ['告警', '工况', '巡检', '安全', '站点', '负荷', '功率', '检修'],
    零售: ['门店', '库存', '导购', '会员', '收银', '促销', '商品', '补货'],
    保险: ['保单', '理赔', '核保', '风控', '条款', '承保', '客户', '渠道'],
    文旅: ['行程', '门票', '景区', '导览', '酒店', '订单', '活动', '评价'],
  };

  const anchorIds = new Set(anchors.map((s) => s.id));
  for (const ind of industries) {
    for (const pt of productTypes) {
      const id = `gen-${ind}-${pt}`;
      if (anchorIds.has(id)) continue;

      const tags = uniq([ind, pt, 'ts-engine', 'uiuxpromax', 'design-system']);
      const kw = industryKeywords[ind] ?? industryKeywords[ind.toLowerCase()] ?? [];
      const p =
        pickBestByOverlap(domains.patterns, [ind, pt]) ??
        pickBestByOverlap(domains.patterns, [pt]) ??
        domains.patterns[0];
      const pal =
        pickBestByOverlap(domains.colorPalettes, [ind, pt]) ??
        pickBestByOverlap(domains.colorPalettes, [ind]) ??
        domains.colorPalettes[0];
      const typo =
        pickBestByOverlap(domains.typographyProfiles, [ind, pt]) ??
        pickBestByOverlap(domains.typographyProfiles, [pt]) ??
        domains.typographyProfiles[0];
      const eff =
        pickBestByOverlap(domains.effectsProfiles, [ind, pt]) ??
        pickBestByOverlap(domains.effectsProfiles, [pt]) ??
        domains.effectsProfiles[0];
      const av =
        pickBestByOverlap(domains.antiPatterns, [ind, pt]) ??
        pickBestByOverlap(domains.antiPatterns, [ind]) ??
        domains.antiPatterns[0];

      const industrySet = new Set(industries.map((x) => x.toLowerCase()));
      const productTypeSet = new Set(productTypes.map((x) => x.toLowerCase()));
      const patternTags = (p?.tags ?? []).filter((t) => {
        const n = t.toLowerCase();
        if (industrySet.has(n)) return false;
        if (productTypeSet.has(n) && n !== pt.toLowerCase()) return false;
        return true;
      });

      styles.push({
        id,
        tags: uniq([...tags, ...kw, ...patternTags]),
        style: {
          name: buildStyleName(ind, pt),
          keywords: uniq([pt, ind, 'clean', 'structured', ...(pt === 'mobile-app' ? ['touch-friendly'] : []), ...(pt === 'landing' ? ['hero'] : [])]),
        },
        patternSummary: p.summary,
        colors: pal.colors,
        typography: typo.typography,
        keyEffects: eff.keyEffects,
        antiPatterns: av.items,
      });
    }
  }

  return styles;
}

/**
 * v0.0.2：锚点 + 生成器规模化（对齐 UIUXProMax 覆盖面与知识结构）。
 * - 颜色允许 HEX 或 Tailwind 色名（与快照 schema 一致）
 */
const ANCHOR_UUPM_TS_ENGINE_DATA: UupmTsEngineData = {
  version: 'uupm-ts-engine-data@0.0.2',
  domains: {
    industries: ['SaaS', 'fintech', '电商', '教育', '政务', '医疗', '物流', '内容资讯', '制造业', '能源', '零售', '保险', '文旅'],
    productTypes: [
      'dashboard',
      'admin',
      'landing',
      'list-detail',
      'form-flow',
      'approval',
      'checkout',
      'mobile-app',
    ],
    patterns: [
      {
        id: 'pattern-dashboard-filter-table',
        tags: ['dashboard', 'admin', '表格', '筛选', '分页', 'metrics'],
        summary:
          '页面采用「标题/主CTA → 指标卡片 → 筛选区 → 数据表格 → 分页/批量操作」结构；筛选区固定在表格上方，常用筛选前置，复杂筛选放入抽屉。',
      },
      {
        id: 'pattern-list-detail-split',
        tags: ['list-detail', 'master-detail', '分栏', '详情', '审计'],
        summary:
          '使用左右分栏：左侧列表（可筛选/搜索/分页），右侧详情（字段分组 + 时间线/操作记录）；移动端改为列表→详情两段式导航。',
      },
      {
        id: 'pattern-mobile-grid-cards',
        tags: ['mobile', '电商', '卡片', '双列', 'cta'],
        summary:
          '移动端首屏突出搜索与主促销；商品双列卡片栅格，价格与 CTA 紧邻；底部固定操作条（加购/结算）。',
      },
    ],
    colorPalettes: [
      {
        id: 'palette-dark-neutral-cyan',
        tags: ['saas', 'dashboard', 'neutral', 'dark'],
        colors: {
          primary: '#2563eb',
          secondary: '#64748b',
          cta: '#0ea5e9',
          background: '#0b1220',
          text: '#e5e7eb',
          notes: '深底 + 冷色强调，适合数据密集与长时阅读。',
        },
      },
      {
        id: 'palette-fintech-trust',
        tags: ['fintech', 'trust', 'audit'],
        colors: {
          primary: '#1d4ed8',
          secondary: '#334155',
          cta: '#0ea5e9',
          background: '#0b1220',
          text: '#e2e8f0',
          notes: '状态色需可访问；避免高饱和与霓虹发光。',
        },
      },
      {
        id: 'palette-warm-commerce',
        tags: ['电商', 'mobile', 'warm'],
        colors: {
          primary: '#f97316',
          secondary: '#fb7185',
          cta: '#ea580c',
          background: '#0b1220',
          text: '#e5e7eb',
          notes: 'CTA 与价格优先级最高；促销色使用要克制。',
        },
      },
    ],
    typographyProfiles: [
      {
        id: 'typo-saas-dense',
        tags: ['saas', 'dashboard', 'data-dense'],
        typography:
          '无衬线为主；标题 600/700；表格正文紧凑但不小于 12–13px；数字列对齐与等宽数字优先。',
      },
      {
        id: 'typo-fintech-audit',
        tags: ['fintech', 'audit', '合规'],
        typography:
          '字号略大于常规后台；金额/风险等级加粗；字段名与字段值对比明显；避免弱对比灰字。',
      },
      {
        id: 'typo-mobile-commerce',
        tags: ['电商', 'mobile'],
        typography:
          '移动端触控友好：按钮/标签字号略大；价格数字更醒目；副信息降权但保持可读。',
      },
    ],
    effectsProfiles: [
      {
        id: 'fx-soft-lift',
        tags: ['saas', 'dashboard', 'soft-shadow'],
        keyEffects:
          'hover 上浮 + 阴影增强（150–220ms）；表格行 hover 使用淡色高亮；focus ring 清晰可见。',
      },
      {
        id: 'fx-fintech-confirmation',
        tags: ['fintech', 'confirm', 'danger'],
        keyEffects: '危险操作二次确认；动效克制（150ms）；交互强调“确认感”与审计可追溯。',
      },
      {
        id: 'fx-mobile-press',
        tags: ['mobile', 'press'],
        keyEffects: '按钮按压反馈明显（active scale 0.98）；图片骨架屏；列表/卡片点击态替代 hover。',
      },
    ],
    antiPatterns: [
      {
        id: 'avoid-data-dense',
        tags: ['dashboard', 'data-dense', 'saas'],
        items: ['在数据密集页使用强渐变背景', '过度毛玻璃导致文字对比不足', '过多彩色标签造成视觉噪声'],
      },
      {
        id: 'avoid-fintech',
        tags: ['fintech', 'audit', '合规'],
        items: ['霓虹渐变与炫酷发光效果', '弱对比灰字（影响审计）', '把危险操作放在主 CTA 位置'],
      },
      {
        id: 'avoid-commerce-mobile',
        tags: ['电商', 'mobile', 'checkout'],
        items: ['在移动端使用过密表格', '过多弹窗打断购买路径', '主 CTA 与次 CTA 权重相同导致犹豫'],
      },
    ],
    a11yRules: [
      {
        id: 'a11y-baseline',
        tags: ['global'],
        rules: [
          '文本与背景对比度满足 WCAG AA（正文≥4.5:1，大字≥3:1）',
          '可点击区域≥40×40（移动端优先），按钮状态需含 focus ring',
          '错误信息要可读且可操作：说明原因 + 下一步动作',
        ],
      },
      {
        id: 'a11y-fintech',
        tags: ['fintech'],
        rules: ['状态色必须同时包含文字/图标，不仅靠颜色表达', '审计类列表对齐严格，避免省略关键字段'],
      },
    ],
  },
  styles: [
    {
      id: 'saas-dashboard-neutral',
      tags: [
        'saas',
        'dashboard',
        'admin',
        'b2b',
        '表格',
        '筛选',
        'metrics',
        '企业后台',
        '管理台',
        '权限',
        'rbac',
        '审计',
        'audit',
        '操作记录',
        '日志',
      ],
      style: {
        name: '现代极简 SaaS',
        keywords: ['clean', 'grid', 'rounded-xl', 'soft-shadow', 'data-dense', 'audit-log'],
      },
      patternSummary:
        '采用「顶部导航 + 左侧侧栏 + 右侧主内容」或「顶部 Tabs + 主内容区」结构；主区使用卡片网格承载指标与列表。表格上方固定筛选区（搜索、状态筛选、时间范围），底部提供分页与批量操作入口。信息层级：页面标题/主 CTA 明确，次要操作收敛到更多菜单。',
      colors: {
        primary: '#2563eb',
        secondary: '#64748b',
        cta: '#0ea5e9',
        background: '#0b1220',
        text: '#e5e7eb',
        notes: '背景偏深色以凸显数据卡片；边框与分割线使用低对比灰蓝。',
      },
      typography: '无衬线为主，标题使用 600/700 字重形成层级；表格正文适度紧凑，数值列使用等宽数字或对齐策略提升可读性。',
      keyEffects: 'hover 提升：卡片轻微上浮 + 阴影增强（150–220ms）；表格行 hover 使用淡色高亮；主按钮使用轻微渐变或更高饱和度，但保持克制。',
      antiPatterns: ['在数据密集页使用强渐变背景', '过度毛玻璃导致文字对比不足', '过多彩色标签造成视觉噪声'],
    },
    {
      id: 'fintech-trust',
      tags: ['fintech', 'bank', '支付', '风控', '合规', '金融', '对账', '审批', 'accounting'],
      style: {
        name: '稳重可信 金融后台',
        keywords: ['trust', 'high-contrast', 'structured', 'audit-friendly', 'status-colors'],
      },
      patternSummary:
        '使用「摘要指标条 + 关键列表（交易/审批/对账）」结构；重要状态在列表第一视线呈现（标签+图标+时间）。详情页采用左右分栏：左侧核心字段，右侧时间线/操作记录，强调可追溯性与审计友好。',
      colors: {
        primary: '#1d4ed8',
        secondary: '#334155',
        cta: '#0ea5e9',
        background: '#0b1220',
        text: '#e2e8f0',
        notes: '状态色必须可访问：成功/警告/失败色与背景形成足够对比；避免霓虹与高饱和大面积铺底。',
      },
      typography: '字号略大于常规 SaaS；关键金额/风险等级用更粗字重；表格对齐严格，字段名/字段值区分明显。',
      keyEffects: '交互强调“确认感”：危险操作二次确认；按钮与表格操作区使用清晰 hover/focus ring；动效克制（150ms）。',
      antiPatterns: ['霓虹渐变与炫酷发光效果', '弱对比灰字（影响审计）', '把危险操作放在主 CTA 位置'],
    },
    {
      id: 'ecommerce-mobile-warm',
      tags: ['电商', '购物', '商品', 'mobile', '促销', '优惠券', 'cart', 'checkout'],
      style: {
        name: '温暖高转化 移动电商',
        keywords: ['warm', 'bento', 'strong-cta', 'product-cards', 'touch-friendly'],
      },
      patternSummary:
        '以移动端为主：顶部搜索/分类入口；首屏突出主促销与主类目；商品使用双列卡片栅格，价格/优惠信息紧邻 CTA。结算流程分步清晰：地址→配送→支付→确认，底部固定结算条。',
      colors: {
        primary: '#f97316',
        secondary: '#fb7185',
        cta: '#ea580c',
        background: '#0b1220',
        text: '#e5e7eb',
        notes: '强调 CTA 与价格信息；促销色避免过多叠加，确保信息不“脏”。',
      },
      typography: '移动端大触控：按钮/标签字号略大；价格数字更醒目；副信息（销量、评价）降权显示但保持可读。',
      keyEffects: '按钮按压反馈明显（active scale 0.98）；卡片 hover 在移动端改为点击态；图片骨架屏与渐进加载提升感知性能。',
      antiPatterns: ['在移动端使用过密表格', '过多弹窗打断购买路径', '主 CTA 与次 CTA 权重相同导致犹豫'],
    },
  ],
};

export const UUPM_TS_ENGINE_DATA: UupmTsEngineData = (() => {
  const domains = buildScaledDomains(ANCHOR_UUPM_TS_ENGINE_DATA.domains);
  const styles = buildScaledStyles(domains, ANCHOR_UUPM_TS_ENGINE_DATA.styles);
  const data: UupmTsEngineData = {
    version: ANCHOR_UUPM_TS_ENGINE_DATA.version,
    domains,
    styles,
  };
  const parsed = UupmTsEngineDataSchema.safeParse(data);
  if (!parsed.success) {
    // 生产不可接受：宁可回退锚点数据也不输出坏数据
    return ANCHOR_UUPM_TS_ENGINE_DATA;
  }
  return parsed.data;
})();

