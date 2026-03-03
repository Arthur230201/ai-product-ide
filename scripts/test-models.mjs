#!/usr/bin/env node

/**
 * 模型兼容性测试脚本
 * 
 * 测试 reelxai.com / llmxapi.com 等 OpenAI 兼容代理上各模型的可用性
 * 
 * 用法: node scripts/test-models.mjs
 * 会读取 .env.local 中的 OPENAI_API_KEY 和 OPENAI_BASE_URL
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// 加载 .env.local
function loadEnv() {
  const envPath = join(projectRoot, '.env.local');
  if (!existsSync(envPath)) {
    console.error('❌ .env.local 不存在');
    process.exit(1);
  }
  const content = readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eq = trimmed.indexOf('=');
      if (eq > 0) {
        const key = trimmed.slice(0, eq).trim();
        let val = trimmed.slice(eq + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  }
}

loadEnv();

const API_KEY = process.env.OPENAI_API_KEY;
let BASE_URL = process.env.OPENAI_BASE_URL?.trim() || 'https://api.openai.com';
if (!BASE_URL.endsWith('/v1')) {
  BASE_URL = BASE_URL.replace(/\/$/, '') + '/v1';
}

if (!API_KEY) {
  console.error('❌ OPENAI_API_KEY 未配置');
  process.exit(1);
}

// 重点关注：优先测试（用户指定）
const PRIORITY_MODELS = [
  'gemini-3.1-pro-preview',
  'gpt-5.3',
  'gpt-5.3-chat',
  'gpt-5.3-2026',
];

// 推荐模型列表（来自 reelxai 教程）
const RECOMMENDED_MODELS = [
  'gemini-3.1-pro-preview',
  'gemini-3-flash-preview',
  'gemini-3-pro-preview',
  'gpt-5.3',
  'gpt-5.3-chat',
  'gpt-5.2-2025-12-11',
  'gpt-5.1-chat-2025-11-13',
  'gpt-5.1-2025-11-13',
  'gpt-5-chat-latest',
  'gpt-5-2025-08-07',
  'gpt-5-mini-2025-08-07',
  'gpt-5-nano-2025-08-07',
  'gemini-2.5-pro',
  'gemini-2.5-pro-thinking-128',
  'gemini-2.5-flash',
  'gemini-2.5-flash-nothinking',
  'gemini-2.5-flash-lite-preview-06-17',
  'gpt-4o',
  'gpt-4.1',
  'o3',
  'claude-sonnet-4-6',
  'claude-haiku-4-5-20251001',
  'claude-sonnet-4-5-20250929',
  'claude-sonnet-4-20250514',
  'claude-3-7-sonnet-20250219',
  'deepseek-r1-250528',
  'deepseek-v3-1-250821',
  'grok-3',
  'grok-4',
  'grok-4.1',
];

// 去重且优先模型在前
const ALL_MODELS = [...new Set([...PRIORITY_MODELS, ...RECOMMENDED_MODELS])];

const colors = { reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', cyan: '\x1b[36m' };

async function testModel(modelId) {
  const url = `${BASE_URL}/chat/completions`;
  const body = JSON.stringify({
    model: modelId,
    messages: [{ role: 'user', content: 'Say "ok" in one word.' }],
    max_tokens: 10,
  });
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const data = await res.json();
    if (!res.ok) {
      const errMsg = data?.error?.message || data?.message || res.statusText || 'Unknown';
      return { ok: false, error: `${res.status}: ${errMsg}` };
    }
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) {
      return { ok: false, error: 'Empty or invalid response format' };
    }
    return { ok: true, text };
  } catch (e) {
    if (e.name === 'AbortError') return { ok: false, error: 'Timeout (15s)' };
    return { ok: false, error: e.message || String(e) };
  }
}

async function main() {
  console.log(`\n${colors.cyan}🔬 模型兼容性测试${colors.reset}`);
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   共测试 ${ALL_MODELS.length} 个模型（含重点关注: gemini-3.1-pro、gpt-5.3）\n`);

  const results = { ok: [], fail: [] };
  for (const model of ALL_MODELS) {
    const isPriority = PRIORITY_MODELS.includes(model);
    const label = isPriority ? `${colors.yellow}[重点]${colors.reset} ` : '';
    process.stdout.write(`   ${label}${model.padEnd(42)} `);
    const r = await testModel(model);
    if (r.ok) {
      console.log(`${colors.green}✅ OK${colors.reset}`);
      results.ok.push(model);
    } else {
      console.log(`${colors.red}❌ ${r.error}${colors.reset}`);
      results.fail.push({ model, error: r.error });
    }
  }

  const priorityOk = results.ok.filter((m) => PRIORITY_MODELS.includes(m));
  const priorityFail = results.fail.filter((f) => PRIORITY_MODELS.includes(f.model));

  console.log(`\n${colors.cyan}📊 结果汇总${colors.reset}`);
  console.log(`   ✅ 可用: ${results.ok.length} 个`);
  if (priorityOk.length > 0) {
    console.log(`   ${colors.yellow}重点关注模型 - 可用:${colors.reset}`);
    priorityOk.forEach((m) => console.log(`     - ${m}`));
  }
  if (priorityFail.length > 0) {
    console.log(`   ${colors.yellow}重点关注模型 - 不可用:${colors.reset}`);
    priorityFail.forEach((f) => console.log(`     - ${f.model}: ${f.error}`));
  }
  if (results.ok.length > 0) {
    console.log(`   ${colors.green}全部可用模型:${colors.reset}`);
    results.ok.forEach((m) => console.log(`     - ${m}`));
  }
  if (results.fail.length > 0) {
    console.log(`   ❌ 不可用: ${results.fail.length} 个`);
  }
  console.log('');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
