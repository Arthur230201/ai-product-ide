'use client';

import { useState, useMemo } from 'react';
import { useCanvasStore } from '@/store/canvas-store';
import { Search } from 'lucide-react';
import { buildTree } from '@/lib/treeUtils';
import { OutlineTreeItem } from '@/components/editor/OutlineTreeItem';
import type { TreeNode } from '@/lib/treeUtils';

export function NodeTree() {
  const nodes = useCanvasStore((state) => state.nodes);
  const edges = useCanvasStore((state) => state.edges);
  const selectedNodeId = useCanvasStore((state) => state.selectedNodeId);
  const selectNode = useCanvasStore((state) => state.selectNode);
  const openNodeDetail = useCanvasStore((state) => state.openNodeDetail);
  const [searchQuery, setSearchQuery] = useState('');

  const handleNodeClick = (nodeId: string) => {
    selectNode(nodeId);
    openNodeDetail(nodeId);
  };

  // 构建树结构
  const treeData = useMemo(() => {
    return buildTree(nodes, edges);
  }, [nodes, edges]);

  // 过滤树节点（递归过滤）
  const filterTree = (treeNodes: TreeNode[]): TreeNode[] => {
    if (!searchQuery.trim()) {
      return treeNodes;
    }

    const query = searchQuery.toLowerCase();
    const filtered: TreeNode[] = [];

    treeNodes.forEach((node) => {
      const matchesQuery = node.data.label.toLowerCase().includes(query);
      const filteredChildren = filterTree(node.children);

      if (matchesQuery || filteredChildren.length > 0) {
        filtered.push({
          ...node,
          children: filteredChildren,
        });
      }
    });

    return filtered;
  };

  const filteredTreeData = useMemo(() => {
    return filterTree(treeData);
  }, [treeData, searchQuery]);

  return (
    <div className="bg-zinc-900 border-r border-zinc-800 flex flex-col h-full overflow-hidden">
      {/* 极简头部 */}
      <div className="px-3 py-2 border-b border-zinc-800">
        <div className="text-sm font-medium text-zinc-300">{nodes.length} 个节点</div>
      </div>

      {/* 搜索框 */}
      <div className="px-2 py-2 border-b border-zinc-800">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="搜索"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-2 py-1 text-sm bg-zinc-800/50 border border-zinc-700 rounded text-zinc-300 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50"
          />
        </div>
      </div>

      {/* 节点树列表 */}
      <div className="flex-1 overflow-y-auto">
        {filteredTreeData.length === 0 ? (
          <div className="text-center text-zinc-500 text-xs mt-8 px-2">
            {searchQuery ? '无匹配结果' : '暂无节点'}
          </div>
        ) : (
          <div className="py-1">
            {filteredTreeData.map((rootNode) => (
              <OutlineTreeItem
                key={rootNode.id}
                node={rootNode}
                depth={0}
                onSelect={handleNodeClick}
                selectedNodeId={selectedNodeId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
