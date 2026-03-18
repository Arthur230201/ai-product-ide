#!/usr/bin/env node
/**
 * 一键自动化：运行首页「开始设计」E2E 测试
 * 用法：npm run e2e:stitch
 * - Playwright 会按 playwright.config.ts 的 webServer 自动启动 npm run dev（若 3000 未就绪）
 * - 若端口已被占用，请先停止占用 3000 的进程或确保其为当前项目的 Next 服务
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

async function pickPort() {
  const base = Number(process.env.E2E_PORT ?? 3100);
  for (let p = base; p <= base + 10; p += 1) {
    const url = `http://localhost:${p}/`;
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 450);
      // 如果端口已有服务，会返回 ok 或 4xx/5xx；都算“被占用”
      await fetch(url, { method: 'GET', signal: ctrl.signal });
      clearTimeout(to);
      continue;
    } catch (_) {
      return p;
    }
  }
  return base;
}

async function main() {
  console.log('[e2e:stitch] 运行首页开始设计 E2E 测试（Playwright 将自动启动 dev）...\n');
  const port = await pickPort();
  if (port !== Number(process.env.E2E_PORT ?? 3100)) {
    console.log(`[e2e:stitch] 端口占用，切换 E2E_PORT=${port}`);
  }
  const pw = spawn('npx', ['playwright', 'test', 'e2e/stitch-home-start-design.spec.ts', '--reporter=list'], {
    cwd: root,
    stdio: 'inherit',
    env: {
      ...process.env,
      E2E_PORT: String(port),
      NODE_OPTIONS: '',
    },
    shell: false,
  });
  const code = await new Promise((resolve) => pw.on('close', resolve));
  process.exit(code ?? 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
