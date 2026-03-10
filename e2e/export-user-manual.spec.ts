/**
 * 导出使用说明书 E2E：点击 导出 -> 导出使用说明书，校验下载或成功提示。
 * 视口由 playwright.config.ts 固定为 1280x800，避免小视口导致下拉项点击失败。
 *
 * 用法：npx playwright test e2e/export-user-manual.spec.ts
 * 或先启动应用：npm run dev，再 BASE_URL=http://localhost:3000 npx playwright test e2e/export-user-manual.spec.ts
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('导出使用说明书', () => {
  test('打开导出菜单并点击「导出使用说明书」应触发下载或成功提示', async ({ page }) => {
    test.setTimeout(60_000);

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle').catch(() => {});

    // 打开导出下拉
    await page.getByRole('button', { name: /导出 PRD 文档/ }).click();
    await page.waitForTimeout(300);

    // 点击「导出使用说明书」并等待下载或成功 toast
    const downloadPromise = page.waitForEvent('download', { timeout: 15_000 }).catch(() => null);
    await page.getByRole('button', { name: /导出使用说明书/ }).click();

    const download = await downloadPromise;
    if (download) {
      const filename = download.suggestedFilename();
      expect(filename).toMatch(/使用说明书\.docx$/);
      await download.path(); // 确保下载完成
    } else {
      // 未捕获到 download 事件时，至少校验成功 toast 出现（部分环境可能不暴露 download）
      await expect(page.getByText(/使用说明书导出成功/)).toBeVisible({ timeout: 5000 });
    }
  });
});
