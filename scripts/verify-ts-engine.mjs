#!/usr/bin/env node
/**
 * TS 引擎 Golden 校验：固定输入 → 期望命中某个 styleId。
 * 用法：npm run verify:ts-engine
 */
import { spawnSync } from 'child_process';

async function main() {
  const code = `
import { readFileSync } from 'fs';
import path from 'path';
import { resolveDesignSystemTsEngine } from './src/lib/design-system/ts-engine/retrieve';
import { UUPM_TS_ENGINE_DATA } from './src/lib/design-system/ts-engine/uupm-data';
import { expandGoldenFixture } from './src/lib/design-system/ts-engine/golden-expand';
const root = process.cwd();
const fxRaw = JSON.parse(readFileSync(path.join(root,'__fixtures__/ts-engine/golden.json'),'utf8'));
const fx = expandGoldenFixture(fxRaw);
let ok = true;
for (const c of fx.cases) {
  const r = resolveDesignSystemTsEngine(c.input);
  const traceStyleId = r.snapshot.retrievalTrace?.find(t => t.domain === 'style')?.id;
  const pickedId = traceStyleId
    ? traceStyleId
    : (UUPM_TS_ENGINE_DATA.styles.find(s => s.style.name === r.snapshot.style.name)?.id || 'unknown');
  if (pickedId !== c.expectStyleId) {
    ok = false;
    console.error('[golden] FAIL', c.name, { expect: c.expectStyleId, got: pickedId, styleName: r.snapshot.style.name });
  } else {
    console.log('[golden] OK', c.name, pickedId);
  }
}
process.exit(ok ? 0 : 1);
`;
  const res = spawnSync('npx', ['tsx', '-e', code], { cwd: process.cwd(), stdio: 'inherit', shell: false });
  process.exit(res.status ?? 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

