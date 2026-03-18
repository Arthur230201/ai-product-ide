/**
 * M3：UUPM 快照构建（无需 Python）
 */
import { buildUupmDesignSystemSnapshot } from '../build-uupm-snapshot';
import { DesignSystemSnapshotSchema } from '@/types/design-system-snapshot';

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

console.log('\n📦 design-system M3 tests\n');

try {
  test('buildUupmDesignSystemSnapshot passes zod', () => {
    const md = `## Design System\n\n### Colors\nPrimary #111\n\n### Typography\nSans\n\n`.repeat(20);
    const s = buildUupmDesignSystemSnapshot(md, {
      queryHint: 'fintech dashboard',
      projectName: 'PayApp',
    });
    const p = DesignSystemSnapshotSchema.safeParse(s);
    assert(p.success, p.success ? '' : JSON.stringify(p.error.issues));
    assert(s.source === 'python_uupm');
    assert(s.markdownBlock.includes('UIUXProMax'));
    assert(s.style.keywords.includes('fintech dashboard'));
  });

  test('buildUupm snapshot markdownBlock embeds raw uupm output', () => {
    const s = buildUupmDesignSystemSnapshot('HELLO_UUPM_BODY', { queryHint: 'x' });
    assert(s.markdownBlock.includes('HELLO_UUPM_BODY'));
  });

  console.log('\n✅ design-system M3: all passed\n');
} catch {
  process.exit(1);
}
