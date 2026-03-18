import { z } from 'zod';

/** 项目级设计系统快照（M1：与推荐 LLM 输出对齐，可持久化） */
export const DesignSystemSnapshotSchema = z.object({
  schemaVersion: z.literal(1),
  engineVersion: z.string().max(128),
  source: z.enum(['llm_draft', 'python_uupm', 'ts_engine', 'manual_override']),
  createdAt: z.string(),
  contextHash: z.string().optional(),
  /**
   * 可解释性：检索命中证据（top-k）与应用规则痕迹。
   * - 不要求所有来源都有；TS 引擎/未来服务端引擎应尽量填充。
   */
  retrievalTrace: z
    .array(
      z.object({
        domain: z.string(),
        id: z.string(),
        score: z.number(),
        matchedTags: z.array(z.string()).optional(),
      })
    )
    .optional(),
  ruleTrace: z.array(z.string()).optional(),
  pattern: z.object({ summary: z.string() }),
  style: z.object({
    name: z.string(),
    keywords: z.array(z.string()),
  }),
  colors: z.object({
    primary: z.string(),
    secondary: z.string(),
    cta: z.string(),
    background: z.string(),
    text: z.string(),
    notes: z.string().optional(),
  }),
  typography: z.string(),
  keyEffects: z.string(),
  antiPatterns: z.array(z.string()),
  /** 反模式行业证据（结构化，便于门禁与审计） */
  avoidEvidence: z
    .object({
      industry: z.string().nullable(),
      matchedIndustryKeywords: z.array(z.string()),
      matchedAntiPatterns: z.array(z.string()),
    })
    .optional(),
  /** 可访问性规则（结构化一等字段，来自 a11y 域融合） */
  a11yRules: z.array(z.string()).optional(),
  /** 注入 generateUIFromText system 的完整 Markdown */
  markdownBlock: z.string().min(1),
});

export type DesignSystemSnapshot = z.infer<typeof DesignSystemSnapshotSchema>;

export function safeParseDesignSystemSnapshot(
  raw: unknown
): { ok: true; data: DesignSystemSnapshot } | { ok: false } {
  const r = DesignSystemSnapshotSchema.safeParse(raw);
  return r.success ? { ok: true, data: r.data } : { ok: false };
}
