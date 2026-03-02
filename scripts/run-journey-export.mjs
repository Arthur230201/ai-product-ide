#!/usr/bin/env node

/**
 * 完整流程：启动 dev → 为节点生成 UI → 导出 PRD HTML → 写入 last-prd.html
 * 用法：node scripts/run-journey-export.mjs [payload.json]
 * 默认：scripts/iteration/test-cases/prd-payload-shopping-2pages.json
 */

import { spawn } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const testCasesDir = join(root, 'scripts/iteration/test-cases');
const prdArtifactsDir = join(root, 'scripts/iteration-reports/prd-artifacts');

const POLL_MS = 2000;
const MAX_WAIT_MS = 120000;
const API_WARMUP_MS = 15000;
const GENERATE_UI_TIMEOUT_MS = 90000;

function parsePortFromNextOutput(chunk) {
  const s = chunk.toString();
  const m = s.match(/Local:\s*https?:\/\/[^/]+:(\d+)/) || s.match(/localhost:(\d+)/);
  return m ? m[1] : null;
}

async function waitForUrl(url) {
  const base = url.replace(/\/$/, '');
  const start = Date.now();
  while (Date.now() - start < MAX_WAIT_MS) {
    try {
      const r = await fetch(base, { method: 'GET' });
      if (r.status < 500) return true;
    } catch (_) {}
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
  return false;
}

async function main() {
  const payloadArg = process.argv[2] || '';
  const payloadName = payloadArg || 'prd-payload-shopping-2pages.json';
  const payloadPath = payloadName.endsWith('.json') ? join(testCasesDir, payloadName) : join(testCasesDir, `${payloadName}.json`);

  if (!existsSync(payloadPath)) {
    console.error('[run-journey-export] 测试用例不存在:', payloadPath);
    process.exit(1);
  }

  mkdirSync(prdArtifactsDir, { recursive: true });

  let resolvedBaseUrl = null;
  const dev = spawn('npm', ['run', 'dev'], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, FORCE_COLOR: '1' },
    shell: true,
  });
  dev.stdout?.on('data', (c) => {
    process.stdout.write(c);
    if (!resolvedBaseUrl) {
      const port = parsePortFromNextOutput(c);
      if (port) resolvedBaseUrl = `http://localhost:${port}`;
    }
  });
  dev.stderr?.on('data', (c) => {
    process.stderr.write(c);
    if (!resolvedBaseUrl) {
      const port = parsePortFromNextOutput(c);
      if (port) resolvedBaseUrl = `http://localhost:${port}`;
    }
  });

  const closeDev = () => {
    dev.kill('SIGTERM');
  };
  process.on('SIGINT', closeDev);
  process.on('SIGTERM', closeDev);

  console.log('[run-journey-export] 等待 Next dev 就绪...');
  const deadline = Date.now() + MAX_WAIT_MS;
  while (!resolvedBaseUrl && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 500));
  }
  if (!resolvedBaseUrl) {
    resolvedBaseUrl = 'http://localhost:3000';
    console.warn('[run-journey-export] 未解析到端口，使用', resolvedBaseUrl);
  }

  const ready = await waitForUrl(resolvedBaseUrl);
  if (!ready) {
    console.error('[run-journey-export] Dev 未在超时内就绪:', resolvedBaseUrl);
    closeDev();
    process.exit(1);
  }
  console.log('[run-journey-export] Dev 已就绪:', resolvedBaseUrl, '，等待 API 编译...');
  await new Promise((r) => setTimeout(r, API_WARMUP_MS));

  const payload = JSON.parse(readFileSync(payloadPath, 'utf-8'));
  const { nodes, projectMeta, globalRules } = payload;
  const baseUrl = resolvedBaseUrl.replace(/\/$/, '');

  // 为每个节点生成 UI
  const enrichedNodes = [];
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    const label = n.label ?? n.data?.label ?? n.id ?? '未命名';
    const spec = n.spec ?? n.data?.artifacts?.spec ?? {};
    const hasView = n.data?.artifacts?.view?.htmlTemplate || n.data?.artifacts?.view?.code;
    let view = hasView ? n.data.artifacts.view : null;

    if (!view) {
      const req = spec.requirements ? (Array.isArray(spec.requirements) ? spec.requirements.join(' ') : String(spec.requirements)) : (spec.title ? `${spec.title}。` : '');
      const prompt = req.trim() || `请为"${label}"页面生成静态 HTML 界面。`;
      console.log('[run-journey-export] 正在为节点生成 UI:', label);
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), GENERATE_UI_TIMEOUT_MS);
      try {
        const res = await fetch(`${baseUrl}/api/generate-static-ui`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, nodeLabel: label }),
          signal: controller.signal,
        });
        clearTimeout(t);
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok && data.html) {
          view = { code: data.html, htmlTemplate: data.html, stage: data.stage || 'STATIC' };
          console.log('[run-journey-export] 节点 UI 生成成功:', label);
        } else {
          console.warn('[run-journey-export] 节点 UI 生成失败:', label, data.message || data.error || res.status, data.type ? `(${data.type})` : '');
          if (Object.keys(data).length) console.warn('[run-journey-export] 响应:', JSON.stringify(data));
        }
      } catch (e) {
        clearTimeout(t);
        console.warn('[run-journey-export] 请求异常:', label, e?.message || e);
      }
    }

    enrichedNodes.push({
      id: n.id || `node-${i}`,
      label,
      type: n.type ?? 'page',
      spec,
      data: { label, artifacts: { spec, ...(view ? { view } : {}) } },
    });
  }

  // 导出 PRD HTML
  console.log('[run-journey-export] 导出 PRD HTML...');
  try {
    const res = await fetch(`${baseUrl}/api/export-prd-html`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodes: enrichedNodes, projectMeta: projectMeta || {}, globalRules: globalRules || {} }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok && data.html) {
      const htmlPath = join(prdArtifactsDir, 'last-prd.html');
      writeFileSync(htmlPath, data.html, 'utf-8');
      console.log('[run-journey-export] 已写入:', htmlPath);
    } else {
      throw new Error(data.error || res.statusText || '导出失败');
    }
  } catch (e) {
    console.error('[run-journey-export] 导出失败:', e?.message || e);
    closeDev();
    process.exit(1);
  }

  closeDev();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
