'use client';

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

// 初始化配置：使用中性色调，符合企业级风格
mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    primaryColor: '#1e293b', // zinc-800
    primaryTextColor: '#e4e4e7', // zinc-200
    primaryBorderColor: '#52525b', // zinc-600
    lineColor: '#71717a', // zinc-500
    secondaryColor: '#0f172a', // zinc-950
    tertiaryColor: '#18181b', // zinc-900
    fontFamily: 'monospace'
  },
  securityLevel: 'loose',
});

interface MermaidDiagramProps {
  code?: string;
  definition?: string; // 向后兼容
}

export function MermaidDiagram({ code, definition }: MermaidDiagramProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(false);

  // 支持 code 和 definition 两种 prop 名称
  const diagramCode = code || definition || '';

  useEffect(() => {
    const renderDiagram = async () => {
      if (!diagramCode) return;
      try {
        // 生成唯一ID防止冲突
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, diagramCode);
        setSvg(svg);
        setError(false);
      } catch (e) {
        console.error('Mermaid render error:', e);
        setError(true); // 渲染失败时不崩溃，显示源代码
      }
    };

    renderDiagram();
  }, [diagramCode]);

  if (error) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-800 rounded text-red-400 text-xs font-mono whitespace-pre-wrap">
        {diagramCode}
      </div>
    );
  }

  return (
    <div 
      className="my-6 p-4 bg-white/5 border border-zinc-700 rounded-lg flex justify-center overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svg }} 
    />
  );
}
