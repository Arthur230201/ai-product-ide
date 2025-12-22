'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Layout, Server } from 'lucide-react';
import type { FractalNodeData } from '@/types/fractal';
import { clsx } from 'clsx';

export const FractalNode = memo(
  ({ data, selected, type }: NodeProps<FractalNodeData>) => {
    // 根据节点类型选择图标
    const Icon = type === 'service' ? Server : Layout;
    
    // 来源类型显示文本
    const sourceLabel = {
      ai: 'AI',
      figma: 'Figma',
      human: 'Human',
    }[data.source.type] || data.source.type;

    // 来源类型颜色
    const sourceColor = {
      ai: 'bg-purple-500/20 text-purple-300 border-purple-500/50',
      figma: 'bg-orange-500/20 text-orange-300 border-orange-500/50',
      human: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
    }[data.source.type] || 'bg-zinc-500/20 text-zinc-300 border-zinc-500/50';

    return (
      <div
        className={clsx(
          'group w-64 rounded-lg border-2 bg-zinc-900 p-4 shadow-md transition-all cursor-pointer',
          selected
            ? 'border-blue-500 shadow-lg shadow-blue-500/30 ring-2 ring-blue-500/20 scale-105'
            : 'border-zinc-800 hover:border-zinc-700 hover:shadow-lg'
        )}
        title={selected ? '已选中 - 双击查看详情' : '单击选中，双击查看详情'}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-shrink-0">
            <Icon className="w-5 h-5 text-zinc-300" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-zinc-100 truncate">
              {data.label}
            </h3>
          </div>
        </div>

        {/* Badges and Status Row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          {/* Source Badge */}
          <span
            className={clsx(
              'px-2 py-0.5 text-xs font-medium rounded border',
              sourceColor
            )}
          >
            {sourceLabel}
          </span>

          {/* Sync Status Indicator */}
          <div className="flex items-center gap-1.5">
            <div
              className={clsx(
                'w-2 h-2 rounded-full',
                data.syncState.isSynced
                  ? 'bg-green-500'
                  : 'bg-yellow-500'
              )}
              title={
                data.syncState.isSynced
                  ? '已同步'
                  : '未同步'
              }
            />
            <span className="text-xs text-zinc-400">
              {data.syncState.isSynced ? '已同步' : '未同步'}
            </span>
          </div>
        </div>

        {/* Handles */}
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 bg-blue-500 border-2 border-zinc-900 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: -6 }}
        />
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 bg-blue-500 border-2 border-zinc-900 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ right: -6 }}
        />
      </div>
    );
  }
);

FractalNode.displayName = 'FractalNode';

