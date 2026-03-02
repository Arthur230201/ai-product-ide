import React, { useMemo, useState, useEffect } from 'react';
import { transform } from 'sucrase';
import * as LucideIcons from 'lucide-react';
import * as Recharts from 'recharts';
import { UniversalHtmlRenderer } from './UniversalHtmlRenderer';
import { HtmlSandboxRenderer } from './HtmlSandboxRenderer';
import { HtmlSandbox } from './HtmlSandbox';
import { isHTMLContent } from '@/utils/html-rationalizer';
import { buildInjectorScript } from '@/lib/ui/injector';
import { preview, ensureString } from '@/lib/safe/preview';

// 安全的动态组件渲染器
export const LivePreview = ({ 
  code, 
  zoom = 1,
  isPresentationMode = false
}: { 
  code: string; 
  zoom?: number;
  isPresentationMode?: boolean;
}) => {
  // ========== 所有 Hooks 必须在组件顶层，在任何条件返回之前 ==========
  // 1. 所有 useState hooks
  const [renderedElement, setRenderedElement] = useState<React.ReactElement | null>(null);
  const [compilationError, setCompilationError] = useState<Error | null>(null);
  const [babelLoaded, setBabelLoaded] = useState(false);

  // 动态加载 Material Icons CDN
  useEffect(() => {
    // 检查是否已经加载
    const existingLinks = document.querySelectorAll('link[href*="fonts.googleapis.com/icon"]');
    if (existingLinks.length > 0) {
      return; // 已经加载，不需要重复加载
    }

    // 创建并添加 Material Icons Round 链接
    const link1 = document.createElement('link');
    link1.href = 'https://fonts.googleapis.com/icon?family=Material+Icons+Round';
    link1.rel = 'stylesheet';
    document.head.appendChild(link1);

    // 创建并添加 Material Symbols Outlined 链接
    const link2 = document.createElement('link');
    link2.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap';
    link2.rel = 'stylesheet';
    document.head.appendChild(link2);

    // 清理函数（可选，因为通常我们希望这些链接一直存在）
    return () => {
      // 不清理，让 Material Icons 在整个应用生命周期中保持加载
    };
  }, []);

  // 0. 检测是否为 HTML 代码
  const isHTMLCode = useMemo(() => {
    if (!code || code.trim().length === 0) return false;
    
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
  }, [code]);

  // 2. 检测是否为移动端 UI (必须在所有条件返回之前定义，遵守 React Hooks 规则)
  const isBlankPage = useMemo(() => {
    if (!code || code.trim().length === 0) return false;
    // 检测是否为空白页面模板（使用 BlankPage 组件）
    return code.includes('function BlankPage') || code.includes('export default function BlankPage');
  }, [code]);

  const isMobile = useMemo(() => {
    if (!code) return false;
    return code.includes('w-[375px]') || 
           code.includes('h-[812px]') || 
           code.includes('max-w-md') ||
           code.includes('NavBar') ||
           code.includes('TabBar') ||
           code.includes('金刚区');
  }, [code]);

  // 3. 所有 useEffect hooks
  // 1. 清理和编译代码
  useEffect(() => {
    if (!code || code === "// PLACEHOLDER") {
      setRenderedElement(null);
      setCompilationError(null);
      return;
    }

    // If it's HTML, use UniversalHtmlRenderer (handled in render)
    if (isHTMLCode) {
      setRenderedElement(null);
      setCompilationError(null);
      return;
    }

    // Code processing started

    try {
      // 步骤 1: 移除 Markdown 标记
      let cleaned = code.replace(/```tsx|```jsx|```javascript|```typescript|```/g, '').trim();

      // 步骤 2: 处理 export default
      // 如果代码有 export default function App()，转换为 const App = function App()
      cleaned = cleaned.replace(
        /export\s+default\s+function\s+(\w+)\s*\(/g,
        'const $1 = function $1('
      );
      // 如果代码有 export default function()，转换为 const App = function()
      cleaned = cleaned.replace(
        /export\s+default\s+function\s*\(/g,
        'const App = function('
      );
      // 如果代码有 export default const App =，转换为 const App =
      cleaned = cleaned.replace(
        /export\s+default\s+const\s+(\w+)\s*=/g,
        'const $1 ='
      );
      // 移除其他 export 语句
      cleaned = cleaned.replace(/^export\s+.*?;?\s*$/gm, '');
      cleaned = cleaned.replace(/export\s+default\s+/g, '');

      // 步骤 3: 移除 import 语句（sucrase 会处理，但我们先移除以避免问题）
      cleaned = cleaned.replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '');
      cleaned = cleaned.replace(/^import\s+.*?\{[^}]*\}\s+from\s+['"].*?['"];?\s*$/gm, '');
      cleaned = cleaned.trim();

      // 步骤 4: 提取组件名称
      let componentName = 'App';
      // 尝试多种匹配模式
      const functionMatch = cleaned.match(/(?:function|const|let|var)\s+(\w+)\s*[=\(]/);
      if (functionMatch) {
        componentName = functionMatch[1];
      } else {
        // 如果没有找到函数名，检查是否有匿名函数或箭头函数
        if (cleaned.includes('function(') || cleaned.includes('=>')) {
          componentName = 'App'; // 默认使用 App
        }
      }
      
      // Component name extracted

      // 步骤 4.5: 检测并替换不存在的图标名
      // 提取代码中使用的图标名（匹配 <IconName 或 IconName( 模式）
      const iconUsageRegex = /<(\w+)(?:\s|>)/g;
      const usedIconNames = new Set<string>();
      let match;
      while ((match = iconUsageRegex.exec(cleaned)) !== null) {
        const iconName = match[1];
        // 过滤掉明显的非图标名（HTML标签、React组件等）
        if (iconName && /^[A-Z]/.test(iconName) && 
            !['div', 'span', 'button', 'input', 'form', 'section', 'article', 'header', 'footer', 'nav', 'main', 'aside'].includes(iconName.toLowerCase()) &&
            !['React', 'App', 'Page', 'Component', 'Fragment'].includes(iconName)) {
          usedIconNames.add(iconName);
        }
      }
      
      // 检查使用的图标是否存在于 LucideIcons 中，如果不存在则替换为备用图标
      const fallbackIcon = 'FileText'; // 默认备用图标
      const iconReplacements: Array<{ from: string; to: string }> = [];
      
      usedIconNames.forEach(iconName => {
        // 检查图标是否存在（可能以函数或对象形式存在）
        const iconExists = iconName in LucideIcons && 
          (typeof (LucideIcons as any)[iconName] === 'function' || typeof (LucideIcons as any)[iconName] === 'object');
        
        if (!iconExists) {
          // 尝试找到类似的图标名
          const similarIcon = Object.keys(LucideIcons).find(key => 
            key.toLowerCase().includes(iconName.toLowerCase().replace(/square|pen|message/gi, '')) ||
            iconName.toLowerCase().replace(/square|pen/gi, '').includes(key.toLowerCase())
          );
          
          const replacementIcon = similarIcon || fallbackIcon;
          iconReplacements.push({ from: iconName, to: replacementIcon });
          console.warn(`⚠️ [LivePreview] 图标 "${iconName}" 不存在，将替换为 "${replacementIcon}"`);
        }
      });
      
      // 应用图标替换（只替换 JSX 标签中的图标名）
      if (Array.isArray(iconReplacements) && iconReplacements.length > 0) {
        iconReplacements.forEach(({ from, to }) => {
          // 只替换 JSX 标签中的图标名，使用更精确的正则表达式
          // 匹配 <IconName 或 <IconName/ 或 <IconName> 模式
          cleaned = cleaned.replace(new RegExp(`<${from}(?=\\s|>|/)`, 'g'), `<${to}`);
        });
        console.log(`✅ [LivePreview] 已替换 ${iconReplacements.length} 个不存在的图标: ${(Array.isArray(iconReplacements) ? iconReplacements : []).map((r: { from: string; to: string }) => `${r.from} → ${r.to}`).join(', ')}`);
      }

      // 步骤 5: 添加依赖声明和返回语句
      const hasReactHooksDeclaration = /(?:const|let|var)\s+\{\s*(?:useState|useEffect|useRef|useCallback)/.test(cleaned);
      const hasLucideDeclaration = /(?:const|let|var)\s+(?:Lucide|\{[^}]*Lucide[^}]*\})\s*=/.test(cleaned);

      const declarations: string[] = [];
      // 确保 React 在作用域中可用
      declarations.push('var React = React;');
      if (!hasReactHooksDeclaration) {
        declarations.push('const { useState, useEffect, useRef, useCallback, useMemo } = React;');
      }
      // 确保 LucideIcons 可以通过 Lucide 访问，并将所有图标解构到作用域
      if (!hasLucideDeclaration) {
        declarations.push('const Lucide = LucideIcons;');
        // 将所有 Lucide 图标解构到作用域，以便代码可以直接使用 Mic, Search, User 等
        // 只导出以大写字母开头的图标组件（可能是 function 或 object 类型）
        // 添加安全检查，确保 LucideIcons 存在且是对象
        if (LucideIcons && typeof LucideIcons === 'object') {
          const iconNames = Object.keys(LucideIcons).filter(key => 
            /^[A-Z]/.test(key) && 
            // Lucide 图标可能是 function 或 object（React 组件）
            (typeof (LucideIcons as any)[key] === 'function' || typeof (LucideIcons as any)[key] === 'object') &&
            // 排除一些内部使用的函数
            !['createLucideIcon', 'IconNode', 'lucide'].includes(key)
          );
          if (iconNames && Array.isArray(iconNames) && iconNames.length > 0) {
            // 过滤出有效的 JavaScript 标识符
            const validIconNames = iconNames.filter(name => {
              // 必须是有效的 JavaScript 标识符
              const isValid = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name);
              // 确保图标确实存在于 LucideIcons 中（可能是 function 或 object）
              const exists = name in LucideIcons && (
                typeof (LucideIcons as any)[name] === 'function' || 
                typeof (LucideIcons as any)[name] === 'object'
              );
              return isValid && exists;
            });
            
            // 验证关键图标是否存在
            const hasMic = validIconNames && validIconNames.includes('Mic');
            if (!hasMic) {
              console.warn('⚠️ [LivePreview] Mic 图标未找到或被过滤', {
                inIconNames: iconNames.includes('Mic'),
                inLucideIcons: 'Mic' in LucideIcons,
                validCount: validIconNames ? validIconNames.length : 0,
                totalCount: iconNames.length
              });
            }
            
            if (validIconNames && Array.isArray(validIconNames) && validIconNames.length > 0) {
              // 为每个图标创建 var 声明，使用 var 确保函数作用域提升
              const iconInitializations = validIconNames
                .map((name: string) => `var ${name} = LucideIcons.${name};`)
                .join('\n            ');
              
              // 将图标声明放在最前面
              declarations.unshift(iconInitializations);
              
              // 调试信息
              console.log(`✅ [LivePreview] 已初始化 ${validIconNames.length} 个图标${hasMic ? ' (包括 Mic)' : ' (Mic 未包含)'}`);
            } else {
              console.warn('⚠️ [LivePreview] 没有有效的图标可以初始化');
            }
          } else {
            console.warn('⚠️ [LivePreview] 未找到任何图标名称');
          }
        } else {
          console.warn('⚠️ [LivePreview] LucideIcons 未定义或不是对象', {
            type: typeof LucideIcons,
            isNull: LucideIcons === null,
            isUndefined: LucideIcons === undefined
          });
        }
      }

      // 包装代码，确保可以返回组件
      // 检查代码是否已经是函数声明格式
      const isFunctionDeclaration = /^\s*function\s+\w+\s*\(/.test(cleaned);
      const isConstFunction = /^\s*const\s+\w+\s*=\s*function/.test(cleaned);
      const isArrowFunction = /^\s*const\s+\w+\s*=\s*\(/.test(cleaned);
      
      let wrappedCode: string;
      // 注意：图标声明不在 wrappedCode 中，而是在 new Function() 的函数体开头添加
      // 这样可以确保图标变量在编译后的代码执行前就已经初始化
      const allDeclarations = declarations.join('\n');
      
      if (isFunctionDeclaration || isConstFunction || isArrowFunction) {
        // 代码已经是函数格式，直接包装返回逻辑
        wrappedCode = `
          ${cleaned}
          
          // 返回组件（优先使用 App，然后是 Page，最后是提取的组件名）
          if (typeof App !== 'undefined') {
            return App;
          } else if (typeof Page !== 'undefined') {
            return Page;
          } else if (typeof ${componentName} !== 'undefined') {
            return ${componentName};
          } else {
            throw new Error('无法找到 React 组件。代码中应包含 function App() 或 function Page() 声明。');
          }
        `;
      } else {
        // 代码可能不是函数格式，尝试包装成函数
        wrappedCode = `
          ${cleaned}
          
          // 返回组件（优先使用 App，然后是 Page，最后是提取的组件名）
          if (typeof App !== 'undefined') {
            return App;
          } else if (typeof Page !== 'undefined') {
            return Page;
          } else if (typeof ${componentName} !== 'undefined') {
            return ${componentName};
          } else {
            // 如果都没有找到，尝试将代码作为函数体执行
            throw new Error('无法找到 React 组件。请确保代码包含 function App() 或 function Page() 声明。');
          }
        `;
      }
      
      // Code wrapped successfully

      // 步骤 6: 使用 sucrase 编译 JSX 和 TypeScript
      const compiledCode = transform(wrappedCode, {
        transforms: ['jsx', 'typescript', 'imports'],
        production: true,
        jsxPragma: 'React.createElement',
        jsxFragmentPragma: 'React.Fragment',
      }).code;

      // 步骤 7: 执行编译后的代码
      // 验证依赖项是否可用
      if (!React || typeof React.createElement !== 'function') {
        throw new Error('React 未正确导入或不可用');
      }
      
      if (!LucideIcons || typeof LucideIcons !== 'object') {
        throw new Error('LucideIcons 未正确导入或不可用');
      }
      
      // 创建函数，传入依赖项
      // 使用立即执行函数（IIFE）确保所有图标在使用前都已初始化
      let ComponentFactory: Function;
      try {
        // 使用 IIFE 包装代码，确保图标变量在代码执行前就已经初始化
        ComponentFactory = new Function(
          'React',
          'LucideIcons',
          'Recharts',
          `
          // 确保依赖项可用
          if (typeof React === 'undefined' || !React) {
            throw new Error('React 未定义');
          }
          if (typeof LucideIcons === 'undefined' || !LucideIcons) {
            throw new Error('LucideIcons 未定义');
          }
          
          // 在外部作用域保存参数，避免变量提升问题
          var _React = React;
          var _LucideIcons = LucideIcons;
          var _Recharts = Recharts || {};
          
          // 使用立即执行函数确保所有变量在使用前都已初始化
          return (function() {
            // 在 IIFE 内部声明变量，从外部作用域获取
            var React = _React;
            var LucideIcons = _LucideIcons;
            var Recharts = _Recharts;
            
            // 全局保护：确保数组方法在 undefined 上不会报错
            // 为所有常用的数组方法添加安全检查
            // 添加安全检查，确保 Array.prototype 的方法存在
            var originalMap = Array.prototype && typeof Array.prototype.map === 'function' ? Array.prototype.map : function(callback, thisArg) { return []; };
            var originalFilter = Array.prototype && typeof Array.prototype.filter === 'function' ? Array.prototype.filter : function(callback, thisArg) { return []; };
            var originalForEach = Array.prototype && typeof Array.prototype.forEach === 'function' ? Array.prototype.forEach : function(callback, thisArg) { return; };
            var originalReduce = Array.prototype && typeof Array.prototype.reduce === 'function' ? Array.prototype.reduce : function(callback, initialValue) { return initialValue; };
            var originalFind = Array.prototype && typeof Array.prototype.find === 'function' ? Array.prototype.find : function(callback, thisArg) { return undefined; };
            var originalSome = Array.prototype && typeof Array.prototype.some === 'function' ? Array.prototype.some : function(callback, thisArg) { return false; };
            var originalEvery = Array.prototype && typeof Array.prototype.every === 'function' ? Array.prototype.every : function(callback, thisArg) { return true; };
            
            // 安全检查函数
            function safeArrayCheck(thisArg, methodName) {
              if (thisArg == null) {
                console.warn('⚠️ [Runtime] 尝试对 null/undefined 调用 ' + methodName + ' 方法');
                return true; // 表示需要返回默认值
              }
              return false;
            }
            
            // 只有在客户端环境且方法存在时才重写
            if (typeof window !== 'undefined' && Array.prototype) {
              // 重写 map
              if (originalMap && typeof originalMap === 'function') {
                Array.prototype.map = function(callback, thisArg) {
                  if (safeArrayCheck(this, 'map')) return [];
                  return originalMap.call(this, callback, thisArg);
                };
              }
              
              // 重写 filter
              if (originalFilter && typeof originalFilter === 'function') {
                Array.prototype.filter = function(callback, thisArg) {
                  if (safeArrayCheck(this, 'filter')) return [];
                  return originalFilter.call(this, callback, thisArg);
                };
              }
              
              // 重写 forEach
              if (originalForEach && typeof originalForEach === 'function') {
                Array.prototype.forEach = function(callback, thisArg) {
                  if (safeArrayCheck(this, 'forEach')) return;
                  return originalForEach.call(this, callback, thisArg);
                };
              }
              
              // 重写 reduce
              if (originalReduce && typeof originalReduce === 'function') {
                Array.prototype.reduce = function(callback, initialValue) {
                  if (safeArrayCheck(this, 'reduce')) return initialValue;
                  return originalReduce.call(this, callback, initialValue);
                };
              }
              
              // 重写 find
              if (originalFind && typeof originalFind === 'function') {
                Array.prototype.find = function(callback, thisArg) {
                  if (safeArrayCheck(this, 'find')) return undefined;
                  return originalFind.call(this, callback, thisArg);
                };
              }
              
              // 重写 some
              if (originalSome && typeof originalSome === 'function') {
                Array.prototype.some = function(callback, thisArg) {
                  if (safeArrayCheck(this, 'some')) return false;
                  return originalSome.call(this, callback, thisArg);
                };
              }
              
              // 重写 every
              if (originalEvery && typeof originalEvery === 'function') {
                Array.prototype.every = function(callback, thisArg) {
                  if (safeArrayCheck(this, 'every')) return true;
                  return originalEvery.call(this, callback, thisArg);
                };
              }
            }
            
            // 初始化所有图标变量和其他声明
            ${allDeclarations}
            
            // 执行编译后的代码（此时所有变量都已初始化并可用）
          ${compiledCode}
          })();
          `
        );
      } catch (factoryError) {
        console.error('❌ [LivePreview] Failed to create ComponentFactory:', factoryError);
        console.error('❌ [LivePreview] Compiled code preview:', preview(compiledCode, 1000));
        console.error('❌ [LivePreview] Declarations:', preview(allDeclarations, 500));
        throw new Error(`无法创建组件工厂函数: ${factoryError instanceof Error ? factoryError.message : String(factoryError)}`);
      }

      // 验证 ComponentFactory 是否创建成功
      if (!ComponentFactory || typeof ComponentFactory !== 'function') {
        throw new Error('ComponentFactory 创建失败，返回的不是函数');
      }

      // 调用函数获取组件
      let Component;
      try {
        // 使用直接调用而不是 .call()，避免可能的 this 绑定问题
        // 传入完整的 LucideIcons 对象，所有图标都已通过解构声明可用
        Component = ComponentFactory(React, LucideIcons || {}, Recharts || {});
      } catch (execError) {
        console.error('❌ [LivePreview] Function execution error:', execError);
        // 提供更详细的错误信息，包括代码片段
        const errorMessage = execError instanceof Error ? execError.message : String(execError);
        const codeSnippet = preview(cleaned, 200);
        throw new Error(`执行错误: ${errorMessage}\n\n代码片段:\n${codeSnippet}`);
      }

      if (!Component) {
        throw new Error('编译后的代码返回了 undefined 或 null');
      }

      if (typeof Component !== 'function') {
        console.error('❌ [LivePreview] Component is not a function:', typeof Component, Component);
        throw new Error(`编译后的代码没有返回函数，而是: ${typeof Component}`);
      }

      // 渲染组件
      try {
        const element = React.createElement(Component);
        setRenderedElement(element);
        setCompilationError(null);
      } catch (renderError) {
        console.error('❌ [LivePreview] React.createElement error:', renderError);
        throw new Error(`渲染错误: ${renderError instanceof Error ? renderError.message : String(renderError)}`);
      }
    } catch (err) {
      console.error('❌ [LivePreview] Compilation/Execution error:', err);
      console.error('❌ [LivePreview] Code that failed:', code ? preview(code, 200) : 'N/A');
      setCompilationError(err instanceof Error ? err : new Error(String(err)));
      setRenderedElement(null);
    }
  }, [code, isHTMLCode]);

  // 1.5. 如果是 HTML，使用 UniversalHtmlRenderer (需要确保 Babel 已加载)
  useEffect(() => {
    if (isHTMLCode && typeof window !== 'undefined') {
      // Check if Babel is already loaded
      if ((window as any).Babel) {
        setBabelLoaded(true);
        return;
      }
      
      // Load Babel from CDN
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@babel/standalone/babel.min.js';
      script.onload = () => {
        setBabelLoaded(true);
      };
      script.onerror = () => {
        console.error('Failed to load Babel Standalone');
      };
      document.head.appendChild(script);
      
      return () => {
        // Cleanup: remove script if component unmounts
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
    }
  }, [isHTMLCode]);
  
  // HTML-First Architecture: Render HTML as-is in sandbox, no React conversion
  if (isHTMLCode) {
    // Use HtmlSandbox for HTML-first architecture
    // This preserves all original behavior (Tailwind, styles, scroll, positioning)
    // Uses srcDoc and minimal sandbox permissions
    // Inject behavior injector script for data-* driven interactions
    const injectorScript = buildInjectorScript({});
    
    return (
      <HtmlSandbox
        html={code}
        mode="preview"
        injectorScript={injectorScript}
        heightMode={isMobile ? 'device' : 'auto'}
        className="w-full h-full"
        onMessage={(msg) => {
          // Handle navigation events from iframe
          if (msg.type === 'NAV') {
            console.log('[LivePreview] Navigation event:', msg.to);
            // Navigation is handled by PresentationMode or parent component
          }
        }}
      />
    );
  }

  // 3. 错误处理
  if (compilationError) {
    return (
      <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-lg max-h-96 overflow-auto">
        <div className="flex items-start gap-3">
          <div className="text-red-400 text-lg">⚠️</div>
          <div className="flex-1">
            <div className="text-red-400 font-semibold text-sm mb-2">编译/执行错误</div>
            <div className="text-red-300 text-xs font-mono mb-3">{compilationError.message}</div>
            {compilationError.stack && (
              <details className="mt-2">
                <summary className="cursor-pointer text-red-400 text-xs hover:text-red-300 transition-colors">
                  查看详细堆栈跟踪
                </summary>
                <pre className="mt-2 text-xs text-red-400/80 whitespace-pre-wrap font-mono bg-red-950/30 p-2 rounded border border-red-900/30">
                  {compilationError.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 4. 等待状态
  if (!code || code === "// PLACEHOLDER" || !renderedElement) {
    return (
      <div className="text-zinc-500 text-sm flex flex-col justify-center items-center h-full gap-3">
        <div className="w-8 h-8 border-2 border-zinc-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs">正在编译 UI 代码...</p>
      </div>
    );
  }

  // 5. 渲染内容
  // 重构预览布局结构：
  // - 外层包装：仅用于预览背景和框架（灰色背景、内边距、缩放变换等）
  // - 内层容器：完全干净的UI内容容器，不应用任何视觉修饰符
  //   内层容器必须没有：opacity, filter, backdrop-filter, transform, overlay, background-color
  
  if (isPresentationMode) {
    // 演示模式：设备框架由外部提供
    // 外层包装：仅用于缩放变换（如果需要）和布局约束
    // 内层容器：完全干净，不应用任何视觉修饰符（opacity, filter, backdrop-filter, transform, overlay, background-color）
    return (
      <div 
        className={`${isMobile && zoom !== 1 ? 'w-[375px] h-[812px]' : 'w-full h-full'} overflow-hidden relative`}
        style={{
          // 外层包装：仅用于缩放变换（预览框架功能）
          transform: zoom !== 1 ? `scale(${zoom})` : undefined,
          transformOrigin: zoom !== 1 ? 'top center' : undefined,
          transition: zoom !== 1 ? 'transform 0.2s ease' : undefined,
          maxWidth: isMobile && zoom !== 1 ? '375px' : '100%',
          maxHeight: isMobile && zoom !== 1 ? '812px' : '100%',
          width: isMobile && zoom !== 1 ? '375px' : '100%',
          height: isMobile && zoom !== 1 ? '812px' : '100%',
          boxSizing: 'border-box',
        } as React.CSSProperties}
      >
        {/* 内层容器：完全干净，只保留必要的布局属性，不应用任何视觉修饰符 */}
        {/* 为固定底部栏预留底部间距（通常为 80-100px） */}
        <div 
          className={`${isMobile && zoom !== 1 ? 'w-[375px] h-[812px]' : 'w-full h-full'} overflow-x-hidden`}
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            boxSizing: 'border-box',
            width: '100%',
            maxWidth: '100%',
            // 只在非空白页面时为固定底部导航栏预留底部间距
            paddingBottom: isBlankPage ? '0px' : '100px',
            // CRITICAL: 内层容器必须没有以下任何视觉修饰符，确保渐变、阴影、背景色以完整强度渲染
            opacity: undefined,
            filter: undefined,
            backdropFilter: undefined,
            transform: undefined,
            backgroundColor: undefined,
            background: undefined,
          } as React.CSSProperties}
        >
          {/* 隐藏滚动条的样式 */}
          <style dangerouslySetInnerHTML={{
            __html: `
              /* 隐藏滚动条 */
              div::-webkit-scrollbar {
                display: none;
              }
            `
          }} />
          {/* 直接渲染组件，确保原始HTML的所有视觉效果（渐变、阴影、背景色）能够以完整强度正确渲染 */}
          {/* 恢复原始HTML的滚动和固定行为：fixed bottom 元素将相对于视口定位 */}
          {renderedElement}
        </div>
      </div>
    );
  }

  // 正常模式：三层结构
  // 最外层：预览背景（灰色背景、内边距）- 仅用于视觉框架，body-level 滚动容器
  // 中层：设备容器框架（圆角、阴影、缩放变换）- 仅用于预览框架
  // 内层：完全干净的UI内容容器，不应用任何视觉修饰符
  return (
    <div 
      className="flex justify-center py-8 bg-gray-100"
      style={{
        // Body-level 滚动容器：主内容在这里滚动
        overflowY: 'auto',
        overflowX: 'hidden',
        height: '100vh',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      } as React.CSSProperties}
    >
      <style dangerouslySetInnerHTML={{
        __html: `
          /* 隐藏滚动条 */
          div::-webkit-scrollbar {
            display: none;
          }
        `
      }} />
      {/* 中层：设备容器框架（圆角、阴影、缩放变换），仅用于预览框架，不应用背景色影响内容 */}
      <div 
        className="w-[375px] min-h-[812px] rounded-[36px] overflow-hidden shadow-2xl device-container"
        style={{
          // 中层：仅用于缩放变换（预览框架功能），不滚动
          transform: zoom !== 1 ? `scale(${zoom})` : undefined,
          transformOrigin: zoom !== 1 ? 'top center' : undefined,
          transition: zoom !== 1 ? 'transform 0.2s ease' : undefined,
          // 不设置背景色，让原始HTML的背景色、渐变能够完整显示
          backgroundColor: undefined,
          // 不在这里滚动，滚动在 body-level 容器
          overflow: 'visible',
        } as React.CSSProperties}
      >
        {/* 内层容器：完全干净，只保留必要的布局属性，不应用任何视觉修饰符 */}
        {/* 为固定底部栏预留底部间距（通常为 80-100px） */}
        <div 
          className="w-full min-h-full overflow-x-hidden"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            boxSizing: 'border-box',
            // 为固定底部导航栏预留底部间距，确保内容不被遮挡
            paddingBottom: '100px',
            // CRITICAL: 内层容器必须没有以下任何视觉修饰符，确保渐变、阴影、背景色以完整强度渲染
            opacity: undefined,
            filter: undefined,
            backdropFilter: undefined,
            transform: undefined,
            backgroundColor: undefined,
            background: undefined,
          } as React.CSSProperties}
        >
          {/* 直接渲染组件，确保原始HTML的所有视觉效果（渐变、阴影、背景色）能够以完整强度正确渲染 */}
          {/* 恢复原始HTML的滚动和固定行为：fixed bottom 元素将相对于视口定位 */}
          {renderedElement}
        </div>
      </div>
    </div>
  );
};
