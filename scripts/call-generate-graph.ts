/**
 * 一次性测试：直接调用 generateGraph，验证 LLM 是否可调用。
 * 用法：npx tsx scripts/call-generate-graph.ts  或  node --env-file=.env.local --import tsx scripts/call-generate-graph.ts
 * 需在项目根目录执行，且 .env.local 中有 OPENAI_API_KEY。
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
const envPath = join(process.cwd(), '.env.local');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}

const input = {
  prompt: '我要做一个打车 app，包含乘客端下单、行程、订单与支付',
};

async function main() {
  // 动态导入避免顶层 side-effect 与 path alias
  const mod = await import('../src/app/actions/generate-graph');
  const action = mod.generateGraph;
  // zsa: 从 client 调用时传 input 对象，服务端 handler 收到 { input }
  const fn = typeof action === 'function' ? action : (action as { $handler?: (arg: unknown) => Promise<unknown> }).$handler;
  if (typeof fn !== 'function') {
    console.error('generateGraph 不可调用:', typeof action, Object.keys(action || {}));
    process.exit(1);
  }
  console.log('调用 generateGraph，prompt:', input.prompt);
  // zsa action 对外接收的是 input 对象，内部会校验并传 handler({ input })
  const result = await fn(input as any);
  console.log('\n========== 返回结果 ==========');
  const out = Array.isArray(result) && result[1] == null ? result[0] : result;
  if (Array.isArray(result) && result[1] != null) {
    console.error('调用失败:', (result[1] as { message?: string }).message);
    process.exit(1);
  }
  console.log(JSON.stringify(out, null, 2).slice(0, 2000));
  const r = out as { ok?: boolean; type?: string; nodes?: unknown[]; edges?: unknown[] };
  if (r?.ok === false) {
    console.error('失败:', r.type, (out as { message?: string }).message);
    process.exit(1);
  }
  const nodes = (out as { nodes?: unknown[] })?.nodes;
  console.log('\n节点数:', Array.isArray(nodes) ? nodes.length : 'N/A');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
