import React, { useMemo, useState, useEffect } from 'react';
import { transform } from 'sucrase';
import * as LucideIcons from 'lucide-react';
import * as Recharts from 'recharts';

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
  const [renderedElement, setRenderedElement] = useState<React.ReactElement | null>(null);
  const [compilationError, setCompilationError] = useState<Error | null>(null);

  // 1. 清理和编译代码
  useEffect(() => {
    if (!code || code === "// PLACEHOLDER") {
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
        const iconNames = Object.keys(LucideIcons).filter(key => 
          /^[A-Z]/.test(key) && 
          // Lucide 图标可能是 function 或 object（React 组件）
          (typeof (LucideIcons as any)[key] === 'function' || typeof (LucideIcons as any)[key] === 'object') &&
          // 排除一些内部使用的函数
          !['createLucideIcon', 'IconNode', 'lucide'].includes(key)
        );
        if (iconNames.length > 0) {
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
          const hasMic = validIconNames.includes('Mic');
          if (!hasMic) {
            console.warn('⚠️ [LivePreview] Mic 图标未找到或被过滤', {
              inIconNames: iconNames.includes('Mic'),
              inLucideIcons: 'Mic' in LucideIcons,
              validCount: validIconNames.length,
              totalCount: iconNames.length
            });
          }
          
          if (validIconNames.length > 0) {
            // 为每个图标创建 var 声明，使用 var 确保函数作用域提升
            const iconInitializations = validIconNames
              .map(name => `var ${name} = LucideIcons.${name};`)
              .join('\n            ');
            
            // 将图标声明放在最前面
            declarations.unshift(iconInitializations);
            
            // 调试信息
            console.log(`✅ [LivePreview] 已初始化 ${validIconNames.length} 个图标${hasMic ? ' (包括 Mic)' : ' (Mic 未包含)'}`);
          } else {
            console.warn('⚠️ [LivePreview] 没有有效的图标可以初始化');
          }
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
            
            // 初始化所有图标变量和其他声明
            ${allDeclarations}
            
            // 执行编译后的代码（此时所有变量都已初始化并可用）
            ${compiledCode}
          })();
          `
        );
      } catch (factoryError) {
        console.error('❌ [LivePreview] Failed to create ComponentFactory:', factoryError);
        console.error('❌ [LivePreview] Compiled code preview:', compiledCode.substring(0, 1000));
        console.error('❌ [LivePreview] Declarations:', allDeclarations.substring(0, 500));
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
        const codeSnippet = cleaned.substring(0, 200);
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
      console.error('❌ [LivePreview] Code that failed:', code?.substring(0, 200));
      setCompilationError(err instanceof Error ? err : new Error(String(err)));
      setRenderedElement(null);
    }
  }, [code]);

  // 2. 检测是否为移动端 UI
  const isMobile = useMemo(() => {
    if (!code) return false;
    return code.includes('w-[375px]') || 
           code.includes('h-[812px]') || 
           code.includes('max-w-md') ||
           code.includes('NavBar') ||
           code.includes('TabBar') ||
           code.includes('金刚区');
  }, [code]);

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
  // 注意：不添加默认背景色，让UI代码中的样式完全生效，确保还原度
  const content = (
    <div 
      className={`${isMobile && zoom !== 1 ? 'w-[375px] h-[812px]' : 'w-full h-full'} overflow-hidden relative`}
      style={{
        transform: zoom !== 1 ? `scale(${zoom})` : 'none',
        transformOrigin: 'top center',
        transition: 'transform 0.2s ease',
        maxWidth: isMobile && zoom !== 1 ? '375px' : '100%',
        maxHeight: isMobile && zoom !== 1 ? '812px' : '100%',
        width: isMobile && zoom !== 1 ? '375px' : '100%',
        height: isMobile && zoom !== 1 ? '812px' : '100%',
        boxSizing: 'border-box',
      } as React.CSSProperties}
    >
      <div 
        className={`${isMobile && zoom !== 1 ? 'w-[375px] h-[812px]' : 'w-full h-full'} overflow-x-hidden overflow-y-auto`}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          boxSizing: 'border-box',
          width: '100%',
          maxWidth: '100%',
        }}
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
        {/* 直接渲染组件，Tailwind 样式应该已经全局加载 */}
        {renderedElement}
      </div>
    </div>
  );

  // 在演示模式下，外部容器已经提供了设备框架，这里直接返回内容
  // 否则使用包装容器
  if (isPresentationMode || (isMobile && zoom === 1)) {
    // 演示模式或移动端预览模式，直接返回内容（设备框架由外部提供）
    return content;
  }

  return (
    <div className="w-full h-full flex items-start justify-center overflow-hidden">
      {content}
    </div>
  );
};
