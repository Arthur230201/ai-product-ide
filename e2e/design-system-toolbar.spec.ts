import { test, expect } from '@playwright/test';

/**
 * 需 Next 客户端脚本正常加载（无 chunk 404），否则会一直停在「加载中」。
 * 默认跳过；本地验证：E2E_DESIGN_SYSTEM=1 npm run e2e:design-system
 */
const runDesignSystemE2E = process.env.E2E_DESIGN_SYSTEM === '1';

const defaultTheme = {
  colors: {
    primary: 'blue-500',
    secondary: 'purple-500',
    background: { light: 'white', dark: 'slate-900' },
    surface: 'slate-800',
    text: { primary: 'slate-50', secondary: 'slate-400' },
    border: 'slate-700',
  },
  shape: {
    borderRadius: {
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      full: 'rounded-full',
    },
    borderWidth: 'border',
  },
  typography: {
    fontFamily: 'sans-serif',
    baseSize: 'text-base',
    density: 'normal' as const,
  },
  shadows: { cardShadow: 'shadow-lg', buttonShadow: 'shadow-md' },
  vibe: 'Modern Professional',
};

function makePageNode(id: string, label: string) {
  return {
    id,
    type: 'page',
    position: { x: 100, y: 100 },
    width: 220,
    height: 120,
    data: {
      label,
      artifacts: {
        view: { code: 'export default function P(){return <div/>}' },
        spec: { title: label, requirements: ['e2e'] },
        impl: { apiEndpoints: [], dbSchema: '' },
        test: { cases: [] },
      },
      syncState: { isSynced: true, lastSource: 'view' as const },
      source: { type: 'ai' as const },
    },
  };
}

function canvasStoragePayload(overrides: {
  designSystemSnapshot?: Record<string, unknown> | null;
  stylePreset?: string;
  projectMeta?: { projectName: string };
}) {
  return {
    state: {
      nodes: [makePageNode('e2e-page-1', 'E2E 页')],
      edges: [],
      currentTheme: defaultTheme,
      stylePreset: overrides.stylePreset ?? 'neutral',
      projectMeta: overrides.projectMeta ?? {
        projectName: 'E2E 设计系统',
        industry: '',
        targetAudience: '',
        description: '',
        version: '1.0.0',
      },
      globalRules: {
        performance: '',
        security: '',
        compatibility: '',
        errorHandling: '',
        dataTracking: '',
      },
      aiConfig: { visionModel: 'gpt-test', textModel: 'gpt-test' },
      viewportPreset: 'mobile',
      designSystemSnapshot:
        overrides.designSystemSnapshot === undefined ? null : overrides.designSystemSnapshot,
      designSystemLocked: false,
    },
    version: 1,
  };
}

(runDesignSystemE2E ? test.describe : test.describe.skip)(
  '设计系统工具栏（Sparkles）',
  () => {
  test('无快照时展示固定风格说明，并可打开风格设置', async ({ page }) => {
    test.setTimeout(60_000);
    const payload = canvasStoragePayload({ stylePreset: 'neutral' });
    await page.addInitScript((json: string) => {
      localStorage.setItem('fractal-canvas-storage', json);
    }, JSON.stringify(payload));

    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.getByTestId('open-style-extractor')).toBeVisible({ timeout: 30_000 });

    await page.getByRole('button', { name: '设计系统只读面板' }).click();
    await expect(page.getByRole('heading', { name: '设计系统（只读）' })).toBeVisible();
    await expect(page.getByText(/固定风格预设「neutral」/)).toBeVisible();

    await page.getByRole('button', { name: '打开风格设置' }).click();
    await expect(page.getByRole('heading', { name: 'UI 风格选择' })).toBeVisible({ timeout: 10_000 });
  });

  test('有快照时只读面板展示风格名', async ({ page }) => {
    test.setTimeout(60_000);
    const snapshot = {
      schemaVersion: 1,
      engineVersion: 'e2e-fixture',
      source: 'llm_draft',
      createdAt: '2025-03-01T12:00:00.000Z',
      pattern: { summary: 'E2E pattern' },
      style: { name: 'GoldenStyleForE2E', keywords: ['e2e', 'fixture'] },
      colors: {
        primary: '#111',
        secondary: '#222',
        cta: '#333',
        background: '#fff',
        text: '#000',
      },
      typography: 'sans',
      keyEffects: 'flat',
      antiPatterns: ['busy'],
      markdownBlock: '# E2E\n\nshort',
    };
    const payload = canvasStoragePayload({
      stylePreset: 'auto',
      designSystemSnapshot: snapshot,
    });
    await page.addInitScript((json: string) => {
      localStorage.setItem('fractal-canvas-storage', json);
    }, JSON.stringify(payload));

    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.getByTestId('open-style-extractor')).toBeVisible({ timeout: 30_000 });

    await page.getByRole('button', { name: '设计系统只读面板' }).click();
    await expect(page.getByText('GoldenStyleForE2E')).toBeVisible();
    await expect(page.getByText('LLM 推荐')).toBeVisible();
  });
},
);
