#!/usr/bin/env node
/**
 * 完整流程脚本：创造模式「企业资产管理系统」→ 生成图 → 选节点生成 UI → 增加交互 → 导出 HTML → 校验
 * 若校验不通过，输出问题点并 exit(1)，由人工或后续修复后重复执行直到一致。
 *
 * 前置：应用已启动（BASE_URL，默认 http://localhost:3000），且已配置 OPENAI_API_KEY。
 * 用法：node scripts/run-full-flow-and-verify.mjs [BASE_URL]
 *       BASE_URL=http://your-server:3000 node scripts/run-full-flow-and-verify.mjs
 */

import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outPath = join(root, 'scripts/iteration-reports/prd-artifacts/exported-prd.html');

function loadEnvFileIfExists(filePath) {
  try {
    if (!existsSync(filePath)) return;
    const raw = readFileSync(filePath, 'utf8');
    for (const line of raw.split('\n')) {
      const s = line.trim();
      if (!s || s.startsWith('#')) continue;
      const idx = s.indexOf('=');
      if (idx <= 0) continue;
      const k = s.slice(0, idx).trim();
      let v = s.slice(idx + 1).trim();
      if (!k) continue;
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (!process.env[k] && v) process.env[k] = v;
    }
  } catch (_) {}
}

async function assertServerReachable(baseUrl) {
  const url = baseUrl.replace(/\/$/, '') + '/';
  for (let i = 0; i < 25; i += 1) {
    try {
      const r = await fetch(url, { method: 'GET' });
      if (r.ok) return;
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`BASE_URL 不可达：${url}（请先启动应用，例如：npm run dev）`);
}

async function run(cmd, args, env = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, {
      stdio: 'inherit',
      shell: false,
      env: { ...process.env, ...env },
    });
    proc.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`exit ${code}`))));
  });
}

async function main() {
  const baseUrl = process.env.BASE_URL || process.argv[2] || 'http://localhost:3000';
  console.log('[run-full-flow] BASE_URL=', baseUrl);
  // 兼容：脚本以 node 直接运行时不会自动加载 `.env.local`
  loadEnvFileIfExists(join(root, '.env.local'));
  loadEnvFileIfExists(join(root, '.env'));
  if (!process.env.OPENAI_API_KEY || !String(process.env.OPENAI_API_KEY).trim()) {
    console.error('[run-full-flow] 缺少 OPENAI_API_KEY：本脚本依赖真实 LLM 调用（见 e2e/full-flow-export-html.spec.ts）。');
    process.exit(1);
  }
  try {
    await assertServerReachable(baseUrl);
  } catch (e) {
    console.error('[run-full-flow]', e.message);
    process.exit(1);
  }
  console.log('[run-full-flow] Step 1: 执行 E2E 全流程（输入 -> 图 -> UI -> 增加交互 -> 导出 HTML）…');

  try {
    await run(
      'npx',
      [
        'playwright',
        'test',
        'e2e/full-flow-export-html.spec.ts',
        '--config=playwright.fullflow.config.ts',
        '--reporter=list',
        '--retries=0',
        '--workers=1',
      ],
      {
        BASE_URL: baseUrl,
        // 防止继承 CI=true 导致 playwright 自动重试，掩盖失败原因并拖慢反馈
        CI: '',
      }
    );
  } catch (e) {
    console.error('[run-full-flow] E2E 失败:', e.message);
    process.exit(1);
  }

  const { existsSync } = await import('fs');
  if (!existsSync(outPath)) {
    console.error('[run-full-flow] 未找到导出文件:', outPath);
    process.exit(1);
  }
  console.log('[run-full-flow] Step 2: 校验导出 PRD HTML…');
  try {
    await run('node', [join(root, 'scripts/verify-prd-html-render.mjs'), outPath]);
  } catch (e) {
    console.error('[run-full-flow] 校验未通过，请根据上方 [verify] 输出修复后重试。');
    process.exit(1);
  }

  console.log('[run-full-flow] ✅ 全流程通过，导出 PRD 与预期一致。');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
