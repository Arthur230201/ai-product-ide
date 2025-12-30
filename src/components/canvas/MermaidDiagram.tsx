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
  compact?: boolean; // 紧凑模式：移除 padding 和 margin，不显示边框
}

export function MermaidDiagram({ code, definition, compact = false }: MermaidDiagramProps) {
  const ref = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);
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

  // 调试：记录 mermaid 渲染完成后的布局指标
  useEffect(() => {
    if (svg && wrapperRef.current && svgContainerRef.current) {
      // 等待 DOM 更新完成
      setTimeout(() => {
        const wrapper = wrapperRef.current;
        const svgContainer = svgContainerRef.current;
        if (wrapper && svgContainer) {
          // 查找 SVG 元素
          const svgElement = svgContainer.querySelector('svg') as SVGSVGElement;
          
          if (svgElement) {
            // 测量 SVG 的实际 bounding box 高度
            const svgBoundingHeight = svgElement.getBoundingClientRect().height;
            const svgBoundingWidth = svgElement.getBoundingClientRect().width;
            
            const firstChild = wrapper.firstElementChild as HTMLElement;
            const computedStyle = firstChild ? window.getComputedStyle(firstChild) : null;
            
            console.log('MermaidDiagram layout metrics', {
              wrapper: {
                clientHeight: wrapper.clientHeight,
                scrollHeight: wrapper.scrollHeight,
                boundingClientRectHeight: wrapper.getBoundingClientRect().height,
                boundingClientRectWidth: wrapper.getBoundingClientRect().width
              },
              svg: {
                boundingClientRectHeight: svgBoundingHeight,
                boundingClientRectWidth: svgBoundingWidth,
                viewBox: svgElement.viewBox?.baseVal?.height || 'N/A'
              },
              firstChild: firstChild ? {
                tagName: firstChild.tagName,
                computedPosition: computedStyle?.position || 'N/A'
              } : 'No first child'
            });
          }
        }
      }, 100);
    }
  }, [svg]);

  if (error) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-800 rounded text-red-400 text-xs font-mono whitespace-pre-wrap">
        {diagramCode}
      </div>
    );
  }

  return (
    <div 
      ref={wrapperRef}
      className={compact ? "flex justify-center w-full" : "my-6 p-4 bg-white/5 border border-zinc-700 rounded-lg flex justify-center overflow-x-auto overflow-y-visible"}
      style={compact ? { width: '100%', height: 'auto', minHeight: 'auto' } : { minHeight: 'auto', maxHeight: 'none' }}
    >
      <div ref={svgContainerRef} dangerouslySetInnerHTML={{ __html: svg }} style={compact ? { width: '100%', height: 'auto', display: 'inline-block' } : undefined} />
    </div>
  );
}
