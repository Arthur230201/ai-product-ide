/**
 * Next dev wrapper:
 * - sanitize NODE_OPTIONS (remove invalid flags like --localstorage-file)
 * - optional clean webpack persistent cache to avoid PackFileCacheStrategy restore warnings
 *
 * Usage:
 *   node scripts/next-dev.cjs --port 3100 --clean-webpack-cache
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = { port: null, cleanWebpackCache: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--port') {
      const p = argv[i + 1];
      if (p && /^\d+$/.test(p)) args.port = Number(p);
      i += 1;
      continue;
    }
    if (a === '--clean-webpack-cache') {
      args.cleanWebpackCache = true;
    }
  }
  return args;
}

function sanitizeNodeOptions(input) {
  if (!input) return '';
  const tokens = String(input).split(/\s+/g).filter(Boolean);
  const blockedPrefixes = [
    '--localstorage-file',
    '--localstorage-file=',
  ];
  return tokens
    .filter((t) => !blockedPrefixes.some((p) => t === p || t.startsWith(p)))
    .join(' ');
}

function rmrf(p) {
  try {
    fs.rmSync(p, { recursive: true, force: true });
  } catch {
    // ignore
  }
}

async function main() {
  const { port, cleanWebpackCache } = parseArgs(process.argv.slice(2));

  const env = { ...process.env };
  env.NODE_OPTIONS = sanitizeNodeOptions(env.NODE_OPTIONS);
  if (env.NEXT_DEV_SUPPRESS_NODE_WARNINGS === '1') {
    // Only for E2E/dev wrapper to reduce noisy Node warnings from host env.
    env.NODE_NO_WARNINGS = '1';
  }

  if (cleanWebpackCache) {
    // Focus on the persistent client dev pack that frequently causes restore warnings.
    const cacheDir = path.join(process.cwd(), '.next', 'cache', 'webpack');
    rmrf(cacheDir);
  }

  const args = ['dev'];
  if (port != null) args.push('-p', String(port));

  const child = spawn('next', args, { stdio: 'inherit', env, shell: false });
  child.on('close', (code) => process.exit(code ?? 0));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

