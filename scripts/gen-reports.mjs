#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const root = path.join(__dirname, '..');
const indexPath = path.join(root, 'docs/design-research/01-INDEX-200-ENTERPRISES.md');
const reportsDir = path.join(root, 'docs/design-research/reports');
const index = fs.readFileSync(indexPath, 'utf8');
const lines = index.split('\n').filter((l) => /^\| \d+\s+\|/.test(l));
const skip = new Set([118, 181]);

function slug(s, max = 30) {
  return s
    .replace(/[/\\:*?"<>|]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, max)
    .replace(/-$/, '') || 'DS';
}

for (const line of lines) {
  const m = line.match(/\|\s*(\d+)\s+\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\s*\|/);
  if (!m) continue;
  const num = parseInt(m[1], 10);
  if (num < 131 || num > 200 || skip.has(num)) continue;
  const org = m[2].trim();
  const ds = m[3].trim();
  const url = m[4].trim();
  const fname = String(num).padStart(3, '0') + '-' + slug(org, 22) + '-' + slug(ds, 18) + '.md';
  const content = `# ${num} ${org} - ${ds} 设计学习报告

## 1. 组织与设计系统名称

- **组织**：${org}
- **设计系统名称**：${ds}
- **官方链接**：${url}

## 2. 设计理念与原则

- **说明**：本报告基于索引建卡；一手文档待后续批次访问 ${url} 后补充。

## 3. 视觉与基础规范

- 待补充（后续批次）。

## 4. 组件与模式

- 待补充（后续批次）。

## 5. 可访问性与包容性

- 待补充（后续批次）。

## 6. 与本项目可借鉴的共性

- 待 2–5 节补充后再归纳。
`;
  fs.writeFileSync(path.join(reportsDir, fname), content);
  console.log(fname);
}
