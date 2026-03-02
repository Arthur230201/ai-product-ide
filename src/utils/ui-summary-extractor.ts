/**
 * UI Summary Extractor
 * 
 * Extracts UI element summaries from HTML or React code for PRD generation.
 * Provides structured context to reduce AI hallucinations.
 */

export interface UISummary {
  buttons: Array<{ text: string; selector?: string }>;
  links: Array<{ text: string; href?: string; selector?: string }>;
  inputs: Array<{ placeholder?: string; type?: string; selector?: string }>;
  selects: Array<{ options?: string[]; selector?: string }>;
  headings: Array<{ text: string; level: number; selector?: string }>;
  listItems: Array<{ text: string; selector?: string }>;
  cards: Array<{ title?: string; content?: string; selector?: string }>;
}

/**
 * Extract UI summary from HTML code
 */
export function extractUISummaryFromHTML(html: string): UISummary {
  const summary: UISummary = {
    buttons: [],
    links: [],
    inputs: [],
    selects: [],
    headings: [],
    listItems: [],
    cards: [],
  };

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const body = doc.body;
    if (!body) return summary;

    // Extract buttons
    const buttons = body.querySelectorAll('button, [role="button"]');
    buttons.forEach((btn, index) => {
      const text = btn.textContent?.trim() || '';
      if (text) {
        summary.buttons.push({
          text,
          selector: btn.id ? `#${btn.id}` : `button:nth-of-type(${index + 1})`,
        });
      }
    });

    // Extract links
    const links = body.querySelectorAll('a[href]');
    links.forEach((link, index) => {
      const text = link.textContent?.trim() || '';
      const href = link.getAttribute('href') || '';
      if (text) {
        summary.links.push({
          text,
          href,
          selector: link.id ? `#${link.id}` : `a:nth-of-type(${index + 1})`,
        });
      }
    });

    // Extract inputs
    const inputs = body.querySelectorAll('input, textarea');
    inputs.forEach((input, index) => {
      const placeholder = input.getAttribute('placeholder') || '';
      const type = input.getAttribute('type') || input.tagName.toLowerCase();
      summary.inputs.push({
        placeholder,
        type,
        selector: input.id ? `#${input.id}` : `${type}:nth-of-type(${index + 1})`,
      });
    });

    // Extract selects
    const selects = body.querySelectorAll('select');
    selects.forEach((select, index) => {
      const options: string[] = [];
      select.querySelectorAll('option').forEach(opt => {
        const text = opt.textContent?.trim();
        if (text) options.push(text);
      });
      summary.selects.push({
        options,
        selector: select.id ? `#${select.id}` : `select:nth-of-type(${index + 1})`,
      });
    });

    // Extract headings
    const headings = body.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach((heading, index) => {
      const text = heading.textContent?.trim() || '';
      const level = parseInt(heading.tagName.charAt(1)) || 1;
      if (text) {
        summary.headings.push({
          text,
          level,
          selector: heading.id ? `#${heading.id}` : `${heading.tagName.toLowerCase()}:nth-of-type(${index + 1})`,
        });
      }
    });

    // Extract list items (sample first 10)
    const listItems = body.querySelectorAll('li');
    Array.from(listItems).slice(0, 10).forEach((li, index) => {
      const text = li.textContent?.trim() || '';
      if (text) {
        summary.listItems.push({
          text: text.substring(0, 100), // Limit length
          selector: `li:nth-of-type(${index + 1})`,
        });
      }
    });

    // Extract cards (divs with card-like classes or structure)
    const cards = body.querySelectorAll('[class*="card"], [class*="Card"], .bg-white.rounded, .bg-gray-50.rounded');
    Array.from(cards).slice(0, 10).forEach((card, index) => {
      const titleEl = card.querySelector('h1, h2, h3, h4, h5, h6, [class*="title"], [class*="Title"]');
      const title = titleEl?.textContent?.trim() || '';
      const content = card.textContent?.trim() || '';
      if (title || content) {
        summary.cards.push({
          title: title.substring(0, 50),
          content: content.substring(0, 200),
          selector: card.id ? `#${card.id}` : `.card:nth-of-type(${index + 1})`,
        });
      }
    });
  } catch (error) {
    console.error('[extractUISummaryFromHTML] Error:', error);
  }

  return summary;
}

