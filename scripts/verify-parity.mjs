#!/usr/bin/env node
/**
 * UIUXProMax Parity 验证（阶段性门禁）：
 * - 基于 Golden30/100 用例，对 TS 引擎输出进行可量化评分并产出报告。
 *
 * 用法：npm run verify:parity
 */
import { spawnSync } from 'child_process';

async function main() {
  const code = `
import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { resolveDesignSystemTsEngine } from './src/lib/design-system/ts-engine/retrieve';
import { expandGoldenFixture } from './src/lib/design-system/ts-engine/golden-expand';

type GoldenCase = {
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

function isHexColor(s: string): boolean {
  return /^#([0-9a-fA-F]{6})$/.test(s);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#([0-9a-fA-F]{6})$/.exec(hex);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function srgbToLinear(v: number): number {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance(rgb: { r: number; g: number; b: number }): number {
  const r = srgbToLinear(rgb.r);
  const g = srgbToLinear(rgb.g);
  const b = srgbToLinear(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a: string, b: string): number | null {
  const ra = hexToRgb(a);
  const rb = hexToRgb(b);
  if (!ra || !rb) return null;
  const la = relativeLuminance(ra);
  const lb = relativeLuminance(rb);
  const L1 = Math.max(la, lb);
  const L2 = Math.min(la, lb);
  return (L1 + 0.05) / (L2 + 0.05);
}

function normalizeIndustry(ind?: string): string | null {
  if (!ind) return null;
  const t = ind.trim().toLowerCase();
  if (!t) return null;
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

const industryKeywords: Record<string, string[]> = {
  saas: ['权限', 'rbac', '审计', 'audit', '日志', '操作记录', '组织', '成员', '计费'],
  fintech: ['风控', '合规', '审计', '对账', '交易', '审批', '风险'],
  电商: ['商品', '加购', '优惠券', '结算', '订单', '评价', '促销'],
  物流: ['运单', '调度', '司机', '路线', '签收', '异常', '轨迹'],
  医疗: ['预约', '挂号', '病历', '就诊', '检查', '医生', '排班'],
  教育: ['课程', '学员', '学习', '作业', '进度', '班级', '考试'],
  政务: ['事项', '材料', '申报', '审批', '进度', '办事', '大厅'],
  内容资讯: ['稿件', '频道', '编辑', '发布', '推荐', '栏目', '审核'],
  制造业: ['工单', '设备', '巡检', '工艺', '产线', '质检', 'oee', '异常', '告警'],
  能源: ['告警', '工况', '巡检', '安全', '站点', '负荷', '功率', '检修'],
  零售: ['门店', '库存', '导购', '会员', '收银', '促销', '商品', '补货'],
  保险: ['保单', '理赔', '核保', '风控', '条款', '承保', '客户', '渠道'],
  文旅: ['行程', '门票', '景区', '导览', '酒店', '订单', '活动', '评价'],
};

function countKeywordHits(texts: string[], keywords: string[]): number {
  if (!keywords.length) return 0;
  const hay = texts.join(' ');
  let hits = 0;
  for (const k of keywords) {
    if (!k) continue;
    if (hay.includes(k)) hits += 1;
  }
  return hits;
}

function buildQuery(i: GoldenCase['input']): string {
  return [
    i.industry ?? '',
    i.description ?? '',
    i.pageDescription ?? '',
    i.nodeLabel ?? '',
    i.prompt ?? '',
    i.projectName ?? '',
  ].filter(Boolean).join(' ');
}

function inferProductTypes(query: string): string[] {
  const t = query.toLowerCase();
  const types: string[] = [];
  if (/(dashboard|看板|指标|metrics)/i.test(t)) types.push('dashboard');
  if (/(landing|官网|落地|定价|faq|hero)/i.test(t)) types.push('landing');
  if (/(approval|审批|审核|风控|合规)/i.test(t)) types.push('approval');
  if (/(form|表单|登记|申报|材料|向导|步骤条)/i.test(t)) types.push('form-flow');
  if (/(checkout|结算|支付方式|提交订单|下单)/i.test(t)) types.push('checkout');
  if (/(mobile|移动|司机|app|小程序)/i.test(t)) types.push('mobile-app');
  if (/(admin|后台|管理台|管理后台|运维|配置中心)/i.test(t)) types.push('admin');
  if (/(list|列表|详情|master-detail|分栏)/i.test(t)) types.push('list-detail');
  return Array.from(new Set(types));
}

type CaseScore = {
  name: string;
  expectStyleId: string;
  gotStyleId: string;
  patternTop1Id: string;
  patternTop1Tags: string[];
  paletteTop1Id: string;
  paletteTop1Tags: string[];
  typographyTop1Id: string;
  typographyTop1Tags: string[];
  effectsTop1Id: string;
  effectsTop1Tags: string[];
  styleHit: 0 | 1;
  antiPatternsIndustryHits: number;
  antiPatternsScore: number; // 0..1
  patternScore: number; // 0..1
  colorsScore: number; // 0..1
  a11yScore: number; // 0..1
  typographyScore: number; // 0..1
  effectsScore: number; // 0..1
  total: number; // 0..100
  notes: string[];
};

function clamp01(x: number): number {
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

function scoreCase(c: GoldenCase): CaseScore {
  const r = resolveDesignSystemTsEngine(c.input);
  const gotStyleId = (r.snapshot.retrievalTrace?.[0]?.id) ?? 'unknown';
  const styleHit: 0 | 1 = gotStyleId === c.expectStyleId ? 1 : 0;
  const patternTrace = (r.snapshot.retrievalTrace ?? []).find((t) => t.domain === 'pattern');
  const paletteTrace = (r.snapshot.retrievalTrace ?? []).find((t) => t.domain === 'palette');
  const typographyTrace = (r.snapshot.retrievalTrace ?? []).find((t) => t.domain === 'typography');
  const effectsTrace = (r.snapshot.retrievalTrace ?? []).find((t) => t.domain === 'effects');
  const patternTop1Id = patternTrace?.id ?? 'unknown';
  const paletteTop1Id = paletteTrace?.id ?? 'unknown';
  const typographyTop1Id = typographyTrace?.id ?? 'unknown';
  const effectsTop1Id = effectsTrace?.id ?? 'unknown';
  const patternTop1Tags = (patternTrace?.matchedTags ?? []).map((x) => String(x));
  const paletteTop1Tags = (paletteTrace?.matchedTags ?? []).map((x) => String(x));
  const typographyTop1Tags = (typographyTrace?.matchedTags ?? []).map((x) => String(x));
  const effectsTop1Tags = (effectsTrace?.matchedTags ?? []).map((x) => String(x));

  const query = buildQuery(c.input);
  const inferred = inferProductTypes(query);
  const industry = normalizeIndustry(c.input.industry ?? '');
  const kw = industry ? (industryKeywords[industry] ?? []) : [];

  const notes: string[] = [];

  // antiPatterns: 阶段性口径（Golden30）
  // - 若行业明确：要求至少 3 条 antiPatterns（视为“行业域已参与融合”，后续 M2 多域融合后再升级为“至少 2 条行业强相关”）
  // - 同时保留关键字命中作为辅助信号
  const antiTexts = r.snapshot.antiPatterns ?? [];
  const antiHits = countKeywordHits(antiTexts, kw);
  const antiHasEnough = antiTexts.length >= 3;
  // 结构化：避免域参与度（retrievalTrace 里存在 avoid 证据）+ 行业强相关（>=2 条）
  const avoidTraceExists = (r.snapshot.retrievalTrace ?? []).some((t) => t.domain === 'avoid');
  const avoidEvidence = r.snapshot.avoidEvidence ?? null;
  const strongRelatedCount = industry
    ? (avoidEvidence?.matchedAntiPatterns?.length ?? 0)
    : antiHits;
  const antiScore = industry
    ? avoidTraceExists && antiHasEnough && strongRelatedCount >= 2
      ? 1
      : antiHasEnough && avoidTraceExists
        ? 0.85
        : clamp01(antiTexts.length / 3)
    : clamp01(antiHits >= 2 ? 1 : antiHits / 2);
  if (industry && !avoidTraceExists) notes.push('avoid 缺少域证据（trace）');
  if (industry && !antiHasEnough) notes.push(\`antiPatterns 条数不足（len=\${antiTexts.length}）\`);
  if (industry && strongRelatedCount < 2)
    notes.push('antiPatterns 行业强相关不足（need>=2, got=' + String(strongRelatedCount) + '）');
  if (industry && kw.length && antiHits < 1) notes.push(\`antiPatterns 行业关键字命中弱（hits=\${antiHits}）\`);

  // pattern: 结构化口径（优先使用 retrievalTrace 的 pattern 域证据）
  // - 若有 inferred productTypes：pattern top1 的 matchedTags 命中任一 productType 视为通过
  // - 若无 inferred：视为通过
  const patternTags = patternTop1Tags;
  const patternPass =
    inferred.length === 0 ? true : inferred.some((pt) => patternTags.includes(pt));
  const patternScore = patternPass ? 1 : 0;
  if (!patternPass) notes.push('pattern 未命中推断形态（trace）');

  // colors: 格式正确 + 文本对比度（简化为 text vs background）
  const bg = r.snapshot.colors?.background ?? '';
  const tx = r.snapshot.colors?.text ?? '';
  const ratio = isHexColor(bg) && isHexColor(tx) ? contrastRatio(bg, tx) : null;
  const colorsScore = ratio ? (ratio >= 4.5 ? 1 : clamp01(ratio / 4.5)) : 0;
  if (!ratio) notes.push('colors 无法计算对比度（非 #RRGGBB）');
  else if (ratio < 4.5) notes.push(\`colors 对比度偏低（ratio=\${ratio.toFixed(2)}）\`);

  // a11y: 结构化门禁（必须存在 a11y 域证据 + a11yRules 至少 3 条）
  const a11yRules = r.snapshot.a11yRules ?? [];
  const a11yTraceExists = (r.snapshot.retrievalTrace ?? []).some((t) => t.domain === 'a11y');
  const a11yScore = a11yTraceExists && a11yRules.length >= 3 ? 1 : 0;
  if (!a11yTraceExists) notes.push('a11y 缺少域证据（trace）');
  if (a11yRules.length < 3) notes.push('a11yRules 条数不足（len=' + a11yRules.length + '）');

  // typography/effects: 结构化门禁（必须存在对应域证据 + 字段非空）
  const typographyTraceExists = (r.snapshot.retrievalTrace ?? []).some((t) => t.domain === 'typography');
  const effectsTraceExists = (r.snapshot.retrievalTrace ?? []).some((t) => t.domain === 'effects');
  const typographyScore = typographyTraceExists && String(r.snapshot.typography ?? '').trim().length > 8 ? 1 : 0;
  const effectsScore = effectsTraceExists && String(r.snapshot.keyEffects ?? '').trim().length > 8 ? 1 : 0;
  if (!typographyTraceExists) notes.push('typography 缺少域证据（trace）');
  if (!effectsTraceExists) notes.push('effects 缺少域证据（trace）');

  // total: 先按当前阶段（Golden30）权重给出 0..100
  const total =
    styleHit * 55 +
    antiScore * 15 +
    patternScore * 10 +
    colorsScore * 15 +
    a11yScore * 5;

  return {
    name: c.name,
    expectStyleId: c.expectStyleId,
    gotStyleId,
    patternTop1Id,
    patternTop1Tags,
    paletteTop1Id,
    paletteTop1Tags,
    typographyTop1Id,
    typographyTop1Tags,
    effectsTop1Id,
    effectsTop1Tags,
    styleHit,
    antiPatternsIndustryHits: antiHits,
    antiPatternsScore: antiScore,
    patternScore,
    colorsScore,
    a11yScore,
    typographyScore,
    effectsScore,
    total: Math.round(total * 10) / 10,
    notes,
  };
}

const root = process.cwd();
const fxPath = path.join(root, '__fixtures__/ts-engine/golden.json');
const fxRaw = JSON.parse(readFileSync(fxPath, 'utf8'));
const fx = expandGoldenFixture(fxRaw) as { engineVersion: string; cases: GoldenCase[] };

const results = fx.cases.map(scoreCase);
const styleHitRate = results.filter((r) => r.styleHit === 1).length / Math.max(1, results.length);
const antiOkRate = results.filter((r) => r.antiPatternsScore >= 1).length / Math.max(1, results.length);
const patternOkRate = results.filter((r) => r.patternScore >= 0.85).length / Math.max(1, results.length);
const colorsOkRate = results.filter((r) => r.colorsScore >= 1).length / Math.max(1, results.length);
const typographyOkRate = results.filter((r) => r.typographyScore >= 1).length / Math.max(1, results.length);
const effectsOkRate = results.filter((r) => r.effectsScore >= 1).length / Math.max(1, results.length);
const avgTotal = results.reduce((a, b) => a + b.total, 0) / Math.max(1, results.length);

const paletteDiversity = new Set(results.map((r) => r.paletteTop1Id)).size / Math.max(1, results.length);
const typographyDiversity = new Set(results.map((r) => r.typographyTop1Id)).size / Math.max(1, results.length);
const effectsDiversity = new Set(results.map((r) => r.effectsTop1Id)).size / Math.max(1, results.length);
const patternDiversity = new Set(results.map((r) => r.patternTop1Id)).size / Math.max(1, results.length);

const LONGTAIL_INDUSTRIES = new Set(['制造业', '能源', '零售', '保险', '文旅']);
function isIndustrySpecial(tags: string[]): boolean {
  return tags.includes('industry-special');
}
const longtailCases = fx.cases
  .map((c, i) => ({ c, r: results[i] }))
  .filter(({ c }) => LONGTAIL_INDUSTRIES.has(normalizeIndustry(String(c.input.industry ?? '')) ?? ''));
const longtailSpecialHitRate =
  longtailCases.length === 0
    ? 1
    : longtailCases.filter(({ r }) => {
        const hits = [
          isIndustrySpecial(r.patternTop1Tags),
          isIndustrySpecial(r.paletteTop1Tags),
          isIndustrySpecial(r.typographyTop1Tags),
          isIndustrySpecial(r.effectsTop1Tags),
        ].filter(Boolean).length;
        return hits >= 2;
      }).length / longtailCases.length;

const summary = {
  engineVersion: fx.engineVersion,
  cases: results.length,
  styleHitRate,
  antiOkRate,
  patternOkRate,
  colorsOkRate,
  typographyOkRate,
  effectsOkRate,
  diversity: {
    patternDiversity,
    paletteDiversity,
    typographyDiversity,
    effectsDiversity,
  },
  longtail: {
    cases: longtailCases.length,
    specialHitRate: longtailSpecialHitRate,
  },
  avgTotal,
  thresholds: {
    styleHitRateTarget: 0.9,
    antiOkRateTarget: 0.85,
    patternOkRateTarget: 0.85,
    colorsOkRateTarget: 0.95,
    typographyOkRateTarget: 0.95,
    effectsOkRateTarget: 0.95,
    patternDiversityTarget: 0.35,
    paletteDiversityTarget: 0.35,
    typographyDiversityTarget: 0.35,
    effectsDiversityTarget: 0.35,
    longtailSpecialHitRateTarget: 0.7,
  },
};

const outDir = path.join(root, 'reports');
mkdirSync(outDir, { recursive: true });
const jsonPath = path.join(outDir, 'parity-report.json');
const mdPath = path.join(outDir, 'parity-report.md');

writeFileSync(jsonPath, JSON.stringify({ summary, results }, null, 2), 'utf8');

const worst = [...results].sort((a, b) => a.total - b.total).slice(0, 8);
const md = [
  '# Parity Report (Golden30)',
  '',
  \`- engineVersion: \${summary.engineVersion}\`,
  \`- cases: \${summary.cases}\`,
  \`- styleHitRate: \${(summary.styleHitRate * 100).toFixed(1)}%\`,
  \`- antiOkRate: \${(summary.antiOkRate * 100).toFixed(1)}%\`,
  \`- patternOkRate: \${(summary.patternOkRate * 100).toFixed(1)}%\`,
  \`- colorsOkRate: \${(summary.colorsOkRate * 100).toFixed(1)}%\`,
  \`- typographyOkRate: \${(summary.typographyOkRate * 100).toFixed(1)}%\`,
  \`- effectsOkRate: \${(summary.effectsOkRate * 100).toFixed(1)}%\`,
  \`- patternDiversity: \${(summary.diversity.patternDiversity * 100).toFixed(1)}%\`,
  \`- paletteDiversity: \${(summary.diversity.paletteDiversity * 100).toFixed(1)}%\`,
  \`- typographyDiversity: \${(summary.diversity.typographyDiversity * 100).toFixed(1)}%\`,
  \`- effectsDiversity: \${(summary.diversity.effectsDiversity * 100).toFixed(1)}%\`,
  \`- longtailSpecialHitRate: \${(summary.longtail.specialHitRate * 100).toFixed(1)}% (cases=\${summary.longtail.cases})\`,
  \`- avgTotal: \${summary.avgTotal.toFixed(1)} / 100\`,
  '',
  '## Worst 8 cases (by total score)',
  '',
  ...worst.map((w) => {
    const notes = w.notes.length ? w.notes.join('；') : '—';
    return \`- **\${w.name}**: total=\${w.total}, style=\${w.gotStyleId} (expect \${w.expectStyleId}); notes=\${notes}\`;
  }),
  '',
  '## Files',
  \`- JSON: \${path.relative(root, jsonPath)}\`,
  \`- Markdown: \${path.relative(root, mdPath)}\`,
  '',
].join('\\n');

writeFileSync(mdPath, md, 'utf8');

console.log('[parity] wrote', path.relative(root, jsonPath));
console.log('[parity] wrote', path.relative(root, mdPath));
console.log('[parity] summary', summary);

// 门禁（达到目标样本量后启用阈值）
if (summary.cases >= 100) {
  const fail =
    summary.styleHitRate < summary.thresholds.styleHitRateTarget ||
    summary.antiOkRate < summary.thresholds.antiOkRateTarget ||
    summary.patternOkRate < summary.thresholds.patternOkRateTarget ||
    summary.colorsOkRate < summary.thresholds.colorsOkRateTarget;
  if (fail) {
    console.error('[parity] FAIL thresholds not met', summary.thresholds);
    process.exit(1);
  }
}

// Golden120+：新增“审美细腻度/长尾覆盖”门禁（typography/effects + 多样性）
if (summary.cases >= 120) {
  const fail =
    summary.typographyOkRate < summary.thresholds.typographyOkRateTarget ||
    summary.effectsOkRate < summary.thresholds.effectsOkRateTarget ||
    summary.diversity.patternDiversity < summary.thresholds.patternDiversityTarget ||
    summary.diversity.paletteDiversity < summary.thresholds.paletteDiversityTarget ||
    summary.diversity.typographyDiversity < summary.thresholds.typographyDiversityTarget ||
    summary.diversity.effectsDiversity < summary.thresholds.effectsDiversityTarget ||
    summary.longtail.specialHitRate < summary.thresholds.longtailSpecialHitRateTarget;
  if (fail) {
    console.error('[parity] FAIL extended thresholds not met', summary.thresholds);
    process.exit(1);
  }
}
`;

  const res = spawnSync('npx', ['tsx', '-e', code], { cwd: process.cwd(), stdio: 'inherit', shell: false });
  process.exit(res.status ?? 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

