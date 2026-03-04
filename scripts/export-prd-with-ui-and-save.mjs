#!/usr/bin/env node
/**
 * 从 last-generated-ui-code.md 读取 React UI 代码，调用导出 API 生成 PRD HTML 并写入文件。
 * 前置：需先启动 dev（npm run dev）。
 * 用法：node scripts/export-prd-with-ui-and-save.mjs [baseUrl]
 * 默认 baseUrl: http://localhost:3000
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const reportPath = join(root, 'scripts/iteration-reports/last-generated-ui-code.md');
const outDir = join(root, 'scripts/iteration-reports/prd-artifacts');
const outPath = join(outDir, 'exported-prd.html');

function extractTsxFromMarkdown(content) {
  const start = content.indexOf('```tsx');
  if (start === -1) return null;
  const from = content.indexOf('\n', start) + 1;
  const end = content.indexOf('```', from);
  if (end === -1) return null;
  return content.slice(from, end).trim();
}

async function main() {
  let baseUrl = process.argv[2];
  if (!baseUrl) {
    // 自动探测：Next dev 可能落在 3000–3010
    for (let port = 3000; port <= 3010; port++) {
      try {
        const r = await fetch(`http://localhost:${port}/api/export-prd-html`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nodes: [] }) });
        if (r.status === 400) {
          baseUrl = `http://localhost:${port}`;
          console.log('[export-prd] 使用端口', port);
          break;
        }
      } catch (_) {}
    }
    baseUrl = (baseUrl || 'http://localhost:3000').replace(/\/$/, '');
  } else {
    baseUrl = baseUrl.replace(/\/$/, '');
  }
  let content;
  try {
    content = readFileSync(reportPath, 'utf-8');
  } catch (e) {
    console.error('[export-prd] 无法读取:', reportPath, e.message);
    process.exit(1);
  }
  const uiCode = extractTsxFromMarkdown(content);
  if (!uiCode) {
    console.error('[export-prd] 未在 last-generated-ui-code.md 中找到 ```tsx ... ``` 代码块');
    process.exit(1);
  }
  console.log('[export-prd] 已提取 UI 代码长度:', uiCode.length);

  const payload = {
    projectMeta: {
      projectName: 'PRD导出验证',
      industry: '电商',
      targetAudience: '普通用户',
      version: '1.0.0',
    },
    globalRules: {
      performance: '首屏 3 秒内可交互',
      security: '登录态加密',
      compatibility: 'Chrome/Safari 最新版',
      errorHandling: '明确提示与重试',
      dataTracking: '关键操作可追溯',
    },
    nodes: [
      {
        id: 'product_list_1',
        data: {
          label: '商品列表',
          artifacts: {
            spec: {
              title: '商品列表',
              requirements: '发现/列表页，包含搜索框、筛选、排序、分页；点击进入详情。',
            },
            view: { code: uiCode },
          },
        },
        type: 'page',
      },
    ],
  };

  console.log('[export-prd] 请求', baseUrl + '/api/export-prd-html');
  let res;
  try {
    res = await fetch(baseUrl + '/api/export-prd-html', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.error('[export-prd] 请求失败:', e.message);
    process.exit(1);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok || !data.html) {
    console.error('[export-prd] 导出失败:', data.error || res.statusText, data);
    process.exit(1);
  }
  mkdirSync(outDir, { recursive: true });
  writeFileSync(outPath, data.html, 'utf-8');
  console.log('[export-prd] 已写入:', outPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
