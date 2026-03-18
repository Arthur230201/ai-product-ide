import { useCanvasStore } from '@/store/canvas-store';
import type { DesignSystemSnapshot } from '@/types/design-system-snapshot';

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

function mkSnap(styleName: string): DesignSystemSnapshot {
  return {
    schemaVersion: 1,
    engineVersion: 'uupm-ts-engine-data@0.0.2',
    source: 'ts_engine',
    createdAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
    contextHash: `h:${styleName}`,
    pattern: { summary: 'p' },
    style: { name: styleName, keywords: ['k'] },
    colors: { primary: '#000000', secondary: '#111111', cta: '#222222', background: '#0b1220', text: '#e5e7eb' },
    typography: 't',
    keyEffects: 'e',
    antiPatterns: ['a', 'b', 'c'],
    markdownBlock: '# md',
  };
}

console.log('\n📦 design-system history tests\n');

try {
  test('commitDesignSystemSnapshot pushes previous into history', () => {
    useCanvasStore.setState({ designSystemSnapshot: null, designSystemHistory: [] });
    const a = mkSnap('A');
    const b = mkSnap('B');
    useCanvasStore.getState().commitDesignSystemSnapshot({ snapshot: a, reason: 'resolve_api', engine: 'ts', lockAfter: false });
    useCanvasStore.getState().commitDesignSystemSnapshot({ snapshot: b, reason: 'resolve_api', engine: 'ts', lockAfter: false });
    const s = useCanvasStore.getState();
    assert(s.designSystemSnapshot?.style.name === 'B');
    assert(s.designSystemHistory.length === 1, `history=${s.designSystemHistory.length}`);
    assert(s.designSystemHistory[0].style.name === 'A');
  });

  test('rollbackDesignSystemSnapshot restores previous and pops history', () => {
    useCanvasStore.setState({ designSystemSnapshot: null, designSystemHistory: [], designSystemLocked: false });
    const a = mkSnap('A');
    const b = mkSnap('B');
    useCanvasStore.getState().commitDesignSystemSnapshot({ snapshot: a, reason: 'resolve_api', engine: 'ts', lockAfter: false });
    useCanvasStore.getState().commitDesignSystemSnapshot({ snapshot: b, reason: 'resolve_api', engine: 'ts', lockAfter: false });
    useCanvasStore.getState().rollbackDesignSystemSnapshot();
    const s = useCanvasStore.getState();
    assert(s.designSystemSnapshot?.style.name === 'A');
    assert(s.designSystemHistory.length === 0);
  });

  console.log('\n✅ design-system history: all passed\n');
} catch {
  console.error('\n❌ design-system history failed\n');
  process.exit(1);
}

