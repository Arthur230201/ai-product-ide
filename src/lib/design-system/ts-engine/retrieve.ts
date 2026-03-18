import type { DesignSystemSnapshot } from '@/types/design-system-snapshot';
import { tokenizeForSearch } from './tokenize';
import { UUPM_TS_ENGINE_DATA } from './uupm-data';
import { stableHash } from '@/lib/ai/gateway-queue';

type RetrieveInput = {
  projectName?: string;
  industry?: string;
  description?: string;
  nodeLabel: string;
  pageDescription?: string;
  prompt?: string;
};

function buildQuery(i: RetrieveInput): string {
  return [
    i.industry ?? '',
    i.description ?? '',
    i.pageDescription ?? '',
    i.nodeLabel,
    i.prompt ?? '',
    i.projectName ?? '',
  ]
    .filter(Boolean)
    .join(' ')
    .slice(0, 4000);
}

function normalizeToken(s: string): string {
  return s.trim().toLowerCase();
}

function normalizeIndustry(ind?: string): string | null {
  if (!ind) return null;
  const t = normalizeToken(ind);
  if (!t) return null;
  // normalize common variants
  if (t.includes('finance') || t.includes('fintech') || t.includes('金融') || t.includes('支付')) return 'fintech';
  if (t.includes('saas')) return 'saas';
  if (t.includes('电商') || t.includes('ecommerce') || t.includes('shop')) return '电商';
  if (t.includes('物流') || t.includes('logistics')) return '物流';
  if (t.includes('医疗') || t.includes('medical')) return '医疗';
  if (t.includes('教育') || t.includes('education')) return '教育';
  if (t.includes('政务') || t.includes('gov')) return '政务';
  if (t.includes('内容') || t.includes('资讯') || t.includes('news') || t.includes('media')) return '内容资讯';
  if (t.includes('制造') || t.includes('工厂') || t.includes('生产') || t.includes('mes')) return '制造业';
  if (t.includes('能源') || t.includes('电力') || t.includes('电站') || t.includes('power')) return '能源';
  if (t.includes('零售') || t.includes('门店') || t.includes('retail')) return '零售';
  if (t.includes('保险') || t.includes('理赔') || t.includes('insur')) return '保险';
  if (t.includes('文旅') || t.includes('旅游') || t.includes('景区') || t.includes('travel')) return '文旅';
  return ind;
}

function inferProductTypes(query: string): string[] {
  const t = query.toLowerCase();
  const types: string[] = [];
  const hasDashboard = /(dashboard|看板|指标|metrics)/i.test(t);
  // "管理" 是弱信号：当明确为 dashboard 时，不要把它误判成 admin
  if (/(admin|后台|管理台|管理后台|运维|配置中心)/i.test(t) || (!hasDashboard && /(管理)/i.test(t))) types.push('admin');
  if (/(mobile|移动|司机|app|小程序)/i.test(t)) types.push('mobile-app');
  if (/(landing|官网|落地|定价|faq|hero)/i.test(t)) types.push('landing');
  if (/(checkout|结算|支付方式|提交订单|下单)/i.test(t)) types.push('checkout');
  if (/(approval|审批|审核|风控|合规)/i.test(t)) types.push('approval');
  if (/(form|表单|登记|申报|材料|向导|步骤条)/i.test(t)) types.push('form-flow');
  if (/(list|列表|管理|详情|master-detail|分栏)/i.test(t)) types.push('list-detail');
  if (hasDashboard) types.push('dashboard');
  return Array.from(new Set(types));
}

function hasAnyTag(tags: readonly string[], candidates: readonly string[]): boolean {
  const set = new Set(tags.map((x) => normalizeToken(x)));
  return candidates.some((c) => set.has(normalizeToken(c)));
}

type BM25Index = {
  docFreq: Map<string, number>;
  avgDocLen: number;
  docs: Array<{ id: string; tokens: string[] }>;
};

function buildIndex(docs: Array<{ id: string; text: string }>): BM25Index {
  const tokenizedDocs = docs.map((d) => ({ id: d.id, tokens: tokenizeForSearch(d.text) }));
  const docFreq = new Map<string, number>();
  let totalLen = 0;
  for (const d of tokenizedDocs) {
    totalLen += d.tokens.length;
    const seen = new Set(d.tokens);
    for (const t of seen) {
      docFreq.set(t, (docFreq.get(t) ?? 0) + 1);
    }
  }
  const avgDocLen = tokenizedDocs.length ? totalLen / tokenizedDocs.length : 0;
  return { docFreq, avgDocLen, docs: tokenizedDocs };
}

