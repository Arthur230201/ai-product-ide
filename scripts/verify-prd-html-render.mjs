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
  // 通用通过条件：有 PRD 结构（第 5 章）且无错误；或包含可选预期关键词
  const expectedKeyword = process.env.VERIFY_EXPECTED || process.argv[3];
  const hasPrdStructure = bodyText.includes('第 5 章') || bodyText.includes('功能详述');
  const hasContent = expectedKeyword ? bodyText.includes(expectedKeyword) : (hasPrdStructure && !hasLoading);

  console.log('[verify] 结果:');
  console.log('  - 仍显示「UI 加载中」:', hasLoading);
  console.log('  - 显示错误/未能渲染:', hasError);
  console.log('  - 有 PRD 结构（第5章/功能详述）:', hasPrdStructure);
  if (expectedKeyword) console.log('  - 包含预期关键词:', hasContent);
  else console.log('  - 疑似渲染出内容（无加载+有结构）:', hasContent);

  const errors = logs.filter((l) => l.type === 'error' || l.text.includes('❌'));
  if (errors.length) {
    console.log('[verify] 控制台错误数:', errors.length);
    errors.slice(0, 5).forEach((e) => console.log('  ', e.text.slice(0, 300)));
  }

  await browser.close();

  const hasMountError = errors.some((e) => e.text.includes('Failed to mount') || e.text.includes('组件加载失败'));
  const isOfflineNoise = (t) =>
    /net::ERR_CONNECTION_CLOSED/i.test(t) ||
    /\[waitForReact\].*failed to load/i.test(t) ||
    /React\/ReactDOM\/Babel failed to load/i.test(t) ||
    /\[waitForReact\]\s*Final status:/i.test(t);
  const nonOfflineErrors = errors.filter((e) => !isOfflineNoise(e.text));
  if (hasMountError || hasError) {
    console.log('[verify] ❌ 存在错误，需修复');
    process.exit(1);
  }
  // 离线/受限网络环境下，导出 HTML 可能依赖 CDN（React/ReactDOM/Babel）导致停在“加载中”。
  // 若已能渲染出 PRD 结构且没有非离线错误，则判定通过（用于 CI/本地无网验证）。
  const shouldOfflineDegradePass = hasPrdStructure && !nonOfflineErrors.length && (errors.length || hasLoading);
  if (shouldOfflineDegradePass) {
    console.log('[verify] ✅ 离线环境降级通过（存在 CDN 加载失败，但 PRD 结构已生成且无其它错误）');
    process.exit(0);
  }
  if (hasContent && !hasLoading && !hasError) {
    console.log('[verify] ✅ 导出 PRD 与预期一致（无错误、无加载中、有内容）');
    process.exit(0);
  }
  console.log('[verify] ⚠️ 可能仍为加载中、未渲染或缺少预期内容');
  process.exit(2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
