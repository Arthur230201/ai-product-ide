/**
 * 设计系统推荐块注入前截断，避免撑满 system context（见 DESIGN_SYSTEM_DEV_CONSTRAINTS §7）。
 */

const DEFAULT_MAX_BYTES = 8192;

export function truncateDesignSystemMarkdown(markdown: string): string {
  const raw = process.env.DESIGN_SYSTEM_MARKDOWN_MAX_BYTES;
  const maxBytes =
    raw !== undefined && raw !== '' && !Number.isNaN(Number(raw))
      ? Math.max(512, Math.min(Number(raw), 64_000))
      : DEFAULT_MAX_BYTES;

  const buf = Buffer.from(markdown, 'utf8');
  if (buf.length <= maxBytes) return markdown;

  let end = Math.min(maxBytes, buf.length);
  const dec = new TextDecoder('utf-8', { fatal: true });
  while (end > 0) {
    try {
      dec.decode(buf.subarray(0, end));
      break;
    } catch {
      end -= 1;
    }
  }
  return `${buf.subarray(0, end).toString('utf8')}\n\n…[设计系统块已截断，上限 ${maxBytes} 字节]`;
}
