/**
 * 风格提取功能 E2E：打开风格提取器模态框，校验上传区与标题可见。
 * 不依赖 OPENAI（不实际上传图片）。
 * 用法：BASE_URL=http://localhost:3000 npx playwright test e2e/style-extractor.spec.ts
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('风格提取', () => {
  test('打开风格提取器后，模态框与上传区可见', async ({ page }) => {
    test.setTimeout(30_000);

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15_000 });
    await page.waitForLoadState('networkidle').catch(() => {});

    // 等待画布右侧工具栏出现（含更多选项）
    const moreBtn = page.getByTestId('canvas-more-options');
    await moreBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await moreBtn.click();
    await page.waitForTimeout(300);

    // 点击「风格提取」
    await page.getByTestId('open-style-extractor').click();
    await page.waitForTimeout(500);

    // 模态框：标题与上传区
    await expect(page.getByText('UI 风格提取器')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('上传 UI 截图提取风格')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('button', { name: '选择图片' })).toBeVisible({ timeout: 5_000 });
  });
});
