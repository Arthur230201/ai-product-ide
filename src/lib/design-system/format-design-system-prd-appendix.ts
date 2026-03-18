import type { DesignSystemSnapshot } from '@/types/design-system-snapshot';

function escCell(s: string, max = 480): string {
  return String(s)
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ')
    .slice(0, max);
}

/**
 * 导出 PRD 时附录用 Markdown（由 prdGenerator marked 渲染）。
 */
export function formatDesignSystemPrdMarkdown(
  snapshot: DesignSystemSnapshot,
  locked: boolean
): string {
  const ap = snapshot.antiPatterns?.length
    ? snapshot.antiPatterns.slice(0, 16).join('；')
    : '—';
  const kw = snapshot.style.keywords?.length
    ? snapshot.style.keywords.join('、')
    : '—';
  return [
    '### 设计系统快照（导出时）',
    locked
      ? '**锁定状态**：已锁定（画布内 UI 生成优先使用本约束）'
      : '**锁定状态**：未锁定（以下为最近快照，仅供参考）',
    `**来源**：\`${snapshot.source}\` · **引擎版本**：\`${escCell(snapshot.engineVersion, 120)}\` · **生成时间**：${snapshot.createdAt}`,
    '',
    '| 维度 | 说明 |',
    '|------|------|',
    `| 风格 | ${escCell(snapshot.style.name)} |`,
    `| 关键词 | ${escCell(kw)} |`,
    `| Pattern | ${escCell(snapshot.pattern.summary)} |`,
    `| 色板 | ${escCell(
      `主 ${snapshot.colors.primary} · 次 ${snapshot.colors.secondary} · CTA ${snapshot.colors.cta} · 底 ${snapshot.colors.background} · 字 ${snapshot.colors.text}`
    )} |`,
    `| 字体气质 | ${escCell(snapshot.typography)} |`,
    `| 关键效果 | ${escCell(snapshot.keyEffects)} |`,
    `| 反模式（勿用） | ${escCell(ap, 600)} |`,
  ].join('\n');
}
