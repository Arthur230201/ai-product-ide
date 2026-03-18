/**
 * 包装 `next build`：剔除无效的 `--localstorage-file`（Node 22+ 常见），
 * 避免 SSG 阶段出现 “was provided without a valid path” 告警。
 */
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function sanitizeNodeOptions(raw) {
  if (!raw || typeof raw !== 'string') return undefined;
  const tokens = raw.trim().split(/\s+/);
  const out = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === '--localstorage-file') {
      const next = tokens[i + 1];
      if (next && !next.startsWith('-') && next.length > 0) {
        out.push(t, next);
        i += 1;
      }
      continue;
    }
    if (t.startsWith('--localstorage-file=')) {
      const v = t.slice('--localstorage-file='.length);
      if (v && v.trim().length > 0) out.push(t);
      continue;
    }
    out.push(t);
  }
  const s = out.join(' ').trim();
  return s.length > 0 ? s : undefined;
}

const root = path.join(__dirname, '..');
const env = { ...process.env };
const cleaned = sanitizeNodeOptions(env.NODE_OPTIONS);
if (cleaned) env.NODE_OPTIONS = cleaned;
else delete env.NODE_OPTIONS;

// 某些环境（或并发/中断构建）可能导致 `.next/server` chunk 丢失，触发 MODULE_NOT_FOUND。
// 为保证 CI/门禁稳定性，默认在 build 前清理 `.next`（可用 NEXT_BUILD_CLEAN=0 关闭）。
if (env.NEXT_BUILD_CLEAN !== '0') {
  try {
    fs.rmSync(path.join(root, '.next'), { recursive: true, force: true });
  } catch (_) {}
}

let nextBin;
try {
  nextBin = require.resolve('next/dist/bin/next', { paths: [root] });
} catch {
  console.error('[next-build] 未找到 next，请在项目根目录执行 npm install');
  process.exit(1);
}

const r = spawnSync(process.execPath, [nextBin, 'build'], {
  cwd: root,
  env,
  stdio: 'inherit',
});

process.exit(r.status === null ? 1 : r.status);
