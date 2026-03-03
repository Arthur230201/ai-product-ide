#!/usr/bin/env node
/**
 * 视口调试：用 Playwright 打开应用，选「桌面」、触发生成、收集控制台日志并写入文件。
 * 运行前请确保 npm run dev 已启动。输出: scripts/viewport-debug-console.json
 */
import { chromium } from '@playwright/test';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_FILE = join(__dirname, 'viewport-debug-console.json');
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const WAIT_AFTER_SEND_MS = 20000;

const logs = [];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    logs.push({
      type,
      text,
      timestamp: new Date().toISOString(),
    });
  });

  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  } catch (e) {
    logs.push({ type: 'error', text: `Navigate failed: ${e.message}`, timestamp: new Date().toISOString() });
    write();
    await browser.close();
    process.exit(0);
  }

  await page.waitForTimeout(2000);

  // 若有节点，先点选一个以打开详情栏（含视口按钮）
  const node = page.locator('.react-flow__node').first();
  if (await node.count() > 0) {
    await node.click();
    await page.waitForTimeout(800);
  }

  // 点「桌面」
  const desktopBtn = page.getByTestId('viewport-desktop');
  if (await desktopBtn.count() > 0) {
    await desktopBtn.click();
    await page.waitForTimeout(500);
  }

  // 输入并发送
  const input = page.getByTestId('command-input');
  const sendBtn = page.getByTestId('command-send');
  await input.fill('生成UI');
  await page.waitForTimeout(300);
  await sendBtn.click();

  await page.waitForTimeout(WAIT_AFTER_SEND_MS);
  write();
  await browser.close();
}

function write() {
  writeFileSync(OUT_FILE, JSON.stringify(logs, null, 2), 'utf8');
  console.log('Console logs written to', OUT_FILE);
}

main().catch((err) => {
  console.error(err);
  write();
  process.exit(1);
});
