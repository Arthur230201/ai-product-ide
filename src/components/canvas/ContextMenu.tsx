'use client';

import { FilePlus, Trash2, Clipboard } from 'lucide-react';
import { useCanvasStore } from '@/store/canvas-store';
import { toast } from 'sonner';

interface ContextMenuProps {
  x: number; // 屏幕 X 坐标（用于菜单位置）
  y: number; // 屏幕 Y 坐标（用于菜单位置）
  flowX: number; // React Flow X 坐标（用于节点位置）
  flowY: number; // React Flow Y 坐标（用于节点位置）
  onClose: () => void;
}

export function ContextMenu({ x, y, flowX, flowY, onClose }: ContextMenuProps) {
  const { addBlankNode, clearCanvas } = useCanvasStore();

  const handleAddBlankPage = () => {
    // 使用 React Flow 坐标创建节点
    addBlankNode({ x: flowX, y: flowY });
    onClose();
  };

  const handleClearCanvas = () => {
    // 使用 toast 显示确认对话框
    toast.warning('确定要清空画布吗？', {
      description: '所有节点和连接将被删除，此操作不可撤销。',
      duration: 5000,
      action: {
        label: '确认清空',
        onClick: () => {
          clearCanvas();
          toast.success('画布已清空');
          onClose();
        },
      },
      cancel: {
        label: '取消',
        onClick: () => {},
      },
    });
  };

  const handlePaste = () => {
    // TODO: 实现粘贴节点功能（需要剪贴板支持）
    toast.info('粘贴功能暂未实现', {
      description: '该功能正在开发中，敬请期待',
      duration: 3000,
    });
    onClose();
  };

  return (
    <>
      {/* 背景遮罩，点击关闭菜单 */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
      />
      
      {/* 上下文菜单 */}
      <div
        className="fixed z-50 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl py-1 min-w-[200px]"
        style={{
          left: `${x}px`,
          top: `${y}px`,
        }}
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <button
          onClick={handleAddBlankPage}
          className="w-full px-4 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-800 flex items-center gap-2 transition-colors"
        >
          <FilePlus className="w-4 h-4 text-blue-400" />
          <span>📄 新建空白页面</span>
        </button>
        
        <button
          onClick={handlePaste}
          className="w-full px-4 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-800 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled
        >
          <Clipboard className="w-4 h-4 text-zinc-500" />
          <span>📋 粘贴节点</span>
        </button>
        
        <div className="h-px bg-zinc-800 my-1" />
        
        <button
          onClick={handleClearCanvas}
          className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-zinc-800 flex items-center gap-2 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>🧹 清空画布</span>
        </button>
      </div>
    </>
  );
}

