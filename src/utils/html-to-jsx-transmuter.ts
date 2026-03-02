/**
 * HTML to JSX Transmuter
 * 
 * Converts raw HTML strings into valid JSX code strings that can be compiled by Babel.
 * This is the first step in the JIT compilation pipeline.
 */

/**
 * Extracts Tailwind config from HTML and returns it as a separate string
 */
export function extractTailwindConfig(html: string): { configString: string; cleanedHtml: string } {
  // Pattern 1: <script>tailwind.config = {...}</script>
  const pattern1 = /<script[^>]*>[\s\S]*?tailwind\.config\s*=\s*({[\s\S]*?})[\s\S]*?<\/script>/i;
  const match1 = html.match(pattern1);
  
  if (match1 && match1[1]) {
    const cleanedHtml = html.replace(pattern1, '');
    return {
      configString: `window.tailwind.config = ${match1[1]};`,
      cleanedHtml: cleanedHtml.trim(),
    };
  }

  // Pattern 2: <script>window.tailwind.config = {...}</script>
  const pattern2 = /<script[^>]*>[\s\S]*?window\.tailwind\.config\s*=\s*({[\s\S]*?})[\s\S]*?<\/script>/i;
  const match2 = html.match(pattern2);
  
  if (match2 && match2[1]) {
    const cleanedHtml = html.replace(pattern2, '');
    return {
      configString: `window.tailwind.config = ${match2[1]};`,
      cleanedHtml: cleanedHtml.trim(),
    };
  }

  return {
    configString: '',
    cleanedHtml: html.trim(),
  };
}

/**
 * Converts inline style strings to JSX style objects
 * Example: style="color: red; background: blue" -> style={{color: 'red', background: 'blue'}}
 */
function convertInlineStyles(styleString: string): string {
  if (!styleString) return '';
  
  const styles: Record<string, string> = {};
  const pairs = styleString.split(';').filter(pair => pair.trim());
  
  pairs.forEach(pair => {
    const [key, value] = pair.split(':').map(s => s.trim());
    if (key && value) {
      // Convert kebab-case to camelCase
      const camelKey = key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      styles[camelKey] = value;
    }
  });
  
  return JSON.stringify(styles);
}

/**
 * Transmutes raw HTML to valid JSX code string
 * 
 * @param html - Raw HTML string
 * @returns Object with jsx code string and config string
 */
