#!/usr/bin/env node
/**
 * 一键运行视口调试：若 3000 未就绪则后台启动 dev，再执行日志收集并输出结果路径。
 * 用法: node scripts/viewport-debug-run.mjs
 */
import { spawn } from 'child_process';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;
const CHECK_INTERVAL_MS = 500;
const MAX_WAIT_MS = 60000;

function checkPort(host = '127.0.0.1', port = PORT) {
  return new Promise((resolve) => {
    const s = net.createConnection(port, host, () => {
      s.destroy();
      resolve(true);
    });
    s.on('error', () => resolve(false));
    s.setTimeout(500, () => {
      s.destroy();
      resolve(false);
    });
  });
}

function waitForPort() {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const t = setInterval(async () => {
      if (Date.now() - start > MAX_WAIT_MS) {
        clearInterval(t);
        reject(new Error('Timeout waiting for port ' + PORT));
        return;
      }
      if (await checkPort()) {
        clearInterval(t);
        resolve();
      }
    }, CHECK_INTERVAL_MS);
  });
}

function runCollect() {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [path.join(__dirname, 'viewport-debug-collect-logs.mjs')], {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
      shell: false,
    });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('Exit ' + code))));
    child.on('error', reject);
  });
}

async function main() {
  const up = await checkPort();
  if (!up) {
    console.log('Port', PORT, 'not ready, starting dev server in background...');
    const devProc = spawn('npm', ['run', 'dev'], {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'ignore',
      detached: true,
      shell: true,
    });
    devProc.unref();
    await waitForPort();
    console.log('Dev server is up, waiting 20s for Next.js to compile...');
    await new Promise((r) => setTimeout(r, 20000));
  }
  await runCollect();
  console.log('Logs written to scripts/viewport-debug-console.json');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
