/**
 * 项目 JSON v3：导出形状、load v3 整包恢复、非 auto 清空 DS、v2 不覆盖 meta
 */
import { useCanvasStore } from '@/store/canvas-store';

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

const minimalSnapshot = {
  schemaVersion: 1 as const,
  engineVersion: 'app@test',
  source: 'llm_draft' as const,
  createdAt: new Date().toISOString(),
  pattern: { summary: '测' },
  style: { name: '测风格', keywords: ['a'] },
  colors: {
    primary: '#2563eb',
    secondary: '#64748b',
    cta: '#0ea5e9',
    background: '#f8fafc',
    text: '#0f172a',
  },
  typography: '系统无衬线',
  keyEffects: '轻阴影',
  antiPatterns: ['x'],
  markdownBlock: '# DS\n',
};

const v3Base = {
  canvasExportVersion: 3 as const,
  nodes: [] as import('@/types/fractal').FractalNode[],
  edges: [] as import('reactflow').Edge[],
  globalRules: {
    performance: 'p',
    security: 's',
    compatibility: 'c',
    errorHandling: 'e',
    dataTracking: 'd',
  },
  viewportPreset: 'mobile' as const,
  aiConfig: { visionModel: 'm1', textModel: 'm2' },
  currentTheme: {
    vibe: 'Test',
    colors: {
      primary: '#111',
      secondary: '#222',
      background: { light: '#fff', dark: '#000' },
      surface: '#333',
      text: { primary: '#000', secondary: '#666' },
      border: '#999',
    },
    shape: {
      borderRadius: { sm: '4px', md: '8px', lg: '12px', full: '9999px' },
      borderWidth: '1px',
    },
    typography: { fontFamily: 'sans', baseSize: '14px', density: 'normal' as const },
    shadows: { cardShadow: 'none', buttonShadow: 'none' },
  },
};

console.log('\n📦 canvas project v3 tests\n');

try {
  test('exportProject returns v3 with all contract keys', () => {
    const exp = useCanvasStore.getState().exportProject();
    assert(exp.canvasExportVersion === 3, 'version');
    assert(Array.isArray(exp.nodes) && Array.isArray(exp.edges), 'graph');
    assert(
      exp.designSystemSnapshot === null || typeof exp.designSystemSnapshot === 'object',
      'snapshot',
    );
    assert(typeof exp.designSystemLocked === 'boolean', 'locked');
    assert(exp.projectMeta?.projectName != null, 'meta');
    assert(exp.globalRules?.performance != null, 'rules');
    assert(exp.stylePreset != null, 'preset');
    assert(exp.viewportPreset === 'mobile' || exp.viewportPreset === 'desktop', 'viewport');
    assert(exp.aiConfig?.textModel != null, 'ai');
    assert(exp.currentTheme?.vibe != null, 'theme');
  });

  test('v3 corporate ignores file snapshot (clears DS)', () => {
    useCanvasStore.getState().loadProject({
      ...v3Base,
      projectMeta: {
        projectName: 'Corp',
        industry: '',
        targetAudience: '',
        description: '',
        version: '1',
      },
      stylePreset: 'corporate',
      designSystemSnapshot: minimalSnapshot,
      designSystemLocked: true,
    });
    const s = useCanvasStore.getState();
    assert(s.designSystemSnapshot === null, 'snapshot cleared');
    assert(s.designSystemLocked === false, 'unlocked');
    assert(s.stylePreset === 'corporate');
    assert(s.projectMeta.projectName === 'Corp');
  });

  test('v3 auto restores snapshot when valid', () => {
    useCanvasStore.getState().loadProject({
      ...v3Base,
      projectMeta: {
        projectName: 'Auto',
        industry: '',
        targetAudience: '',
        description: '',
        version: '1',
      },
      stylePreset: 'auto',
      designSystemSnapshot: minimalSnapshot,
      designSystemLocked: true,
    });
    const s = useCanvasStore.getState();
    assert(s.designSystemSnapshot != null, 'has snapshot');
    assert(s.designSystemSnapshot?.style.name === '测风格');
    assert(s.designSystemLocked === true);
  });

  test('v2-only load does not overwrite projectMeta from prior v3', () => {
    useCanvasStore.getState().loadProject({
      ...v3Base,
      projectMeta: {
        projectName: 'KeepMe',
        industry: 'a',
        targetAudience: 'b',
        description: '',
        version: '2',
      },
      stylePreset: 'neutral',
      designSystemSnapshot: null,
      designSystemLocked: false,
    });
    useCanvasStore.getState().loadProject({
      nodes: [],
      edges: [],
    });
    assert(useCanvasStore.getState().projectMeta.projectName === 'KeepMe', 'meta preserved');
  });

  test('export after v3 load round-trips projectName', () => {
    useCanvasStore.getState().loadProject({
      ...v3Base,
      projectMeta: {
        projectName: 'Round',
        industry: '',
        targetAudience: '',
        description: '',
        version: '1',
      },
      stylePreset: 'glass',
      designSystemSnapshot: null,
      designSystemLocked: false,
    });
    const exp = useCanvasStore.getState().exportProject();
    assert(exp.canvasExportVersion === 3);
    assert(exp.projectMeta.projectName === 'Round');
    assert(exp.stylePreset === 'glass');
  });

  console.log('\n✅ canvas project v3: all passed\n');
} catch (e) {
  console.error('\n❌ canvas project v3 failed\n');
  process.exit(1);
}
