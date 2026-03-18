import type { DesignSystemSnapshot } from '@/types/design-system-snapshot';

/**
 * 将 search.py --design-system 的 Markdown stdout 转为可持久化的 DesignSystemSnapshot。
 * 结构化字段为摘要占位；**主生成以 markdownBlock 为准**。
 */
export function buildUupmDesignSystemSnapshot(
  uupmMarkdown: string,
  ctx: { queryHint: string; projectName?: string }
): DesignSystemSnapshot {
  const trimmed = uupmMarkdown.trim();
  const block = `# [本次推荐设计系统 · UIUXProMax 检索]\n\n以下由本地 **search.py --design-system**（BM25 多域检索）生成，请在整页 UI 中统一落实。\n\n${trimmed}`;
  const preview = trimmed.slice(0, 500).replace(/\s+/g, ' ').trim();
  const hint = ctx.queryHint.slice(0, 48).trim() || 'general';
  return {
    schemaVersion: 1,
    engineVersion: process.env.UIUXPROMAX_ENGINE_VERSION?.trim() || 'uupm-search-py@1',
    source: 'python_uupm',
    createdAt: new Date().toISOString(),
    pattern: { summary: preview.slice(0, 400) },
    style: {
      name: 'UIUXProMax 检索推荐',
      keywords: ['bm25', 'uupm', hint],
    },
    colors: {
      primary: '#0f172a',
      secondary: '#64748b',
      cta: '#2563eb',
      background: '#f8fafc',
      text: '#1e293b',
    },
    typography: '以 Markdown 正文的字体与排版章节为准',
    keyEffects: '以 Markdown 正文的效果与层级说明为准',
    antiPatterns: ['以 Markdown 中的避免项与 UX 准则为准'],
    markdownBlock: block,
  };
}
