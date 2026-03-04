#!/usr/bin/env node
/**
 * 用 Playwright 打开导出的 PRD HTML，等待挂载，检查 UI 是否渲染或控制台报错。
 * 用法：node scripts/verify-prd-html-render.mjs [path-to-exported-prd.html]
 */

import { chromium } from '@playwright/test';
import { existsSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const defaultPath = join(root, 'scripts/iteration-reports/prd-artifacts/exported-prd.html');

async function main() {
  const htmlPath = resolve(process.argv[2] || defaultPath);
  if (!existsSync(htmlPath)) {
    console.error('[verify] 文件不存在:', htmlPath);
    process.exit(1);
  }
  const fileUrl = 'file://' + htmlPath.replace(/\\/g, '/');
  console.log('[verify] 打开:', fileUrl);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const logs = [];
  context.on('console', (msg) => {
    const text = msg.text();
    logs.push({ type: msg.type(), text });
    if (msg.type() === 'error' || text.includes('Failed') || text.includes('❌')) {
      console.log('[console]', msg.type(), text.slice(0, 200));
    }
  });
  const page = await context.newPage();
  await page.goto(fileUrl, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});

  // 等待挂载：脚本会重试 500ms, 1500ms, 3000ms
  await page.waitForTimeout(6000);

  const bodyText = await page.evaluate(() => document.body?.innerText || '');
  const hasLoading = bodyText.includes('UI 加载中');
  const hasError = bodyText.includes('UI 组件加载失败') || bodyText.includes('UI 未能渲染');
  const hasContent = bodyText.includes('商品列表') && (bodyText.includes('筛选') || bodyText.includes('在售'));

  console.log('[verify] 结果:');
  console.log('  - 仍显示「UI 加载中」:', hasLoading);
  console.log('  - 显示错误/未能渲染:', hasError);
  console.log('  - 疑似渲染出内容（商品列表/筛选）:', hasContent);

  const errors = logs.filter((l) => l.type === 'error' || l.text.includes('❌'));
  if (errors.length) {
    console.log('[verify] 控制台错误数:', errors.length);
    errors.slice(0, 5).forEach((e) => console.log('  ', e.text.slice(0, 300)));
  }

  await browser.close();

  const hasMountError = errors.some((e) => e.text.includes('Failed to mount') || e.text.includes('组件加载失败'));
  if (hasMountError || hasError) {
    console.log('[verify] ❌ 存在错误，需修复');
    process.exit(1);
  }
  if (hasContent && !hasLoading) {
    console.log('[verify] ✅ UI 已正确渲染');
    process.exit(0);
  }
  console.log('[verify] ⚠️ 可能仍为加载中或未渲染');
  process.exit(2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
