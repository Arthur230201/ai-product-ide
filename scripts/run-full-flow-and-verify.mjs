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

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outPath = join(root, 'scripts/iteration-reports/prd-artifacts/exported-prd.html');

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
  console.log('[run-full-flow] Step 1: 执行 E2E 全流程（输入 -> 图 -> UI -> 增加交互 -> 导出 HTML）…');

  try {
    await run('npx', ['playwright', 'test', 'e2e/full-flow-export-html.spec.ts', '--reporter=line'], {
      BASE_URL: baseUrl,
    });
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
