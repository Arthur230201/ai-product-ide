/**
 * HTML Body Extractor
 * 从完整 HTML 中提取 body 与 style，供 PRD 界面示意等使用。
 */

export function extractStylesFromHtml(html: string): string {
  if (!html || html.trim().length === 0) return '';
  const innerRe = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  const innerContents: string[] = [];
  let m;
  while ((m = innerRe.exec(html)) !== null) {
    if (m[1]?.trim()) innerContents.push(m[1].trim());
  }
  return innerContents.length ? '<style>' + innerContents.join('\n') + '</style>' : '';
}

export function extractBodyContent(html: string): string {
  if (!html || html.trim().length === 0) return '';
  let content = html.trim();
  if (content.includes('<body')) {
    const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch?.[1]) content = bodyMatch[1].trim();
  }
  content = content.replace(/<!DOCTYPE[^>]*>/gi, '');
  content = content.replace(/<html[^>]*>/gi, '');
  content = content.replace(/<\/html>/gi, '');
  content = content.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');
  content = content.replace(/<script[\s\S]*?<\/script>/gi, '');
  content = content.replace(/<style[\s\S]*?<\/style>/gi, '');
  return content.trim();
}

function isHtmlCode(code: string): boolean {
  const t = code.trim();
  return t.startsWith('<!') || (t.includes('<html') && t.includes('</html>')) || (t.includes('<div') && t.includes('class=') && !t.includes('className='));
}

export { isHtmlCode };
