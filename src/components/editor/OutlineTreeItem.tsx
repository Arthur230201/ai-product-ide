'use client';

import React, { useState } from 'react';
import { ChevronRight, ChevronDown, FileText, Server } from 'lucide-react';
import type { TreeNode } from '@/lib/treeUtils';

interface OutlineTreeItemProps {
  node: TreeNode;
  depth?: number;
  onSelect: (nodeId: string) => void;
  selectedNodeId?: string | null;
}

export function OutlineTreeItem({ 
  node, 
  depth = 0, 
  onSelect,
  selectedNodeId 
}: OutlineTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = node.id === selectedNodeId;
  const Icon = node.type === 'page' ? FileText : Server;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(node.id);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div>
      {/* 当前节点行 */}
      <div
        onClick={handleClick}
        className={`
          flex items-center gap-1.5 py-1.5 px-2 text-sm transition-colors cursor-pointer
          ${isSelected 
            ? 'bg-purple-600/20 text-zinc-200' 
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
          }
        `}
        style={{ 
          paddingLeft: `${depth * 16 + 12}px`,
          borderLeft: depth > 0 ? '1px solid rgba(63, 63, 70, 0.3)' : 'none',
        }}
      >
        {/* 展开/折叠图标 */}
        <div 
          onClick={handleToggle}
          className="flex-shrink-0 w-4 h-4 flex items-center justify-center"
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-3 h-3 text-zinc-500" />
            ) : (
              <ChevronRight className="w-3 h-3 text-zinc-500" />
            )
          ) : (
            <div className="w-3 h-3" />
          )}
        </div>

        {/* 节点图标 */}
        <Icon className="w-3.5 h-3.5 flex-shrink-0 text-zinc-500" />

        {/* 节点标签 */}
        <span className="truncate flex-1">{node.data.label}</span>
      </div>

      {/* 子节点容器 */}
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <OutlineTreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              onSelect={onSelect}
              selectedNodeId={selectedNodeId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

