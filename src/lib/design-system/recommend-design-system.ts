/**
 * 智能推荐模式：根据项目画像与页面上下文生成「设计系统」Markdown，注入 UI 生成 System Prompt。
 * 对齐 UIUXProMax 输出结构（Pattern / Style / Colors / Typography / Effects / Avoid），由单次 LLM 结构化输出实现。
 */

import { z } from 'zod';
import { callText } from '@/lib/ai/llm';
import { getModelForTier } from '@/lib/ai-config';
import type { GenerationTier } from '@/lib/ai-config';

const DesignSystemRecommendSchema = z.object({
  patternSummary: z.string().max(1200).describe('页面结构/版式建议'),
  styleName: z.string().max(120),
  styleKeywords: z.array(z.string()).max(10),
  colors: z.object({
    primary: z.string(),
    secondary: z.string(),
    cta: z.string(),
    background: z.string(),
    text: z.string(),
    notes: z.string().optional(),
  }),
  typography: z.string().max(400),
  keyEffects: z.string().max(500),
  antiPatterns: z.array(z.string()).max(12),
});

export type DesignSystemRecommend = z.infer<typeof DesignSystemRecommendSchema>;

function parseJsonFromModelText(text: string): unknown {
  const t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fence ? fence[1].trim() : t;
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(body.slice(start, end + 1));
  } catch {
    return null;
  }
}

function toMarkdown(d: DesignSystemRecommend): string {
  const kw = d.styleKeywords.length ? d.styleKeywords.join('、') : '—';
  const avoid = d.antiPatterns.length ? d.antiPatterns.map((a) => `- ${a}`).join('\n') : '- （无额外禁止项，遵循通用设计基准）';
  return `
# [本次推荐设计系统 - 智能推荐模式]

以下由项目上下文推导，**建议在整页 UI 中统一落实**（与 Tailwind 类名结合使用；色值可用近似类如 bg-[#xxx] 或最接近的 palette）。

## PATTERN（版式与信息架构）
${d.patternSummary}

## STYLE
- **名称**：${d.styleName}
- **关键词**：${kw}

## COLORS
| 角色 | 建议色 |
|------|--------|
| Primary | ${d.colors.primary} |
| Secondary | ${d.colors.secondary} |
| CTA | ${d.colors.cta} |
| Background | ${d.colors.background} |
| Text | ${d.colors.text} |
${d.colors.notes ? `\n*说明：${d.colors.notes}*\n` : ''}

## TYPOGRAPHY
${d.typography}

## KEY EFFECTS
${d.keyEffects}

## AVOID（反模式）
${avoid}
`.trim();
}

export type RecommendDesignSystemInput = {
  projectMeta?: {
    projectName: string;
    industry: string;
    targetAudience: string;
    description: string;
  };
  nodeLabel: string;
  pageDescription?: string;
  prompt?: string;
  aiConfig?: { visionModel?: string; textModel?: string };
  /** 默认 draft 以省成本 */
  tier?: GenerationTier;
};

/**
 * 返回可追加到 system 的 Markdown；关闭开关或失败时返回空字符串。
 */
export async function recommendDesignSystemMarkdown(
  input: RecommendDesignSystemInput
): Promise<string> {
  if (process.env.AI_DESIGN_SYSTEM_RECOMMEND === '0') {
    return '';
  }

  const pm = input.projectMeta;
  const userParts = [
    pm
      ? `项目名称: ${pm.projectName}\n行业: ${pm.industry}\n目标用户: ${pm.targetAudience}\n项目描述: ${pm.description || '（无）'}`
      : '（无项目画像）',
    `页面/节点名称: ${input.nodeLabel}`,
    input.pageDescription ? `页面需求摘要:\n${input.pageDescription.slice(0, 4000)}` : '',
    input.prompt ? `用户补充:\n${input.prompt.slice(0, 2000)}` : '',
  ].filter(Boolean);

  const system = `你是资深产品设计师。根据上下文输出**唯一一个 JSON 对象**，不要 markdown 围栏以外的文字。
字段要求：
- patternSummary: 字符串，中文，建议本页的区块结构（Hero/列表/详情/底栏等），2～6 句。
- styleName: 字符串，中文，概括 UI 气质（如「现代极简 SaaS」「温暖生活服务」）。
- styleKeywords: 字符串数组，3～8 个英文或中文关键词（如 soft-shadow、rounded-xl、高密度表格）。
- colors: 对象，五个键 primary/secondary/cta/background/text，值为 **HEX 或 Tailwind 色名**（如 #2563eb 或 slate-900）；可选 notes。
- typography: 字符串，中文，字体气质与层级建议（可写「无衬线 + 字重对比」等）。
- keyEffects: 字符串，中文，动效与 hover 建议（时长 150～300ms 等）。
- antiPatterns: 字符串数组，3～8 条，**本行业应避免的视觉**（如金融忌霓虹渐变）。

必须合法 JSON，无注释，无尾逗号。`;

  const tier = input.tier ?? 'draft';
  const model = getModelForTier(tier, 'text', input.aiConfig ?? {});

  const result = await callText({
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: userParts.join('\n\n---\n\n') },
    ],
    temperature: 0.35,
    maxOutputTokens: 2500,
    actionName: 'recommendDesignSystem',
    aiConfig: input.aiConfig,
  });

  if (!result.ok) {
    return '';
  }

  const raw = parseJsonFromModelText(result.data);
  if (!raw || typeof raw !== 'object') {
    return '';
  }

  const parsed = DesignSystemRecommendSchema.safeParse(raw);
  if (!parsed.success) {
    return '';
  }

  return toMarkdown(parsed.data);
}
