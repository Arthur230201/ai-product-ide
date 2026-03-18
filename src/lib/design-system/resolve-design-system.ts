/**
 * 智能推荐解析链：可选 UIUXProMax Python，失败则 LLM（与 M1 一致）。
 */

import { log, logWarn } from '@/lib/logger';
import { runUupmDesignSystemMarkdown } from './run-uupm-python';
import { buildUupmDesignSystemSnapshot } from './build-uupm-snapshot';
import { resolveDesignSystemTsEngine } from './ts-engine/retrieve';
import {
  recommendDesignSystemWithSnapshot,
  type RecommendDesignSystemInput,
} from './recommend-design-system';
import type { DesignSystemSnapshot } from '@/types/design-system-snapshot';

function buildUupmQuery(input: RecommendDesignSystemInput): string {
  const parts: string[] = [];
  if (input.projectMeta?.industry) parts.push(input.projectMeta.industry);
  if (input.projectMeta?.description)
    parts.push(input.projectMeta.description.slice(0, 220));
  if (input.pageDescription) parts.push(input.pageDescription.slice(0, 220));
  parts.push(input.nodeLabel);
  if (input.prompt) parts.push(input.prompt.slice(0, 160));
  const q = parts.filter(Boolean).join(' ').trim();
  return q || 'saas dashboard';
}

export async function resolveDesignSystemAuto(
  input: RecommendDesignSystemInput
): Promise<{ markdown: string; snapshot: DesignSystemSnapshot | null }> {
  const projectName = input.projectMeta?.projectName?.trim() || 'Project';
  const query = buildUupmQuery(input);

  // 生产优先 TS 引擎；本地也可通过开关启用，以对齐 UIUXProMax 的“检索 + 规则”路径。
  const tsEnabled =
    process.env.DESIGN_SYSTEM_TS_ENGINE_ENABLED === '1' ||
    (process.env.DESIGN_SYSTEM_TS_ENGINE_ENABLED !== '0' && process.env.NODE_ENV === 'production');
  if (tsEnabled) {
    const r = resolveDesignSystemTsEngine({
      projectName,
      industry: input.projectMeta?.industry,
      description: input.projectMeta?.description,
      nodeLabel: input.nodeLabel,
      pageDescription: input.pageDescription,
      prompt: input.prompt,
    });
    return { markdown: r.markdown, snapshot: r.snapshot };
  }

  if (process.env.DESIGN_SYSTEM_UUPM_ENABLED === '1') {
    const u = await runUupmDesignSystemMarkdown({ query, projectName });
    if (u.ok) {
      const snapshot = buildUupmDesignSystemSnapshot(u.markdown, {
        queryHint: query,
        projectName,
      });
      log('📐 [resolveDesignSystem] UIUXProMax Python 路径成功', {
        markdownBytes: Buffer.byteLength(snapshot.markdownBlock, 'utf8'),
      });
      return { markdown: snapshot.markdownBlock, snapshot };
    }
    logWarn('[resolveDesignSystem] UUPM Python 不可用，回退 LLM 推荐', {
      reason: u.reason,
    });
  }

  return recommendDesignSystemWithSnapshot(input);
}
