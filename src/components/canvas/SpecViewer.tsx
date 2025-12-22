'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
            return (
              <div className="overflow-x-auto my-6">
                <table className="min-w-full border-collapse border border-zinc-600">
                  {children}
                </table>
              </div>
            );
          },
          thead: ({ children }) => (
            <thead className="bg-gray-100">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border border-gray-300 px-4 py-3 text-left text-gray-700 font-bold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-300 px-4 py-3 text-gray-300">
              {children}
            </td>
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
          code: ({ children, className }) => {
            const isInline = !className;
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
          pre: ({ children }) => (
            <pre className="bg-zinc-900 p-4 rounded-lg overflow-x-auto mb-4">{children}</pre>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}

