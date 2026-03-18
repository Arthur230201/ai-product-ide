#!/usr/bin/env node
/**
 * 本地校验 UIUXProMax search.py --design-system 是否可用。
 * - DESIGN_SYSTEM_UUPM_ENABLED=1 且 search.py 存在时执行；否则 exit 0（跳过）。
 * 用法：DESIGN_SYSTEM_UUPM_ENABLED=1 UIUXPROMAX_SKILL_ROOT=... node scripts/verify-uupm-design-system.mjs
 */
import { existsSync } from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function resolveSearchPy() {
  const explicit = process.env.DESIGN_SYSTEM_SEARCH_PY?.trim();
  if (explicit) return path.resolve(explicit);
  const skillRoot = process.env.UIUXPROMAX_SKILL_ROOT?.trim();
  if (skillRoot)
    return path.join(path.resolve(skillRoot), 'src/ui-ux-pro-max/scripts/search.py');
  return null;
}

async function main() {
  if (process.env.DESIGN_SYSTEM_UUPM_ENABLED !== '1') {
    console.log('[verify-uupm] skip: set DESIGN_SYSTEM_UUPM_ENABLED=1 to run');
    process.exit(0);
  }
  const script = resolveSearchPy();
  if (!script || !existsSync(script)) {
    console.log('[verify-uupm] skip: search.py not found (set UIUXPROMAX_SKILL_ROOT or DESIGN_SYSTEM_SEARCH_PY)');
    process.exit(0);
  }

  const cwd = path.join(path.dirname(script), '..');
  const py = process.env.DESIGN_SYSTEM_PYTHON_BIN?.trim() || 'python3';
  const query = process.env.UUPM_VERIFY_QUERY?.trim() || 'saas dashboard fintech';
  const projectName = process.env.UUPM_VERIFY_PROJECT?.trim() || 'verify-uupm';

  const args = [
    script,
    query,
    '--design-system',
    '--project-name',
    projectName,
    '--format',
    'markdown',
  ];

  console.log('[verify-uupm] running:', py, path.basename(script), '...');

  const code = await new Promise((resolve, reject) => {
    const child = spawn(py, args, {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
    });
    let out = '';
    let err = '';
    const max = 512 * 1024;
    child.stdout?.on('data', (c) => {
      out += c.toString();
      if (out.length > max) {
        child.kill('SIGKILL');
      }
    });
    child.stderr?.on('data', (c) => {
      err += c.toString();
    });
    child.on('error', reject);
    child.on('close', (c) => resolve({ code: c ?? 1, out, err }));
  });

  if (code.code !== 0) {
    console.error('[verify-uupm] exit', code.code);
    if (code.err) console.error(code.err.slice(0, 2000));
    process.exit(1);
  }
  if (code.out.length < 80) {
    console.error('[verify-uupm] stdout too short, expected markdown body');
    process.exit(1);
  }
  console.log('[verify-uupm] ok, markdown bytes:', Buffer.byteLength(code.out, 'utf8'));
  const fixtureDir = path.join(root, '__fixtures__/uupm');
  console.log('[verify-uupm] tip: save golden with e.g. echo >', path.join(fixtureDir, 'sample.md'));
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
