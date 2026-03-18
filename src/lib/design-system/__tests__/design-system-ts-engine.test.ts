/**
 * TS 引擎：可复现检索 + 快照形状（生产兜底）
 */
import { safeParseDesignSystemSnapshot } from '@/types/design-system-snapshot';
import { resolveDesignSystemTsEngine } from '../ts-engine/retrieve';
import { UUPM_TS_ENGINE_DATA } from '../ts-engine/uupm-data';

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
  } catch (e) {
    console.error(`  ❌ ${name}:`, e);
    throw e;
  }
}

function assert(cond: boolean, msg?: string) {
  if (!cond) throw new Error(msg ?? 'assert failed');
}

console.log('\n📦 design-system TS engine tests\n');

try {
  test('data scale: domains and styles meet minimum counts', () => {
    const d = UUPM_TS_ENGINE_DATA;
    assert(d.styles.length >= 60, `styles: ${d.styles.length}`);
    assert(d.domains.patterns.length >= 50, `patterns: ${d.domains.patterns.length}`);
    assert(d.domains.colorPalettes.length >= 80, `palettes: ${d.domains.colorPalettes.length}`);
    assert(d.domains.antiPatterns.length >= 200, `antiPatterns: ${d.domains.antiPatterns.length}`);
    assert(d.domains.a11yRules.length >= 10, `a11yRules: ${d.domains.a11yRules.length}`);
  });

  test('returns snapshot with ts_engine source and valid markdownBlock', () => {
    const r = resolveDesignSystemTsEngine({
      projectName: 'X',
      industry: '金融',
      description: '风控审批与对账后台',
      nodeLabel: '交易审批列表',
      pageDescription: '需要表格、筛选、状态标签',
      prompt: '',
    });
    assert(r.snapshot.source === 'ts_engine');
    assert(r.markdown.includes('TS 引擎'));
    assert(r.markdown.includes('A11Y'));
    assert(typeof r.snapshot.contextHash === 'string' && r.snapshot.contextHash.length > 0);
    const rt = r.snapshot.retrievalTrace ?? [];
    assert(rt.length > 0);
    assert(rt.some((t) => t.domain === 'style'));
    assert(rt.some((t) => t.domain === 'pattern'));
    assert(rt.some((t) => t.domain === 'palette'));
    assert(rt.some((t) => t.domain === 'a11y'));
    const p = safeParseDesignSystemSnapshot(r.snapshot);
    assert(p.ok);
  });

  test('deterministic: same input yields same style name', () => {
    const a = resolveDesignSystemTsEngine({
      projectName: 'X',
      industry: 'fintech',
      description: 'bank dashboard',
      nodeLabel: '审批',
      pageDescription: 'audit',
      prompt: '',
    });
    const b = resolveDesignSystemTsEngine({
      projectName: 'X',
      industry: 'fintech',
      description: 'bank dashboard',
      nodeLabel: '审批',
      pageDescription: 'audit',
      prompt: '',
    });
    assert(a.snapshot.style.name === b.snapshot.style.name);
    assert(a.snapshot.engineVersion === b.snapshot.engineVersion);
    assert(a.snapshot.contextHash === b.snapshot.contextHash);
  });

  console.log('\n✅ design-system TS engine: all passed\n');
} catch (e) {
  console.error('\n❌ design-system TS engine failed\n');
  process.exit(1);
}

