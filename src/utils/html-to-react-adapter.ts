/**
 * HTML to React Adapter (Generic)
 * 
 * Transforms raw HTML strings into React-compatible JSX code.
 * This is a GENERIC converter that works with ANY HTML structure,
 * not tailored to specific HTML files or designs.
 * 
 * Key Principles:
 * - Preserve all visual styling and structure
 * - Convert HTML syntax to JSX syntax
 * - Inject minimal interactivity without breaking layout
 * - No hardcoded assumptions about HTML content
 */

/**
 * Transforms raw HTML to React-compatible JSX code (Generic)
 * 
 * This function performs generic HTML-to-JSX conversion that works
 * with any HTML structure, regardless of design or content.
 * 
 * @param rawHtml - Raw HTML string to convert (any HTML structure)
 * @param nodeId - Optional node ID for component naming
 * @returns React component code string
 */
export function transformHtmlToReact(rawHtml: string, nodeId?: string): string {
  if (!rawHtml || rawHtml.trim().length === 0) {
    return '';
  }

  let transformed = rawHtml;

  // 1. Replace class=" with className=" globally
  transformed = transformed.replace(/class="/g, 'className="');
  transformed = transformed.replace(/class='/g, "className='");

  // Note: We NO LONGER replace 'fixed' with 'absolute' here.
  // The "Native Sandbox" architecture uses CSS containment (transform: translateZ(0))
  // to create a new stacking context, which naturally constrains fixed positioning
  // to the container. This is more elegant and doesn't require code modification.

  // 2. Ensure self-closing tags are properly closed
  // Common self-closing tags: input, img, br, hr, meta, link, area, base, col, embed, source, track, wbr
  const selfClosingTags = ['input', 'img', 'br', 'hr', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'];
  selfClosingTags.forEach(tag => {
    // Match opening tags that are not already self-closing
    const regex = new RegExp(`<${tag}([^>]*?)(?<!/)>`, 'gi');
    transformed = transformed.replace(regex, (match, attributes) => {
      // If it's already self-closing, return as is
      if (match.endsWith('/>')) {
        return match;
      }
      // Otherwise, make it self-closing
      return `<${tag}${attributes} />`;
    });
  });

  // 3. Strip HTML comments (<!-- ... -->)
  transformed = transformed.replace(/<!--[\s\S]*?-->/g, '');

  // 4. Convert SVG attributes (kebab-case to camelCase)
  // Common SVG attributes that need conversion
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

  // Replace SVG attributes in SVG elements
  Object.entries(svgAttributeMap).forEach(([kebab, camel]) => {
    const regex = new RegExp(`${kebab}="([^"]*)"`, 'gi');
    transformed = transformed.replace(regex, `${camel}="$1"`);
    const regexSingle = new RegExp(`${kebab}='([^']*)'`, 'gi');
    transformed = transformed.replace(regexSingle, `${camel}='$1'`);
  });

  // 5. Handle inline styles (optional - for now, we'll keep them as strings)
  // Inline styles in HTML are strings, in React they should be objects, but
  // for simplicity, we'll keep them as strings and let the browser handle them
  // This is acceptable since we're using Babel to transform the code

  // 6. Remove DOCTYPE, html, head, body tags if present (extract only body content)
  // This is useful if the user provides a full HTML document
  if (transformed.includes('<body')) {
    const bodyMatch = transformed.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch && bodyMatch[1]) {
      transformed = bodyMatch[1].trim();
    }
  }

  // 7. Remove script and style tags (they should be in head, not in component)
  transformed = transformed.replace(/<script[\s\S]*?<\/script>/gi, '');
  transformed = transformed.replace(/<style[\s\S]*?<\/style>/gi, '');

  // 8. Cleanup: Remove old onclick handlers (Simple & Robust)
  transformed = transformed.replace(/onclick="[^"]*"/gi, '');

  // 9. Inject Simple & Robust Interactions
  // 1. Class Name: .replace(/class=/g, "className=") - Already done in step 1
  // 2. Inputs: Simple onChange injection (only if not already present)
  transformed = transformed.replace(/<input\s+([^>]*?)>/gi, (match, attrs) => {
    if (/onChange=/i.test(attrs)) {
      return match; // Already has onChange, skip
    }
    return `<input ${attrs} onChange={(e)=>console.log(e.target.value)} />`;
  });
  // 3. Buttons: Simple onClick injection (only if not already present)
  transformed = transformed.replace(/<button\s+([^>]*?)>/gi, (match, attrs) => {
    if (/onClick=/i.test(attrs)) {
      return match; // Already has onClick, skip
    }
    return `<button ${attrs} onClick={()=>alert("交互演示：功能正常")}>`;
  });

  // 10. Wrap in React component (Simple, no complex state hooks)
  const safeNodeId = nodeId ? nodeId.replace(/[^a-zA-Z0-9_]/g, '_') : 'Component';
  const componentName = `App_${safeNodeId}`;

  // Check if the transformed code is already a React component
  const isAlreadyComponent = /^(const|function|export\s+(default\s+)?(const|function))\s+\w+\s*=/.test(transformed.trim());

  if (isAlreadyComponent) {
    // If it's already a component, just return it
    return transformed;
  }

  // Wrap in a simple React functional component
  const wrappedCode = `const ${componentName} = () => {
  return (
    <>
      ${transformed}
    </>
  );
};

return ${componentName};`;

  return wrappedCode;
}

/**
 * Checks if a string is HTML (vs React code)
 * 
 * @param code - Code string to check
 * @returns true if the string appears to be HTML
 */
export function isHtmlCode(code: string): boolean {
  if (!code || code.trim().length === 0) {
    return false;
  }

  const trimmed = code.trim();

  // Check for HTML-specific patterns
  const htmlPatterns = [
    /^<!DOCTYPE/i,           // DOCTYPE declaration
    /^<html/i,               // <html> tag
    /<body/i,                 // <body> tag
    /class=["']/,             // class attribute (not className)
    /<div[^>]*class=/i,       // div with class attribute
    /<span[^>]*class=/i,      // span with class attribute
    /<button[^>]*class=/i,    // button with class attribute
  ];

  // Check for React-specific patterns (if present, it's likely React, not HTML)
  const reactPatterns = [
    /^import\s+.*from/i,      // import statements
    /^export\s+(default\s+)?(const|function)/i, // export statements
    /const\s+\w+\s*=\s*\(\)\s*=>/i, // arrow function component
    /function\s+\w+\s*\(/i,  // function component
    /className=/i,            // className attribute
    /useState|useEffect/i,    // React hooks
  ];

  // If it has React patterns, it's not HTML
  if (reactPatterns.some(pattern => pattern.test(trimmed))) {
    return false;
  }

  // If it has HTML patterns, it's likely HTML
  if (htmlPatterns.some(pattern => pattern.test(trimmed))) {
    return true;
  }

  // Default: if it starts with < and doesn't look like JSX with imports/exports, assume HTML
  if (trimmed.startsWith('<') && !trimmed.includes('import') && !trimmed.includes('export')) {
    return true;
  }

  return false;
}

/**
 * Role: Frontend Restoration Engineer.
 * Task: Implement `transformHtmlToLightModeReact` to render High-Fidelity Light Mode UI.
 *
 * # 🎯 Goal
 * 1.  **Restore Custom Colors**: Ensure `tailwind.config` from HTML is applied (fixing the "generic white" look).
 * 2.  **Force Light Mode**: Strip any auto-dark-mode scripts.
 * 3.  **Preserve Structure**: Keep all custom CSS classes and Style tags.
 *
 * # 📜 Implementation
 */
export function transformHtmlToLightModeReact(rawHtml: string): string {
  if (!rawHtml || rawHtml.trim().length === 0) {
    return '';
  }

  // 1. 关键步骤：提取并注入 Tailwind 配置 (Config Hoisting)
  // 如果不执行这一步，bg-dashboard-bg-light 就会失效，变成纯白背景
  let tailwindConfigScript = '';
  const configMatch = rawHtml.match(/<script[^>]*>\s*tailwind\.config\s*=\s*(\{[\s\S]*?\});?\s*<\/script>/i);
  if (configMatch && configMatch[1]) {
    tailwindConfigScript = `
      try {
        // 覆盖全局配置，确保自定义颜色生效
        const customConfig = ${configMatch[1]};
        if (window.tailwind) {
          window.tailwind.config = {
            ...customConfig,
            darkMode: 'class', // 强制手动模式，防止随系统变黑
          };
        }
      } catch(e) { 
        console.error("Config Load Error", e); 
      }
    `;
  }

  // 2. 清洗 HTML 结构 (Body Extraction)
  // 去除 html/head/body 标签，保留内部结构
  let bodyContent = rawHtml
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .replace(/<html[^>]*>/gi, '')
    .replace(/<\/html>/gi, '')
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');
  
  // 提取 body 内容
  if (bodyContent.includes('<body')) {
    const bodyMatch = bodyContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch && bodyMatch[1]) {
      bodyContent = bodyMatch[1].trim();
    } else {
      // 如果没有匹配到完整的 body 标签，尝试移除 body 标签本身
      bodyContent = bodyContent.replace(/<body[^>]*>/i, '').replace(/<\/body>/i, '');
    }
  }

  // 3. 拦截自动变黑逻辑 (Dark Mode Blocker)
  // code.html 底部有一段自动检测系统深色模式的脚本，必须删掉它，保证永远是亮色
  bodyContent = bodyContent.replace(
    /if\s*\(window\.matchMedia\s*&&\s*window\.matchMedia\(['"]\(prefers-color-scheme:\s*dark\)['"]\)\.matches\)\s*\{[\s\S]*?\}/g, 
    '/* Dark mode auto-switch blocked */'
  );
  
  // 移除其他可能的暗色模式检测脚本
  bodyContent = bodyContent.replace(
    /window\.matchMedia\(['"]\(prefers-color-scheme:\s*dark\)['"]\)[\s\S]*?\.matches[\s\S]*?\{[\s\S]*?\}/g,
    '/* Dark mode auto-switch blocked */'
  );

  // 4. 找回丢失的 CSS (Style Recovery)
  // 那个甜甜圈图表依赖这里的样式，必须保留
  const styleMatches = rawHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
  let styles = '';
  if (styleMatches) {
    // 提取 style 标签内的内容
    styles = styleMatches
      .map(match => {
        const contentMatch = match.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
        return contentMatch ? contentMatch[1] : '';
      })
      .filter(content => content.trim().length > 0)
      .join('\n');
  }

  // 5. React 语法转换 (JSX Conversion)
  let jsxContent = bodyContent;
  
  // 转换 class 为 className
  jsxContent = jsxContent.replace(/class="/g, 'className="');
  jsxContent = jsxContent.replace(/class='/g, "className='");
  
  // 确保自闭合标签正确
  jsxContent = jsxContent.replace(/<br>/gi, '<br />');
  jsxContent = jsxContent.replace(/<hr>/gi, '<hr />');
  
  // 处理 input 和 img 标签
  jsxContent = jsxContent.replace(/<input([^>]*)(?<!\/)>/gi, '<input$1 />');
  jsxContent = jsxContent.replace(/<img([^>]*)(?<!\/)>/gi, '<img$1 />');
  
  // 移除 HTML 注释
  jsxContent = jsxContent.replace(/<!--[\s\S]*?-->/g, '');
  
  // 移除旧的 onclick 处理器
  jsxContent = jsxContent.replace(/onclick="[^"]*"/gi, '');
  jsxContent = jsxContent.replace(/onclick='[^']*'/gi, '');

  // 6. 微交互注入 (Minimal Interaction)
  // 仅添加点击反馈，不破坏布局
  jsxContent = jsxContent.replace(
    /<button\s+className="([^"]*)"/g, 
    '<button onClick={(e) => { e.preventDefault(); console.log("Clicked"); }} className="$1 cursor-pointer active:opacity-80"'
  );
  
  // 为没有 onClick 的按钮添加交互
  jsxContent = jsxContent.replace(
    /<button\s+([^>]*?)(?<!onClick=)(?<!onClick\s*=)>/gi,
    (match, attrs) => {
      if (/onClick=/i.test(attrs)) {
        return match; // 已经有 onClick，跳过
      }
      return `<button ${attrs} onClick={(e) => { e.preventDefault(); console.log("Clicked"); }} className="cursor-pointer active:opacity-80">`;
    }
  );

  // 7. 组装组件 (Assembly)
  // 使用亮色背景容器
  const styleTag = styles 
    ? `<style dangerouslySetInnerHTML={{ __html: ${JSON.stringify(styles)} }} />`
    : '';

  const componentCode = `
    ${tailwindConfigScript ? `(() => { ${tailwindConfigScript} })();` : ''}

    const App_LightMode = () => {
      return (
        // 强制背景色为配置中的 background-light (通常是灰色) 或白色
        // h-full 确保占满模拟器高度
        <div className="relative w-full h-full min-h-[800px] bg-[#F3F4F6] text-gray-900 overflow-y-auto isolate">
          ${styleTag}
          ${jsxContent}
        </div>
      );
    };
    
    return App_LightMode;
  `;

  return componentCode;
}

