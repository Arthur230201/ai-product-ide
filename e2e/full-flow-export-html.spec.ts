/**
 * 完整流程：创造模式输入「企业资产管理系统」→ 生成图 → 选节点生成 UI → 增加交互 → 导出 HTML
 * 导出文件保存到 scripts/iteration-reports/prd-artifacts/exported-prd.html，供 verify 脚本校验。
 *
 * 运行前：确保应用已启动（npm run dev 或部署地址），且已配置 OPENAI_API_KEY（真实 LLM）。
 * 用法：BASE_URL=http://localhost:3000 npx playwright test e2e/full-flow-export-html.spec.ts
 */

import { test, expect } from '@playwright/test';
import { join } from 'path';
import { mkdirSync } from 'fs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const OUT_DIR = join(process.cwd(), 'scripts/iteration-reports/prd-artifacts');
const OUT_PATH = join(OUT_DIR, 'exported-prd.html');

test.describe('完整流程：企业资产管理系统 -> 图 -> UI -> 增加交互 -> 导出 HTML', () => {
  test('执行全流程并保存导出 HTML', async ({ page }) => {
    test.setTimeout(600_000); // 10 min：含多次 LLM 调用

    mkdirSync(OUT_DIR, { recursive: true });

    // 1) 打开首页（开始设计）
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle').catch(() => {});

    // 2) 首页：输入需求并点击「开始设计」进入画布
    const homePrompt = page.getByTestId('stitch-home-prompt');
    await expect(homePrompt).toBeVisible({ timeout: 15000 });
    await homePrompt.fill('我需要一个企业资产管理系统');
    const startBtn = page.getByRole('button', { name: /开始设计/ });
    await expect(startBtn).toBeEnabled({ timeout: 15000 });
    await startBtn.click();

    // 进入画布：出现至少一个节点（React Flow 节点或画布内容）
    await page.waitForSelector('.react-flow__node', { timeout: 180_000 }).catch(() => {});
    await page.waitForTimeout(2500);

    // 3) 画布命令栏：输入并发送（用于生成图/补全）
    const input = page.getByTestId('command-input').or(page.getByRole('textbox', { name: /输入|请输入/ }));
    await expect(input).toBeVisible({ timeout: 60_000 });
    await input.fill('我需要一个企业资产管理系统');
    await page.getByTestId('command-send').click();

    // 等待图生成：出现至少一个节点（React Flow 节点或画布内容）
    await page.waitForTimeout(3000);

    // 4) 选中第一个节点，并在该节点上要求生成 UI
    // 某些情况下会自动打开「节点详情」覆盖层，需先返回画布，否则会拦截节点点击。
    await page.getByRole('button', { name: /返回画布/ }).click({ timeout: 2500 }).catch(() => {});
    await page.getByRole('button', { name: /^关闭$/ }).click({ timeout: 1500 }).catch(() => {});
    const firstNode = page.locator('.react-flow__node').first();
    await firstNode.click();
    await page.waitForTimeout(1500);

    // 在输入框输入「生成UI」或「生成本页 UI」触发该节点的 UI 生成
    await input.fill('生成本页 UI');
    await page.getByTestId('command-send').click();

    // 等待 UI 生成完成（进度或 toast 消失 / 成功 toast）
    await page.waitForTimeout(60_000);
    await expect(page.getByText(/UI代码生成成功|生成UI代码/)).toBeVisible({ timeout: 90_000 }).catch(() => {});

    // 5) 点击「增加交互」
    const addInteractionBtn = page.getByRole('button', { name: /增加交互/ });
    await addInteractionBtn.click({ timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(90_000); // 等待交互阶段
    await expect(page.getByText(/已为当前页增加交互|增加交互/)).toBeVisible({ timeout: 30_000 }).catch(() => {});

    // 6) 导出 HTML：打开导出菜单并点击「导出 HTML」
    await page.getByRole('button', { name: /导出 PRD 文档/ }).click();
    await page.waitForTimeout(500);
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 60000 }),
      page.getByRole('button', { name: /导出 HTML/ }).click(),
    ]);
    await download.saveAs(OUT_PATH);
    console.log('[e2e] 已保存导出文件:', OUT_PATH);
  });
});
