/**
 * ReactJitRenderer Component
 * 
 * JIT (Just-In-Time) Compiler for React Components
 * Strictly follows the provided architecture pattern
 */

import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { convertHtmlToReactCode } from '@/utils/convertHtmlToReactCode';

interface ReactJitRendererProps {
  rawCode?: string; // React component code (JSX string)
  rawHtml?: string; // Raw HTML string
  className?: string;
}

declare global {
  interface Window {
    Babel: {
      transform: (code: string, options: { presets: string[] }) => { code: string };
    };
    React: typeof React;
    Recharts: any;
  }
}

export const ReactJitRenderer: React.FC<ReactJitRendererProps> = ({
  rawCode,
  rawHtml,
  className = '',
}) => {
  const [error, setError] = useState<Error | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    // Clear previous content
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }
    setError(null);

    try {
      // 1. 预处理：如果用户给的是纯 HTML，先把它包装成 React 组件代码
      let codeToRun = rawCode;
      if (!codeToRun && rawHtml) {
        codeToRun = convertHtmlToReactCode(rawHtml); // 简单的正则包装
      }

      if (!codeToRun) {
        throw new Error('No code or HTML provided');
      }

      // 2. 编译：使用 Babel Standalone 将 JSX 编译为 JS
      if (!window.Babel) {
        throw new Error('Babel Standalone is not loaded. Please ensure the Babel CDN script is included in the page head.');
      }

      const output = window.Babel.transform(codeToRun, {
        presets: ['react', 'env']
      }).code;

      // 3. 构造组件：将编译后的代码转换为可执行函数
      // 注入 React, useState 等依赖，使其在函数作用域内可用
      const func = new Function(
        'React',
        'useState',
        'useEffect',
        'Recharts',
        'createRoot',
        'renderTarget',
        `
          // Make React available in scope
          const { useState, useEffect } = React;
          ${output}
          
          // Render the component
          if (typeof App !== 'undefined') {
            const root = createRoot(renderTarget);
            root.render(React.createElement(App));
          } else {
            throw new Error('App component not found in compiled code');
          }
        `
      );

      // 4. 执行挂载
      // Ensure React is available on window for the compiled code
      if (typeof window !== 'undefined' && !window.React) {
        (window as any).React = React;
      }

      func(
        window.React || React,
        React.useState,
        React.useEffect,
        window.Recharts || {},
        createRoot,
        containerRef.current
      );

      setError(null);

    } catch (err) {
      console.error("JIT Compilation Failed:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [rawCode, rawHtml]);

  // 降级策略：编译失败时，尝试直接显示静态 HTML（保底）
  if (error) {
    return (
      <div className={`border border-red-500 p-4 ${className}`}>
        <div className="text-red-500 text-sm mb-2">交互逻辑加载失败，已降级为静态视图</div>
        {rawHtml && (
          <div dangerouslySetInnerHTML={{ __html: rawHtml }} />
        )}
        {!rawHtml && (
          <div className="text-red-400 text-xs">
            {error.message}
          </div>
        )}
      </div>
    );
  }

  // Container: completely clean, only layout properties, no visual modifiers
  // This ensures all gradients, shadows, and backgrounds render at full intensity
  return (
    <div 
      ref={containerRef} 
      className={`jit-container ${className}`} 
      style={{ 
        width: '100%', 
        height: '100%',
        // CRITICAL: Only layout properties, no visual modifiers
        // This ensures all gradients, shadows, and backgrounds render at full intensity
        opacity: undefined,
        filter: undefined,
        backdropFilter: undefined,
        transform: undefined,
        backgroundColor: undefined,
        background: undefined,
      } as React.CSSProperties} 
    />
  );
};

