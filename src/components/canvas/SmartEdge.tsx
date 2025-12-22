'use client';

import React, { useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
} from 'reactflow';
import { X } from 'lucide-react';
import { useCanvasStore } from '@/store/canvas-store';
import { toast } from 'sonner';

export function SmartEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
}: EdgeProps) {
  const { updateEdgeLabel, deleteEdge } = useCanvasStore();
  const [isHovered, setIsHovered] = useState(false);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<string>(String(label || 'Action'));

  const handleLabelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditing) {
      setIsEditing(true);
      setEditValue(String(label || 'Action'));
    }
  };

  const handleLabelSubmit = () => {
    if (editValue.trim() !== '') {
      updateEdgeLabel(id, editValue.trim());
      toast.success('边标签已更新');
    }
    setIsEditing(false);
  };

  const handleLabelCancel = () => {
    setEditValue(String(label || 'Action'));
    setIsEditing(false);
  };

  const handleLabelKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleLabelSubmit();
    } else if (e.key === 'Escape') {
      handleLabelCancel();
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.warning('确定要删除这条边吗？', {
      description: '此操作不可撤销',
      duration: 4000,
      action: {
        label: '确认删除',
        onClick: () => {
          deleteEdge(id);
          toast.success('边已删除');
        },
      },
      cancel: {
        label: '取消',
        onClick: () => {},
      },
    });
  };

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={style}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="flex items-center gap-1">
            {isEditing ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleLabelSubmit}
                onKeyDown={handleLabelKeyDown}
                autoFocus
                className="bg-zinc-800 border border-blue-500 text-zinc-200 px-2 py-0.5 rounded text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm min-w-[60px]"
                style={{ pointerEvents: 'all', color: '#e4e4e7' }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div
                onClick={handleLabelClick}
                className="bg-zinc-800 border border-zinc-600 text-zinc-200 px-2 py-0.5 rounded text-[10px] cursor-pointer hover:bg-zinc-700 hover:border-blue-500 transition-colors shadow-sm"
                style={{ pointerEvents: 'all', color: '#e4e4e7' }}
                title="点击编辑标签"
              >
                {label || 'Action'}
              </div>
            )}
            {isHovered && (
              <button
                onClick={handleDeleteClick}
                className="bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 transition-colors shadow-sm"
                style={{ pointerEvents: 'all' }}
                title="删除边"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}



