#!/usr/bin/env node
/**
 * 设计系统工具栏 E2E：Sparkles 只读面板 + 打开风格设置
 * 用法：npm run e2e:design-system
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
  console.log('[e2e:design-system] Playwright: design-system-toolbar.spec.ts\n');
  const port = await pickPort();
  if (port !== Number(process.env.E2E_PORT ?? 3100)) {
    console.log(`[e2e:design-system] 端口占用，切换 E2E_PORT=${port}`);
  }
  const E2E_DESIGN_SYSTEM =
    process.env.E2E_DESIGN_SYSTEM === '0'
      ? '0'
      : (process.env.E2E_DESIGN_SYSTEM ?? '1');
  const pw = spawn('npx', ['playwright', 'test', 'e2e/design-system-toolbar.spec.ts', '--reporter=list'], {
    cwd: root,
    stdio: 'inherit',
    env: {
      ...process.env,
      E2E_PORT: String(port),
      E2E_DESIGN_SYSTEM,
      // 防止宿主机注入无效 node flag（如 --localstorage-file）污染 webServer/node 进程
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