function bm25Score(index: BM25Index, queryTokens: readonly string[], docTokens: readonly string[]): number {
  if (queryTokens.length === 0 || docTokens.length === 0) return 0;
  const k1 = 1.2;
  const b = 0.75;
  const N = index.docs.length || 1;
  const tf = new Map<string, number>();
  for (const t of docTokens) tf.set(t, (tf.get(t) ?? 0) + 1);

  const dl = docTokens.length;
  let score = 0;
  for (const q of queryTokens) {
    const f = tf.get(q) ?? 0;
    if (f === 0) continue;
    const df = index.docFreq.get(q) ?? 0;
    const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
    const denom = f + k1 * (1 - b + b * (dl / (index.avgDocLen || 1)));
    score += idf * ((f * (k1 + 1)) / denom);
  }
  return score;
}

type Ranked<T> = { item: T; score: number };

function stableHash32(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function pickStableVariant<T>(args: {
  ranked: Array<Ranked<T>>;
  maxK: number;
  stableSeed: string;
  salt: string;
}): T | null {
  const k = Math.max(1, Math.min(args.maxK, args.ranked.length));
  if (!args.ranked.length) return null;
  if (k === 1) return args.ranked[0]!.item;
  const n = Math.abs(stableHash32(`${args.stableSeed}|${args.salt}`));
  // 轻偏向 top1：0(60%) / 1(30%) / 2(10%)...（可复现）
  const bucket = n % 10;
  const idx = bucket < 6 ? 0 : bucket < 9 ? 1 : 2;
  return args.ranked[Math.min(idx, k - 1)]!.item;
}

function pickStableVariantUniform<T>(args: {
  ranked: Array<Ranked<T>>;
  maxK: number;
  stableSeed: string;
  salt: string;
}): T | null {
  const k = Math.max(1, Math.min(args.maxK, args.ranked.length));
  if (!args.ranked.length) return null;
  if (k === 1) return args.ranked[0]!.item;
  const n = Math.abs(stableHash32(`${args.stableSeed}|${args.salt}`));
  const idx = n % k;
  return args.ranked[idx]!.item;
}

function pickStableVariantUniformGuarded<T extends { tags?: string[] }>(args: {
  ranked: Array<Ranked<T>>;
  maxK: number;
  stableSeed: string;
  salt: string;
  requiredAnyTags: readonly string[];
}): T | null {
  if (!args.requiredAnyTags.length) {
    return pickStableVariantUniform(args);
  }
  const filtered = args.ranked.filter((r) => hasAnyTag((r.item.tags ?? []) as string[], args.requiredAnyTags));
  if (filtered.length) {
    return pickStableVariantUniform({ ranked: filtered, maxK: args.maxK, stableSeed: args.stableSeed, salt: args.salt });
  }
  return pickStableVariantUniform(args);
}

function pickStableVariantUniformPreferTag<T extends { tags?: string[] }>(args: {
  ranked: Array<Ranked<T>>;
  maxK: number;
  stableSeed: string;
  salt: string;
  preferTag: string;
  preferAnyTags?: readonly string[];
}): T | null {
  const preferred = args.ranked.filter((r) => {
    const tags = (r.item.tags ?? []) as string[];
    if (!tags.includes(args.preferTag)) return false;
    if (!args.preferAnyTags?.length) return true;
    return args.preferAnyTags.some((t) => tags.includes(t));
  });
  if (preferred.length) {
    return pickStableVariantUniform({
      ranked: preferred,
      maxK: Math.min(args.maxK, preferred.length),
      stableSeed: args.stableSeed,
      salt: `${args.salt}|prefer:${args.preferTag}`,
    });
  }
  return pickStableVariantUniform({
    ranked: args.ranked,
    maxK: args.maxK,
    stableSeed: args.stableSeed,
    salt: args.salt,
  });
}

function tracesWithPicked<T extends { id: string; tags: string[] }>(args: {
  domain: string;
  ranked: Array<Ranked<T>>;
  pickedId: string;
  topK: number;
}): Array<{ domain: string; id: string; score: number; matchedTags?: string[] }> {
  const picked = args.ranked.find((r) => r.item.id === args.pickedId);
  const out: Array<{ domain: string; id: string; score: number; matchedTags?: string[] }> = [];
  if (picked) {
    out.push({
      domain: args.domain,
      id: picked.item.id,
      score: picked.score,
      matchedTags: picked.item.tags.slice(0, 12),
    });
  }
  for (const r of args.ranked) {
    if (out.length >= args.topK) break;
    if (r.item.id === args.pickedId) continue;
    out.push({
      domain: args.domain,
      id: r.item.id,
      score: r.score,
      matchedTags: r.item.tags.slice(0, 12),
    });
  }
  return out;
}

function applyDomainTagBoost(args: {
  score: number;
  itemTags: readonly string[];
  normalizedIndustry: string | null;
  rawIndustry: string | undefined;
  inferredProductTypes: readonly string[];
}): number {
  let score = args.score;
  if (args.normalizedIndustry) {
    if (hasAnyTag(args.itemTags, [args.normalizedIndustry, args.rawIndustry ?? ''])) score += 40;
    const otherIndustries = ['fintech', 'saas', '电商', '物流', '医疗', '教育', '政务', '内容资讯'];
    const docIndustries = otherIndustries.filter((x) => hasAnyTag(args.itemTags, [x]));
    if (docIndustries.length && !docIndustries.some((x) => x === args.normalizedIndustry)) score -= 40;
  }
  if (args.inferredProductTypes.length) {
    for (const pt of args.inferredProductTypes) {
      if (hasAnyTag(args.itemTags, [pt])) score += 10;
    }
  }
  return score;
}

function rankDomain<T extends { id: string; tags: string[] }>(args: {
  domain: string;
  items: readonly T[];
  toText: (item: T) => string;
  qTokens: readonly string[];
  normalizedIndustry: string | null;
  rawIndustry: string | undefined;
  inferredProductTypes: readonly string[];
  topK: number;
}): { ranked: Array<Ranked<T>>; traces: Array<{ domain: string; id: string; score: number; matchedTags?: string[] }> } {
  const docs = args.items.map((it) => ({ id: it.id, text: args.toText(it) }));
  const index = buildIndex(docs);
  const ranked = args.items
    .map((it) => {
      const doc = index.docs.find((d) => d.id === it.id);
      const base = bm25Score(index, args.qTokens, doc?.tokens ?? []);
      const score = applyDomainTagBoost({
        score: base,
        itemTags: it.tags,
        normalizedIndustry: args.normalizedIndustry,
        rawIndustry: args.rawIndustry,
        inferredProductTypes: args.inferredProductTypes,
      });
      return { item: it, score };
    })
    .sort((a, b) => b.score - a.score);

  const traces = ranked.slice(0, args.topK).map((r) => ({
    domain: args.domain,
    id: r.item.id,
    score: r.score,
    matchedTags: r.item.tags.slice(0, 12),
  }));

  return { ranked, traces };
}

function toMarkdown(block: {
  patternSummary: string;
  styleName: string;
  styleKeywords: string[];
  colors: { primary: string; secondary: string; cta: string; background: string; text: string; notes?: string };
  typography: string;
  keyEffects: string;
  antiPatterns: string[];
  a11yRules: string[];
}): string {
  const kw = block.styleKeywords.length ? block.styleKeywords.join('、') : '—';
  const avoid = block.antiPatterns.length ? block.antiPatterns.map((a) => `- ${a}`).join('\n') : '- （无额外禁止项）';
  const a11y = block.a11yRules.length ? block.a11yRules.map((r) => `- ${r}`).join('\n') : '- （未提供额外规则）';
  return `
# [本次推荐设计系统 · TS 引擎]

以下由内置数据与规则检索组合生成，**建议在整页 UI 中统一落实**。该结果可复现（同输入 → 同输出），用于生产环境无 Python 时的 UIUXProMax 子集能力。

## PATTERN（版式与信息架构）
${block.patternSummary}

## STYLE
- **名称**：${block.styleName}
- **关键词**：${kw}

## COLORS
| 角色 | 建议色 |
|------|--------|
| Primary | ${block.colors.primary} |
| Secondary | ${block.colors.secondary} |
| CTA | ${block.colors.cta} |
| Background | ${block.colors.background} |
| Text | ${block.colors.text} |
${block.colors.notes ? `\n*说明：${block.colors.notes}*\n` : ''}

## TYPOGRAPHY
${block.typography}

## KEY EFFECTS
${block.keyEffects}

## A11Y（可访问性）
${a11y}

## AVOID（反模式）
${avoid}
`.trim();
}

function getIndustryKeywords(industry: string | null, rawIndustry: string | undefined): string[] {
  if (!industry && !rawIndustry) return [];
  const key = industry ?? rawIndustry ?? '';
  const map: Record<string, string[]> = {
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
  return map[key] ?? map[String(key).toLowerCase()] ?? [];
}

function buildAvoidEvidence(args: {
  antiPatterns: readonly string[];
  normalizedIndustry: string | null;
  rawIndustry: string | undefined;
}): NonNullable<DesignSystemSnapshot['avoidEvidence']> {
  const kw = getIndustryKeywords(args.normalizedIndustry, args.rawIndustry);
  const matchedAntiPatterns: string[] = [];
  const matchedIndustryKeywords: string[] = [];

  if (!kw.length) {
    return {
      industry: args.normalizedIndustry,
      matchedIndustryKeywords: [],
      matchedAntiPatterns: [],
    };
  }

  for (const item of args.antiPatterns) {
    const hits = kw.filter((k) => item.includes(k));
    if (!hits.length) continue;
    matchedAntiPatterns.push(item);
    matchedIndustryKeywords.push(...hits);
  }

  return {
    industry: args.normalizedIndustry,
    matchedIndustryKeywords: Array.from(new Set(matchedIndustryKeywords)),
    matchedAntiPatterns: Array.from(new Set(matchedAntiPatterns)),
  };
}

export function resolveDesignSystemTsEngine(input: RetrieveInput): { markdown: string; snapshot: DesignSystemSnapshot } {
  const query = buildQuery(input);
  const qTokens = tokenizeForSearch(query);
  const normalizedIndustry = normalizeIndustry(input.industry);
  const inferredProductTypes = inferProductTypes(query);
  const LONGTAIL_INDUSTRIES = new Set(['制造业', '能源', '零售', '保险', '文旅']);
  const isLongtailIndustry = normalizedIndustry ? LONGTAIL_INDUSTRIES.has(normalizedIndustry) : false;

  const anchorBoost: Record<string, { industry: string | null; boost: number }> = {
    'saas-dashboard-neutral': { industry: 'saas', boost: 260 },
    'fintech-trust': { industry: 'fintech', boost: 90 },
    'ecommerce-mobile-warm': { industry: '电商', boost: 160 },
  };

  const styleDocs = UUPM_TS_ENGINE_DATA.styles.map((s) => ({
    id: s.id,
    text: [
      ...s.tags,
      s.style.name,
      ...s.style.keywords,
      s.patternSummary,
      s.typography,
      s.keyEffects,
      ...s.antiPatterns,
    ].join(' '),
  }));
  const styleIndex = buildIndex(styleDocs);
  const rankedStyles = UUPM_TS_ENGINE_DATA.styles
    .map((s) => {
      const doc = styleIndex.docs.find((d) => d.id === s.id);
      let score = bm25Score(styleIndex, qTokens, doc?.tokens ?? []);

      // --- Explicit boosts: prevent generic tokens overpowering domain intent ---
      if (normalizedIndustry) {
        // strong boost when industry matches
        if (hasAnyTag(s.tags, [normalizedIndustry, input.industry ?? ''])) score += 220;
        // extra boost when raw industry tag matches exactly (e.g. "SaaS")
        if (input.industry && s.tags.includes(input.industry)) score += 180;
        // light penalty for obvious mismatches when doc claims another industry
        const otherIndustries = ['fintech', 'saas', '电商', '物流', '医疗', '教育', '政务', '内容资讯'];
        const docIndustries = otherIndustries.filter((x) => hasAnyTag(s.tags, [x]));
        if (docIndustries.length && !docIndustries.some((x) => x === normalizedIndustry)) score -= 80;
      }
      if (inferredProductTypes.length) {
        // productType weighted boosts
        const weights: Record<string, number> = {
          'admin': 5,
          'dashboard': 4,
          'mobile-app': 8,
          'landing': 4,
          'checkout': 4,
          'approval': 4,
          'form-flow': 4,
          'list-detail': 3,
        };
        for (const pt of inferredProductTypes) {
          if (hasAnyTag(s.tags, [pt])) score += weights[pt] ?? 2;
        }
        // shape constraints: penalize candidates that don't match inferred intent
        const penalties: Record<string, number> = {
          'approval': 30,
          'form-flow': 40,
          'checkout': 8,
          'landing': 6,
          'mobile-app': 6,
          'dashboard': 6,
        };
        for (const pt of inferredProductTypes) {
          const p = penalties[pt];
          if (!p) continue;
          if (!hasAnyTag(s.tags, [pt])) score -= p;
        }
      }

      // curated anchors should win in their native industries
      const ab = anchorBoost[s.id];
      const allowAnchorInThisFlow =
        inferredProductTypes.length === 0 ||
        inferredProductTypes.every((pt) => !['landing', 'approval', 'form-flow', 'mobile-app', 'checkout'].includes(pt));
      const allowEcommerceAnchor = s.id === 'ecommerce-mobile-warm' && (normalizedIndustry === '电商');
      if (ab && (allowAnchorInThisFlow || allowEcommerceAnchor) && (!ab.industry || ab.industry === normalizedIndustry)) {
        score += ab.boost;
      }

      return { s, score };
    })
    .sort((a, b) => b.score - a.score);

  const pickedStyle = rankedStyles[0]?.s ?? UUPM_TS_ENGINE_DATA.styles[0];
  const styleTraces = rankedStyles.slice(0, 3).map((r) => ({
    domain: 'style',
    id: r.s.id,
    score: r.score,
    matchedTags: r.s.tags.slice(0, 12),
  }));

  const domains = UUPM_TS_ENGINE_DATA.domains;
  const patternRank = rankDomain({
    domain: 'pattern',
    items: domains.patterns,
    toText: (p) => [...p.tags, p.summary].join(' '),
    qTokens,
    normalizedIndustry,
    rawIndustry: input.industry,
    inferredProductTypes,
    topK: 3,
  });
  const paletteRank = rankDomain({
    domain: 'palette',
    items: domains.colorPalettes,
    toText: (p) => [
      ...p.tags,
      p.colors.primary,
      p.colors.secondary,
      p.colors.cta,
      p.colors.background,
      p.colors.text,
      p.colors.notes ?? '',
    ].join(' '),
    qTokens,
    normalizedIndustry,
    rawIndustry: input.industry,
    inferredProductTypes,
    topK: 3,
  });
  const typoRank = rankDomain({
    domain: 'typography',
    items: domains.typographyProfiles,
    toText: (t) => [...t.tags, t.typography].join(' '),
    qTokens,
    normalizedIndustry,
    rawIndustry: input.industry,
    inferredProductTypes,
    topK: 3,
  });
  const fxRank = rankDomain({
    domain: 'effects',
    items: domains.effectsProfiles,
    toText: (f) => [...f.tags, f.keyEffects].join(' '),
    qTokens,
    normalizedIndustry,
    rawIndustry: input.industry,
    inferredProductTypes,
    topK: 3,
  });
  const avoidRank = rankDomain({
    domain: 'avoid',
    items: domains.antiPatterns,
    toText: (a) => [...a.tags, ...a.items].join(' '),
    qTokens,
    normalizedIndustry,
    rawIndustry: input.industry,
    inferredProductTypes,
    topK: 3,
  });
  const a11yRank = rankDomain({
    domain: 'a11y',
    items: domains.a11yRules,
    toText: (a) => [...a.tags, ...a.rules].join(' '),
    qTokens,
    normalizedIndustry,
    rawIndustry: input.industry,
    inferredProductTypes,
    topK: 3,
  });

  const pickedPattern =
    (isLongtailIndustry
      ? pickStableVariantUniformGuarded({
          ranked: patternRank.ranked.filter(
            (r) =>
              ((r.item.tags ?? []) as string[]).includes('industry-special') &&
              ((r.item.tags ?? []) as string[]).includes(normalizedIndustry ?? ''),
          ),
          maxK: 8,
          stableSeed: query,
          salt: 'pattern|industry-special',
          requiredAnyTags: inferredProductTypes,
        })
      : null) ??
    pickStableVariantUniformGuarded({
      ranked: patternRank.ranked,
      maxK: 8,
      stableSeed: query,
      salt: 'pattern',
      requiredAnyTags: inferredProductTypes,
    }) ??
    domains.patterns[0];
  const pickedPalette =
    (isLongtailIndustry
      ? pickStableVariantUniformPreferTag({
          ranked: paletteRank.ranked,
          maxK: 10,
          stableSeed: query,
          salt: 'palette',
          preferTag: 'industry-special',
          preferAnyTags: normalizedIndustry ? [normalizedIndustry] : undefined,
        })
      : pickStableVariantUniform({ ranked: paletteRank.ranked, maxK: 10, stableSeed: query, salt: 'palette' })) ??
    domains.colorPalettes[0];
  const pickedTypo =
    (isLongtailIndustry
      ? pickStableVariantUniformPreferTag({
          ranked: typoRank.ranked,
          maxK: 10,
          stableSeed: query,
          salt: 'typography',
          preferTag: 'industry-special',
          preferAnyTags: normalizedIndustry ? [normalizedIndustry] : undefined,
        })
      : pickStableVariantUniform({ ranked: typoRank.ranked, maxK: 10, stableSeed: query, salt: 'typography' })) ??
    domains.typographyProfiles[0];
  const pickedFx =
    (isLongtailIndustry
      ? pickStableVariantUniformPreferTag({
          ranked: fxRank.ranked,
          maxK: 10,
          stableSeed: query,
          salt: 'effects',
          preferTag: 'industry-special',
          preferAnyTags: normalizedIndustry ? [normalizedIndustry] : undefined,
        })
      : pickStableVariantUniform({ ranked: fxRank.ranked, maxK: 10, stableSeed: query, salt: 'effects' })) ??
    domains.effectsProfiles[0];
  const pickedAvoid = avoidRank.ranked[0]?.item ?? domains.antiPatterns[0];
  const pickedA11y = a11yRank.ranked[0]?.item ?? domains.a11yRules[0];

  const markdownBlock = toMarkdown({
    patternSummary: pickedPattern.summary,
    styleName: pickedStyle.style.name,
    styleKeywords: pickedStyle.style.keywords,
    colors: pickedPalette.colors,
    typography: pickedTypo.typography,
    keyEffects: pickedFx.keyEffects,
    antiPatterns: pickedAvoid.items,
    a11yRules: pickedA11y.rules,
  });

  const avoidEvidence = buildAvoidEvidence({
    antiPatterns: pickedAvoid.items,
    normalizedIndustry,
    rawIndustry: input.industry,
  });

  const retrievalTrace = [
    ...styleTraces,
    ...tracesWithPicked({ domain: 'pattern', ranked: patternRank.ranked, pickedId: pickedPattern.id, topK: 3 }),
    ...tracesWithPicked({ domain: 'palette', ranked: paletteRank.ranked, pickedId: pickedPalette.id, topK: 3 }),
    ...tracesWithPicked({ domain: 'typography', ranked: typoRank.ranked, pickedId: pickedTypo.id, topK: 3 }),
    ...tracesWithPicked({ domain: 'effects', ranked: fxRank.ranked, pickedId: pickedFx.id, topK: 3 }),
    ...avoidRank.traces,
    ...a11yRank.traces,
  ];

  const snapshot: DesignSystemSnapshot = {
    schemaVersion: 1,
    engineVersion: UUPM_TS_ENGINE_DATA.version,
    source: 'ts_engine',
    createdAt: new Date().toISOString(),
    pattern: { summary: pickedPattern.summary },
    style: { name: pickedStyle.style.name, keywords: pickedStyle.style.keywords },
    colors: pickedPalette.colors,
    typography: pickedTypo.typography,
    keyEffects: pickedFx.keyEffects,
    antiPatterns: pickedAvoid.items,
    avoidEvidence,
    a11yRules: pickedA11y.rules,
    contextHash: stableHash(`${UUPM_TS_ENGINE_DATA.version}|${query}`),
    retrievalTrace,
    ruleTrace: [
      'ts_engine:bm25(style)+boosts',
      'ts_engine:bm25(pattern)',
      'ts_engine:bm25(palette)',
      'ts_engine:bm25(typography)',
      'ts_engine:bm25(effects)',
      'ts_engine:bm25(avoid)',
      'ts_engine:bm25(a11y)',
      'ts_engine:fusion(snapshot)',
    ],
    markdownBlock,
  };

  return { markdown: markdownBlock, snapshot };
}