/**
 * Extract UI summary from React code (simplified regex-based)
 */
export function extractUISummaryFromReact(code: string): UISummary {
  const summary: UISummary = {
    buttons: [],
    links: [],
    inputs: [],
    selects: [],
    headings: [],
    listItems: [],
    cards: [],
  };

  try {
    // Extract button text (simplified regex)
    const buttonMatches = code.matchAll(/<button[^>]*>([^<]+)<\/button>/gi);
    for (const match of buttonMatches) {
      const text = match[1]?.trim();
      if (text) {
        summary.buttons.push({ text });
      }
    }

    // Extract link text
    const linkMatches = code.matchAll(/<a[^>]*href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi);
    for (const match of linkMatches) {
      const text = match[2]?.trim();
      const href = match[1]?.trim();
      if (text) {
        summary.links.push({ text, href });
      }
    }

    // Extract input placeholders
    const inputMatches = code.matchAll(/<input[^>]*placeholder=["']([^"']+)["'][^>]*>/gi);
    for (const match of inputMatches) {
      const placeholder = match[1]?.trim();
      if (placeholder) {
        summary.inputs.push({ placeholder });
      }
    }

    // Extract headings
    const headingMatches = code.matchAll(/<h([1-6])[^>]*>([^<]+)<\/h[1-6]>/gi);
    for (const match of headingMatches) {
      const level = parseInt(match[1] || '1');
      const text = match[2]?.trim();
      if (text) {
        summary.headings.push({ text, level });
      }
    }

    // Extract list items (sample)
    const liMatches = code.matchAll(/<li[^>]*>([^<]+)<\/li>/gi);
    let liCount = 0;
    for (const match of liMatches) {
      if (liCount >= 10) break;
      const text = match[1]?.trim();
      if (text) {
        summary.listItems.push({ text: text.substring(0, 100) });
        liCount++;
      }
    }
  } catch (error) {
    console.error('[extractUISummaryFromReact] Error:', error);
  }

  return summary;
}

/**
 * Format UI summary as context string for AI prompts
 */
export function formatUISummaryForPrompt(summary: UISummary): string {
  const parts: string[] = [];

  if (summary.buttons.length > 0) {
    parts.push('## 按钮元素:');
    summary.buttons.forEach((btn, i) => {
      parts.push(`${i + 1}. "${btn.text}"${btn.selector ? ` (${btn.selector})` : ''}`);
    });
  }

  if (summary.links.length > 0) {
    parts.push('## 链接元素:');
    summary.links.forEach((link, i) => {
      parts.push(`${i + 1}. "${link.text}"${link.href ? ` -> ${link.href}` : ''}${link.selector ? ` (${link.selector})` : ''}`);
    });
  }

  if (summary.inputs.length > 0) {
    parts.push('## 输入框元素:');
    summary.inputs.forEach((input, i) => {
      const desc = input.placeholder ? `placeholder="${input.placeholder}"` : input.type || 'input';
      parts.push(`${i + 1}. ${desc}${input.selector ? ` (${input.selector})` : ''}`);
    });
  }

  if (summary.selects.length > 0) {
    parts.push('## 下拉选择元素:');
    summary.selects.forEach((select, i) => {
      const options = select.options?.join(', ') || '无选项';
      parts.push(`${i + 1}. 选项: ${options}${select.selector ? ` (${select.selector})` : ''}`);
    });
  }

  if (summary.headings.length > 0) {
    parts.push('## 标题元素:');
    summary.headings.forEach((heading, i) => {
      parts.push(`${i + 1}. H${heading.level}: "${heading.text}"${heading.selector ? ` (${heading.selector})` : ''}`);
    });
  }

  if (summary.listItems.length > 0) {
    parts.push('## 列表项示例 (前10项):');
    summary.listItems.forEach((item, i) => {
      parts.push(`${i + 1}. "${item.text}"${item.selector ? ` (${item.selector})` : ''}`);
    });
  }

  if (summary.cards.length > 0) {
    parts.push('## 卡片元素示例:');
    summary.cards.forEach((card, i) => {
      const desc = card.title ? `标题: "${card.title}"` : '';
      parts.push(`${i + 1}. ${desc}${card.selector ? ` (${card.selector})` : ''}`);
    });
  }

  return parts.length > 0 ? parts.join('\n') : '## 未检测到明显的UI元素';
}


