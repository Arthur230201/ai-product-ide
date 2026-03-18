/**
 * 构建 TS 引擎数据包（版本化 JSON 生成物）
 * 用法：npm run build:uupm-data
 */
import fs from 'fs';
import path from 'path';
import { UupmTsEngineDataSchema, UUPM_TS_ENGINE_DATA } from '@/lib/design-system/ts-engine/uupm-data';

function safeFilename(s: string): string {
  return s.replace(/[^\w@.-]+/g, '-');
}

function main() {
  const parsed = UupmTsEngineDataSchema.safeParse(UUPM_TS_ENGINE_DATA);
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error(parsed.error.issues.slice(0, 12));
    process.exit(1);
  }

  const outDir = path.join(process.cwd(), 'public', 'uupm-data');
  fs.mkdirSync(outDir, { recursive: true });
  const version = parsed.data.version;
  const outPath = path.join(outDir, `${safeFilename(version)}.json`);
  fs.writeFileSync(outPath, JSON.stringify(parsed.data, null, 2), 'utf8');
  // eslint-disable-next-line no-console
  console.log('[build-uupm-data] wrote', outPath);
}

main();

