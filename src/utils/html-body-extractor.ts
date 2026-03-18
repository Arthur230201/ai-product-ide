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

/** 判断是否为占位 UI 代码（无实际界面）。仅当为真实生成的功能 UI 时，「界面」步骤才视为已完成。 */
export function isPlaceholderUiCode(code: string | undefined): boolean {
  if (!code || !code.trim()) return true;
  const t = code.trim();
  if (t === '// PLACEHOLDER') return true;
  if (/生成\s*UI\s*后将替换/.test(code)) return true;
  if (code.length < 280 && /这是\s*[\s\S]*?\s*页面[\s\S]*?生成\s*UI/.test(code)) return true;
  if (code.length < 520 && /这是\s*[\s\S]*?页面/.test(code) && !/Button|Card|Input|ListItem|AppBar|Sidebar|Dialog|Badge|StatCard|PageHeader|NavBar|TabsList|Separator|Progress|Alert|Avatar/.test(code)) return true;
  if (code.length < 700 && /BlankPage\s*\(\)/.test(code) && /border\s+border-gray-200\s+flex\s+items-center\s+justify-center/.test(code)) return true;
  if (code.length < 700 && /function\s+App\s*\(\)/.test(code) && /这是\s*[\s\S]*?页面/.test(code) && !/Button|Card|Input|ListItem|AppBar|Sidebar|Dialog|Badge|StatCard|PageHeader|NavBar|TabsList|Separator|Progress|Alert|Avatar/.test(code)) return true;
  if (code.length < 600 && /<h1[^>]*>[\s\S]*?<\/h1>/.test(code) && !/<(ul|ol|table|form|input|select|textarea|button)[\s>]/.test(code) && !/Button|Card|Input|ListItem|AppBar|Sidebar|Dialog|Badge|StatCard|PageHeader|NavBar|TabsList|Separator|Progress|Alert|Avatar/.test(code)) return true;
  return false;
}

export { isHtmlCode };
