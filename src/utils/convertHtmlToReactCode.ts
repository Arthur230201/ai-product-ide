/**
 * Convert HTML to React Code
 * 
 * Simple regex-based conversion to wrap HTML in a React component
 */

export function convertHtmlToReactCode(rawHtml: string): string {
  if (!rawHtml || rawHtml.trim().length === 0) {
    return `const App = () => { return <div>Empty content</div>; };`;
  }

  let html = rawHtml.trim();

  // 1. Remove DOCTYPE, html, head, body tags
  html = html.replace(/<!DOCTYPE[^>]*>/gi, '');
  html = html.replace(/<html[^>]*>/gi, '');
  html = html.replace(/<\/html>/gi, '');
  html = html.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');
  
  // Extract body content if present
  if (html.includes('<body')) {
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch && bodyMatch[1]) {
      html = bodyMatch[1].trim();
    }
  }

  // 2. Remove script and style tags
  html = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  html = html.replace(/<style[\s\S]*?<\/style>/gi, '');

  // 3. Convert class= to className=
  html = html.replace(/class="/g, 'className="');
  html = html.replace(/class='/g, "className='");

  // 4. Close void tags
  const voidTags = ['input', 'img', 'br', 'hr', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'];
  voidTags.forEach(tag => {
    const regex = new RegExp(`<${tag}([^>]*?)(?<!/)>`, 'gi');
    html = html.replace(regex, (match, attributes) => {
      if (match.endsWith('/>')) {
        return match;
      }
      return `<${tag}${attributes} />`;
    });
  });

  // 5. Remove HTML comments
  html = html.replace(/<!--[\s\S]*?-->/g, '');

  // 6. Remove onclick handlers (we'll inject React handlers)
  html = html.replace(/onclick="[^"]*"/gi, '');
  html = html.replace(/onclick='[^']*'/gi, '');

  // 7. Wrap in React component
  const reactCode = `
const App = () => {
  const [activeTab, setActiveTab] = React.useState('首页');
  const [inputValue, setInputValue] = React.useState('');
  
  const handleInteract = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    const text = e.target?.innerText || e.target?.textContent || '';
    console.log('Interaction:', type, text);
    if (type === 'tab') setActiveTab(text);
    if (type === 'btn') alert(\`【交互演示】功能已触发: \${text}\`);
  };

  return (
    <div className="relative w-full h-full bg-white overflow-hidden">
      ${html}
    </div>
  );
};
`;

  return reactCode;
}



