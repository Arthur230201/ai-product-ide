import { test, expect } from '@playwright/test';

/**
 * 自检 /dev/test-ui：使用固定测试 UI 代码，验证 LivePreview / PreviewFrame 主内容区是否正常显示。
 * 依赖：LivePreview 中 PreviewUI 组件名优先于 Lucide 同名图标（NavBar/ListItem 等），否则会渲染成 SVG 导致文案不可见。
 */
test.describe('dev/test-ui 测试页', () => {
  test('页面加载且主内容区可见', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/dev/test-ui', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('测试 UI', { exact: false })).toBeVisible({ timeout: 15_000 });

    // 等待预览编译完成：至少出现底栏或主区文案之一
    await expect(
      page.getByRole('button', { name: '加入购物车' }).or(page.getByText('商品详情').first())
    ).toBeVisible({ timeout: 35_000 });

    await expect(page.getByText('商品详情').first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Aurora 无线蓝牙耳机', { exact: false })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('¥299', { exact: false })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('button', { name: '收藏' })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('button', { name: '去结算' })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('button', { name: '加入购物车' })).toBeVisible({ timeout: 5_000 });
  });
});