export function transmuteHtmlToJsx(html: string): { jsx: string; configString: string } {
  if (!html || html.trim().length === 0) {
    return { jsx: '', configString: '' };
  }

  let jsx = html;

  // 1. Extract and remove Tailwind config (will be injected separately)
  const { configString, cleanedHtml } = extractTailwindConfig(html);
  jsx = cleanedHtml;

  // 2. Remove DOCTYPE, html, head, body tags (keep only body content)
  jsx = jsx.replace(/<!DOCTYPE[^>]*>/gi, '');
  jsx = jsx.replace(/<html[^>]*>/gi, '');
  jsx = jsx.replace(/<\/html>/gi, '');
  jsx = jsx.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');
  
  // Extract body content if present
  if (jsx.includes('<body')) {
    const bodyMatch = jsx.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch && bodyMatch[1]) {
      jsx = bodyMatch[1].trim();
    }
  }

  // 3. Remove script and style tags (they should be handled separately)
  jsx = jsx.replace(/<script[\s\S]*?<\/script>/gi, '');
  jsx = jsx.replace(/<style[\s\S]*?<\/style>/gi, '');

  // 4. Convert class= to className=
  jsx = jsx.replace(/class="/g, 'className="');
  jsx = jsx.replace(/class='/g, "className='");

  // 5. Convert inline styles to JSX format
  jsx = jsx.replace(/style="([^"]*)"/g, (match, styleContent) => {
    const jsxStyle = convertInlineStyles(styleContent);
    return `style={${jsxStyle}}`;
  });
  jsx = jsx.replace(/style='([^']*)'/g, (match, styleContent) => {
    const jsxStyle = convertInlineStyles(styleContent);
    return `style={${jsxStyle}}`;
  });

  // 6. Close void tags (self-closing)
  const voidTags = ['input', 'img', 'br', 'hr', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'];
  voidTags.forEach(tag => {
    // Match opening tags that are not already self-closing
    const regex = new RegExp(`<${tag}([^>]*?)(?<!/)>`, 'gi');
    jsx = jsx.replace(regex, (match, attributes) => {
      if (match.endsWith('/>')) {
        return match;
      }
      return `<${tag}${attributes} />`;
    });
  });

  // 7. Remove HTML comments
  jsx = jsx.replace(/<!--[\s\S]*?-->/g, '');

  // 8. Convert SVG attributes (kebab-case to camelCase)
  const svgAttributeMap: Record<string, string> = {
    'stroke-width': 'strokeWidth',
    'stroke-linecap': 'strokeLinecap',
    'stroke-linejoin': 'strokeLinejoin',
    'fill-rule': 'fillRule',
    'clip-path': 'clipPath',
    'clip-rule': 'clipRule',
    'text-anchor': 'textAnchor',
    'font-family': 'fontFamily',
    'font-size': 'fontSize',
    'font-weight': 'fontWeight',
    'letter-spacing': 'letterSpacing',
    'word-spacing': 'wordSpacing',
    'text-decoration': 'textDecoration',
    'xml:space': 'xmlSpace',
  };

  Object.entries(svgAttributeMap).forEach(([kebab, camel]) => {
    const regex = new RegExp(`${kebab}="([^"]*)"`, 'gi');
    jsx = jsx.replace(regex, `${camel}="$1"`);
    const regexSingle = new RegExp(`${kebab}='([^']*)'`, 'gi');
    jsx = jsx.replace(regexSingle, `${camel}='$1'`);
  });

  // 9. Remove onclick handlers (we'll inject React handlers)
  jsx = jsx.replace(/onclick="[^"]*"/gi, '');
  jsx = jsx.replace(/onclick='[^']*'/gi, '');

  // 10. Inject event handlers into interactive elements
  // Buttons
  jsx = jsx.replace(/<button\s+([^>]*?)>/gi, (match, attrs) => {
    if (/onClick=/i.test(attrs)) {
      return match; // Already has onClick
    }
    return `<button ${attrs} onClick={(e) => handleInteract(e, 'btn')}>`;
  });

  // Links (that look like buttons)
  jsx = jsx.replace(/<a\s+([^>]*?)(?<!\/)>/gi, (match, attrs) => {
    if (/onClick=/i.test(attrs)) {
      return match;
    }
    // Only inject if it looks interactive (has cursor-pointer or similar)
    if (/cursor-pointer|button|btn/i.test(attrs)) {
      return `<a ${attrs} onClick={(e) => handleInteract(e, 'link')}>`;
    }
    return match;
  });

  // Inputs (text inputs, not buttons)
  jsx = jsx.replace(/<input\s+([^>]*?)>/gi, (match, attrs) => {
    if (/type=["'](button|submit|reset)["']/i.test(attrs)) {
      // Button-type inputs
      if (!/onClick=/i.test(attrs)) {
        return `<input ${attrs} onClick={(e) => handleInteract(e, 'btn')} />`;
      }
      return match;
    }
    // Text inputs
    if (/onChange=/i.test(attrs)) {
      return match;
    }
    return `<input ${attrs} value={inputValue} onChange={(e) => setInputValue(e.target.value)} />`;
  });

  // Tabs/Nav items (heuristic: look for nav structure or tab-like classes)
  jsx = jsx.replace(/<(div|span|li)\s+([^>]*?)>/gi, (match, tag, attrs) => {
    // Check if it looks like a tab/nav item
    const isTabLike = /tab|nav|menu-item|active|selected/i.test(attrs) || 
                      /cursor-pointer.*(首页|工作台|我的|home|dashboard|profile)/i.test(attrs);
    
    if (isTabLike && !/onClick=/i.test(attrs)) {
      return `<${tag} ${attrs} onClick={(e) => handleInteract(e, 'tab')}>`;
    }
    return match;
  });

  return {
    jsx: jsx.trim(),
    configString,
  };
}

