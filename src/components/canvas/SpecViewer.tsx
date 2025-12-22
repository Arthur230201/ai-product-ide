'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MermaidDiagram } from './MermaidDiagram';

interface SpecViewerProps {
  markdown: string;
  variant?: 'edit' | 'presentation';
}

export function SpecViewer({ markdown, variant = 'edit' }: SpecViewerProps) {
  const isPresentation = variant === 'presentation';

  return (
    <div className={`prose prose-invert max-w-none ${isPresentation ? 'prose-zinc' : ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[]}
        components={{
          table: ({ children }) => {
            if (isPresentation) {
              return (
                <div className="overflow-x-auto my-6 border-2 border-zinc-500 bg-zinc-800/30 p-1">
                  <table className="min-w-full border-collapse border border-zinc-600">
                    {children}
                  </table>
                </div>
              );
            }
            // 编辑模式：使用深色主题，与黑色背景协调
            return (
              <div className="overflow-x-auto my-6 border border-zinc-700 rounded-lg">
                <table className="min-w-full border-collapse">
                  {children}
                </table>
              </div>
            );
          },
          thead: ({ children }) => (
            <thead className={isPresentation ? "bg-zinc-700" : "bg-zinc-800/60"}>{children}</thead>
          ),
          th: ({ children }) => (
            <th className={`border ${isPresentation ? 'border-zinc-600 text-zinc-100' : 'border-zinc-700 text-zinc-200'} px-4 py-3 text-left font-bold`}>
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className={`border ${isPresentation ? 'border-zinc-600 text-zinc-300' : 'border-zinc-700 text-zinc-300'} px-4 py-3`}>
              {children}
            </td>
          ),
          tbody: ({ children }) => (
            <tbody className={isPresentation ? "bg-zinc-800/50" : "bg-zinc-900/30"}>{children}</tbody>
          ),
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-zinc-50 mb-4">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold text-zinc-100 mb-3 mt-6">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold text-zinc-200 mb-2 mt-4">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-medium text-zinc-300 mb-2 mt-3">{children}</h4>
          ),
          p: ({ children }) => (
            <p className="text-zinc-300 mb-4 leading-relaxed">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside text-zinc-300 mb-4 space-y-1">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-zinc-300">{children}</li>
          ),
          code: ({ children, className, ...props }) => {
            const isInline = !className;
            const language = className ? className.replace('language-', '') : '';
            
            // 检测 Mermaid 图表
            if (language === 'mermaid' && !isInline) {
              const mermaidCode = String(children).replace(/\n$/, '');
              return (
                <div className="my-6">
                  <MermaidDiagram code={mermaidCode} />
                </div>
              );
            }
            
            if (isInline) {
              return (
                <code className="bg-zinc-800 text-purple-400 px-1 py-0.5 rounded text-sm">
                  {children}
                </code>
              );
            }
            return (
              <code className="block bg-zinc-900 text-zinc-300 p-4 rounded-lg overflow-x-auto text-sm">
                {children}
              </code>
            );
          },
          pre: ({ children }) => {
            // ReactMarkdown 会将代码块包装在 pre > code 中
            // 如果 code 组件已经处理了 Mermaid，这里只需要正常渲染 pre
            return (
              <pre className="bg-zinc-900 p-4 rounded-lg overflow-x-auto mb-4">{children}</pre>
            );
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}

