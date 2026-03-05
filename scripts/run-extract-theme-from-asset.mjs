#!/usr/bin/env node
/**
 * 使用指定图片调用 /api/extract-theme，将提取结果写入 scripts/iteration-reports/extracted-theme.json
 * 用法：node scripts/run-extract-theme-from-asset.mjs [图片路径]
 * 默认图片：.cursor/projects/.../assets/image-3af79f29-986a-4623-b6ec-3220a93f0a9c.png（需在项目根执行）
 */

import { readFileSync, writeFileSync, mkdirSync, accessSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = resolve(__dirname, '..');

function findDefaultImage() {
  if (process.env.THEME_IMAGE_PATH) return process.env.THEME_IMAGE_PATH;
  const inProject = join(projectRoot, 'assets/image-3af79f29-986a-4623-b6ec-3220a93f0a9c.png');
  const inCursor = join(process.env.HOME || '', '.cursor/projects/Users-qingflow-Documents-ai-product-ide/assets/image-3af79f29-986a-4623-b6ec-3220a93f0a9c.png');
  try {
    accessSync(inProject);
    return inProject;
  } catch {
    return inCursor;
  }
}

const DEFAULT_IMAGE_PATH = findDefaultImage();

const imagePath = process.argv[2] || DEFAULT_IMAGE_PATH;
const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';
const outDir = join(projectRoot, 'scripts', 'iteration-reports');
const outPath = join(outDir, 'extracted-theme.json');

async function main() {
  let buffer;
  try {
    buffer = readFileSync(imagePath);
  } catch (e) {
    console.error('读取图片失败:', imagePath, e.message);
    process.exit(1);
  }
  const base64 = buffer.toString('base64');
  const dataUrl = `data:image/png;base64,${base64}`;

  console.log('调用 extract-theme API...');
  const res = await fetch(`${BASE_URL}/api/extract-theme`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: dataUrl }),
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    console.error('API 返回非 JSON:', text.slice(0, 300));
    process.exit(1);
  }

  if (!res.ok) {
    console.error('API 错误:', res.status, data);
    process.exit(1);
  }

  if (!data.theme) {
    console.error('响应中无 theme 字段:', data);
    process.exit(1);
  }

  mkdirSync(outDir, { recursive: true });
  writeFileSync(outPath, JSON.stringify(data.theme, null, 2), 'utf8');
  console.log('提取结果已写入:', outPath);
  console.log('vibe:', data.theme.vibe);
  console.log('primary:', data.theme.colors?.primary, 'secondary:', data.theme.colors?.secondary);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
