/**
 * 简化分词：兼容中英文混合，追求稳定与低依赖。
 * - 英文按 word
 * - 中文按 2-gram（提高召回）
 */

export function tokenizeForSearch(input: string): string[] {
  const s = input
    .toLowerCase()
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!s) return [];

  const parts = s.split(' ');
  const tokens: string[] = [];

  for (const p of parts) {
    if (!p) continue;
    // 中文 2-gram
    const hasCjk = /[\p{Script=Han}]/u.test(p);
    if (hasCjk && p.length >= 2) {
      for (let i = 0; i < p.length - 1; i += 1) {
        tokens.push(p.slice(i, i + 2));
      }
      continue;
    }
    tokens.push(p);
  }

  return tokens;
}

