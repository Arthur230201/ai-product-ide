import { test, expect } from '@playwright/test';

/**
 * 首页 Stitch 流程：输入描述 → 点击「开始设计」→ 出现加载态 → 进入画布（或失败提示）
 * 依赖：npm run dev、可选 OPENAI_API_KEY（未配置时建图会失败，但加载态仍应出现）
 */
test.describe('首页开始设计流程', () => {
  test('输入内容并点击开始设计后应出现加载态或进入画布', async ({ page }) => {
    test.setTimeout(180_000);

    await page.goto('/', { waitUntil: 'networkidle' });

    // 等待首页 Stitch 主区出现（占位或按钮）
    const promptInput = page.getByTestId('stitch-home-prompt');
    await expect(promptInput).toBeVisible({ timeout: 20_000 });

    const startBtn = page.getByTestId('stitch-start-design');
    await expect(startBtn).toBeVisible({ timeout: 5_000 });

    // 填写描述
    await promptInput.fill('做一个简单的待办列表页，包含标题和列表');
    await expect(startBtn).toBeEnabled();

    // 点击开始设计（触发自定义事件 → CommandBar 执行建图）
    await startBtn.click();

    // 1. 必须在较短时间内出现加载态（证明 stitch-start-design 事件被处理）
    const creatingOverlay = page.getByTestId('stitch-creating-overlay');
    await expect(creatingOverlay).toBeVisible({ timeout: 15_000 });
    await expect(creatingOverlay.getByText('正在生成画布')).toBeVisible();

    // 2. 等待建图结束：画布出现或错误提示（建图可能较慢或 API 未配置）
    const canvas = page.locator('.react-flow');
    const errorMsg = page.getByText(/请求失败|生成.*失败|失败/);
    await expect(canvas.or(errorMsg)).toBeVisible({ timeout: 120_000 });
  });
});
