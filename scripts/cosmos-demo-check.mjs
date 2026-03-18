#!/usr/bin/env node
/**
 * 自动打开 Cosmos 官网 Demo、收集控制台错误并截图，写入报告供后续迭代使用。
 * 用法: node scripts/cosmos-demo-check.mjs
 * 输出: cosmos-website-demo/check-report.json, cosmos-website-demo/check-screenshot.png
 */

import { spawn } from 'child_process';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const demoDir = path.join(root, 'cosmos-website-demo');
const port = 4173;
const baseUrl = `http://127.0.0.1:${port}`;

async function waitForServer(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const r = await fetch(baseUrl + '/index.html', { method: 'HEAD' });
      if (r.ok) return true;
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}

async function main() {
  let server;
  try {
    server = spawn('npx', ['serve', 'cosmos-website-demo', '-l', String(port)], {
      cwd: root,
      stdio: 'pipe',
    });
    server.stderr?.on('data', (d) => process.stderr.write(d));
    const ok = await waitForServer();
    if (!ok) {
      console.error('Server did not start in time');
      process.exit(1);
    }

    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    const consoleEntries = [];
    const errors = [];

    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      consoleEntries.push({ type, text });
      if (type === 'error') errors.push({ source: 'console', text });
    });
    page.on('pageerror', (err) => {
      errors.push({ source: 'pageerror', text: err.message, stack: err.stack });
    });

    await page.goto(baseUrl + '/index.html', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(3500);

    const screenshotPath = path.join(demoDir, 'check-screenshot.png');
    await mkdir(demoDir, { recursive: true });
    await page.screenshot({ path: screenshotPath, fullPage: false });

    const knownHeadless = (t) =>
      /WebGL context|Error creating WebGL|BindToCurrentSequence|SwiftShader|ANGLE|net::ERR_CONNECTION_CLOSED/i.test(
        t || ''
      );
    const consoleErrors = errors.filter((e) => !knownHeadless(e.text));
    const report = {
      url: baseUrl + '/index.html',
      timestamp: new Date().toISOString(),
      consoleErrors,
      consoleErrorsRaw: errors,
      consoleEntries: consoleEntries.filter((e) => e.type === 'error' || e.type === 'warn'),
      screenshot: path.relative(root, screenshotPath),
    };
    const reportPath = path.join(demoDir, 'check-report.json');
    createWriteStream(reportPath, 'utf8').write(JSON.stringify(report, null, 2));
    console.log('Report:', reportPath);
    console.log('Screenshot:', screenshotPath);
    if (report.consoleErrors.length) {
      console.log('Console errors (excluding known headless/WebGL):', report.consoleErrors.length);
      report.consoleErrors.forEach((e) => console.log(' ', e.source, e.text));
    } else {
      console.log('No actionable console errors.');
    }

    await browser.close();
  } finally {
    if (server) server.kill();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
