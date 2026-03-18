/**
 * M1：截断、快照解析、PRD 附录格式化
 */
import { truncateDesignSystemMarkdown } from '../truncate-design-system-markdown';
import { safeParseDesignSystemSnapshot } from '@/types/design-system-snapshot';
import { formatDesignSystemPrdMarkdown } from '../format-design-system-prd-appendix';

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

console.log('\n📦 design-system M1 tests\n');

const minimalSnapshot = {
  schemaVersion: 1 as const,
  engineVersion: 'app@test',
  source: 'llm_draft' as const,
  createdAt: new Date().toISOString(),
  pattern: { summary: '列表+详情' },
  style: { name: '极简 SaaS', keywords: ['清晰', '留白'] },
  colors: {
    primary: '#2563eb',
    secondary: '#64748b',
    cta: '#0ea5e9',
    background: '#f8fafc',
    text: '#0f172a',
  },
  typography: '系统无衬线',
  keyEffects: '轻阴影',
  antiPatterns: ['过度渐变'],
  markdownBlock: '# DS\n\n内容',
};

try {
  test('truncate: short string unchanged', () => {
    const s = 'hello 设计系统';
    assert(truncateDesignSystemMarkdown(s) === s);
  });

  test('truncate: large ascii caps at default max', () => {
    const big = 'x'.repeat(20_000);
    const out = truncateDesignSystemMarkdown(big);
    assert(out.length < big.length);
    assert(out.includes('截断'));
    assert(Buffer.byteLength(out, 'utf8') <= 8192 + 200);
  });

  test('truncate: utf8 does not split codepoint', () => {
    const unit = '你'; // 3 bytes in utf8
    const rep = unit.repeat(4000);
    const out = truncateDesignSystemMarkdown(rep);
    assert(!out.includes('\ufffd'));
    const end = out.replace(/\n\n…[\s\S]*$/, '');
    try {
      Buffer.from(end, 'utf8').toString('utf8');
    } catch {
      throw new Error('invalid utf8 tail');
    }
  });

  test('safeParse: minimal snapshot ok', () => {
    const r = safeParseDesignSystemSnapshot(minimalSnapshot);
    assert(r.ok && r.data.style.name === '极简 SaaS');
  });

  test('safeParse: invalid rejects', () => {
    const r = safeParseDesignSystemSnapshot({ foo: 1 });
    assert(!r.ok);
  });

  test('formatDesignSystemPrdMarkdown: contains style and locked flag', () => {
    const md = formatDesignSystemPrdMarkdown(minimalSnapshot as any, true);
    assert(md.includes('已锁定'));
    assert(md.includes('极简 SaaS'));
    assert(md.includes('过度渐变'));
  });

  test('formatDesignSystemPrdMarkdown: unlocked', () => {
    const md = formatDesignSystemPrdMarkdown(minimalSnapshot as any, false);
    assert(md.includes('未锁定'));
  });

  console.log('\n✅ design-system M1: all passed\n');
} catch (e) {
  process.exit(1);
}
