/**
 * 调用上游 UIUXProMax `search.py --design-system`（需本地克隆 skill 并配置路径）。
 * 见 docs/DESIGN_SYSTEM_UUPM.md
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { logWarn } from '@/lib/logger';

const MAX_STDOUT_BYTES = 512 * 1024;
const DEFAULT_TIMEOUT_MS = 30_000;

export function resolveUupmSearchPyPath(): string | null {
  const explicit = process.env.DESIGN_SYSTEM_SEARCH_PY?.trim();
  if (explicit) return path.resolve(explicit);
  const root = process.env.UIUXPROMAX_SKILL_ROOT?.trim();
  if (root)
    return path.join(path.resolve(root), 'src/ui-ux-pro-max/scripts/search.py');
  return null;
}

export type UupmRunResult =
  | { ok: true; markdown: string }
  | { ok: false; reason: string };

/**
 * 执行 `python search.py "<query>" --design-system --project-name X --format markdown`
 * 需 DESIGN_SYSTEM_UUPM_ENABLED=1 且 search.py 存在。
 */
export async function runUupmDesignSystemMarkdown(input: {
  query: string;
  projectName: string;
}): Promise<UupmRunResult> {
  if (process.env.DESIGN_SYSTEM_UUPM_ENABLED !== '1') {
    return { ok: false, reason: 'uupm_disabled' };
  }

  const script = resolveUupmSearchPyPath();
  if (!script || !fs.existsSync(script)) {
    if (script) logWarn('[uupm] search.py 路径无效或文件不存在', { script });
    return { ok: false, reason: 'script_missing' };
  }

  const cwd = path.join(path.dirname(script), '..');
  const py = process.env.DESIGN_SYSTEM_PYTHON_BIN?.trim() || 'python3';
  const q = input.query.slice(0, 600).replace(/[\r\n\x00]/g, ' ').trim() || 'saas';
  const pn = (input.projectName || 'Project').slice(0, 120) || 'Project';

  const timeoutMs = (() => {
    const raw = process.env.DESIGN_SYSTEM_PYTHON_TIMEOUT_MS;
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) && n >= 3000 ? n : DEFAULT_TIMEOUT_MS;
  })();

  return new Promise((resolve) => {
    let settled = false;
    const chunks: Buffer[] = [];
    let outSize = 0;

    const finish = (r: UupmRunResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(r);
    };

    const proc = spawn(py, [script, q, '--design-system', '--project-name', pn, '--format', 'markdown'], {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    });

    const timer = setTimeout(() => {
      try {
        proc.kill('SIGKILL');
      } catch {
        /* ignore */
      }
      finish({ ok: false, reason: 'timeout' });
    }, timeoutMs);

    proc.stdout?.on('data', (b: Buffer) => {
      if (settled) return;
      outSize += b.length;
      if (outSize > MAX_STDOUT_BYTES) {
        try {
          proc.kill('SIGKILL');
        } catch {
          /* ignore */
        }
        finish({ ok: false, reason: 'stdout_overflow' });
        return;
      }
      chunks.push(b);
    });

    proc.on('error', (err) => {
      finish({ ok: false, reason: `spawn:${err.message}` });
    });

    proc.on('close', (code) => {
      if (settled) return;
      if (code !== 0) {
        finish({ ok: false, reason: `exit_${code}` });
        return;
      }
      const markdown = Buffer.concat(chunks).toString('utf8').trim();
      if (markdown.length < 80) {
        finish({ ok: false, reason: 'output_too_short' });
        return;
      }
      if (/^error\s*:/i.test(markdown.split('\n')[0] ?? '')) {
        finish({ ok: false, reason: 'python_error_line' });
        return;
      }
      finish({ ok: true, markdown });
    });
  });
}
