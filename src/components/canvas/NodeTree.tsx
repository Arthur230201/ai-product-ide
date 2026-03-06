'use client';

import { useState, useMemo } from 'react';
import { useCanvasStore } from '@/store/canvas-store';
import { Search, FileText, Server } from 'lucide-react';
import type { FractalNode } from '@/types/fractal';
import { clsx } from 'clsx';

export function NodeTree() {
  const nodes = useCanvasStore((state) => state.nodes);
  const selectedNodeId = useCanvasStore((state) => state.selectedNodeId);
  const selectNode = useCanvasStore((state) => state.selectNode);
  const openNodeDetail = useCanvasStore((state) => state.openNodeDetail);
  const [searchQuery, setSearchQuery] = useState('');

  const handleNodeClick = (nodeId: string) => {
    selectNode(nodeId);
    openNodeDetail(nodeId);
  };

  // 平铺列表，按搜索过滤
  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return nodes;
    const q = searchQuery.toLowerCase();
    return nodes.filter((n) => (n.data?.label ?? '').toLowerCase().includes(q));
  }, [nodes, searchQuery]);

  return (
    <div className="bg-zinc-900 flex flex-col h-full overflow-hidden">
      <div className="px-2 py-1.5 border-b border-zinc-800 shrink-0">
        <div className="text-xs font-medium text-zinc-400">{nodes.length} 个节点</div>
      </div>

      <div className="px-2 py-1.5 border-b border-zinc-800 shrink-0">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500" />
          <input
            type="text"
            placeholder="搜索"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-6 pr-2 py-1 text-xs bg-zinc-800/50 border border-zinc-700 rounded text-zinc-300 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {filteredNodes.length === 0 ? (
          <div className="text-center text-zinc-500 text-xs mt-4 px-2">
            {searchQuery ? '无匹配' : '暂无节点'}
          </div>
        ) : (
          <div className="space-y-0.5">
            {filteredNodes.map((node: FractalNode) => {
              const isSelected = node.id === selectedNodeId;
              const Icon = node.type === 'service' ? Server : FileText;
              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => handleNodeClick(node.id)}
                  className={clsx(
                    'w-full flex items-center gap-2 py-1.5 px-2 text-left text-xs transition-colors rounded',
                    isSelected
                      ? 'bg-cyan-600/20 text-cyan-200'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  )}
                >
                  <Icon className="w-3 h-3 shrink-0 text-zinc-500" />
                  <span className="truncate flex-1">{node.data?.label ?? node.id}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
