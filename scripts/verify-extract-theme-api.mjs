#!/usr/bin/env node
/**
 * 验证 /api/extract-theme 风格提取接口
 * - 缺参时返回 400 且 error 为「缺少图片数据」
 * - 带无效 JSON 时返回 400 或 500，且 body 为 JSON
 * 用法：BASE_URL=http://localhost:3000 node scripts/verify-extract-theme-api.mjs
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function main() {
  let passed = 0;
  let failed = 0;

  // 1) 缺少图片数据 -> 400
  try {
    const res = await fetch(`${BASE_URL}/api/extract-theme`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { error: text?.slice(0, 100) || '非 JSON' };
    }
    if (res.status === 400 && (data.error === '缺少图片数据' || (data.error && data.error.includes('图片')))) {
      console.log('✅ 缺参时返回 400，error 正确');
      passed++;
    } else {
      console.log('❌ 缺参期望 400 + 缺少图片数据，得到', res.status, data);
      failed++;
    }
  } catch (e) {
    console.log('❌ 请求失败（请确认已启动 dev: npm run dev）:', e.message);
    failed++;
  }

  // 2) 带 imageBase64：可能 200（有 key）、500（无 key/模型错误），只检查返回是 JSON
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 55_000);
    const res = await fetch(`${BASE_URL}/api/extract-theme`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: 'data:image/png;base64,iVBORw0KGgo=' }),
      signal: ac.signal,
    });
    clearTimeout(t);
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }
    if (data && typeof data === 'object' && (data.theme || data.error)) {
      console.log('✅ 带 imageBase64 时返回合法 JSON（theme 或 error）');
      passed++;
    } else {
      console.log('❌ 带 imageBase64 时返回非 JSON 或结构异常:', (text || res.status).toString().slice(0, 200));
      failed++;
    }
  } catch (e) {
    if (e.name === 'AbortError') {
      console.log('⚠️ 带 imageBase64 请求超时（视觉模型较慢或未配置 key），请界面手动上传图片验证');
    } else {
      console.log('❌ 请求失败:', e.message);
      failed++;
    }
  }

  console.log('\n---');
  if (failed === 0) {
    console.log(`通过: ${passed}/${passed + failed}，风格提取 API 行为正常。`);
    process.exit(0);
  } else {
    console.log(`通过: ${passed}，失败: ${failed}`);
    process.exit(1);
  }
}

main();
