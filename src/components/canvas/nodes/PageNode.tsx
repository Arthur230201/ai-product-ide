'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import type { FractalNodeData } from '@/types/fractal';

export const PageNode = memo(({ data }: NodeProps<FractalNodeData>) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-zinc-900 border-2 border-blue-500 min-w-[200px]">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-blue-500" />
        <div className="font-semibold text-zinc-50">{data.label}</div>
      </div>
      <div className="mt-2 text-xs text-zinc-400">
        类型: 页面节点
      </div>
      
      {/* 输入连接点 */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-blue-500"
      />
      
      {/* 输出连接点 */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-blue-500"
      />
    </div>
  );
});

PageNode.displayName = 'PageNode';

