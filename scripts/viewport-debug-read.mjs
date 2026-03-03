#!/usr/bin/env node
/**
 * 读取最近一次 UI 生成时服务端收到的视口（由 generateUIFromText 写入）。
 * 用法: node scripts/viewport-debug-read.mjs
 * 请先：在应用中点「桌面」→ 输入「生成UI」→ 发送，再运行本脚本。
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, 'viewport-debug-last.json');

if (!existsSync(file)) {
  console.log('未找到 scripts/viewport-debug-last.json');
  console.log('请先在应用中：选择「桌面」视口 → 输入「生成UI」→ 发送，再运行本脚本。');
  process.exit(1);
}

const data = JSON.parse(readFileSync(file, 'utf8'));
console.log('最近一次生成时服务端收到的视口:');
console.log(JSON.stringify(data, null, 2));
if (data.received !== data.viewportUsed) {
  console.log('\n⚠️ 收到的值与使用的不一致，已按 viewportUsed 纠正。');
}
process.exit(0);
