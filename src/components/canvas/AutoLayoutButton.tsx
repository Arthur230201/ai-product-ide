'use client';

import { Network } from 'lucide-react';
import { useCanvasStore } from '@/store/canvas-store';
import { toast } from 'sonner';
import { useReactFlow } from 'reactflow';
import { useEffect, useRef } from 'react';

export function AutoLayoutButton() {
  const layoutNodes = useCanvasStore((state) => state.layoutNodes);
  const nodes = useCanvasStore((state) => state.nodes);
  const { fitView } = useReactFlow();
  const layoutTriggeredRef = useRef(false);

  // 监听节点变化，在布局后自动调整视图
  useEffect(() => {
    if (layoutTriggeredRef.current && nodes.length > 0) {
      // 延迟执行 fitView，确保节点位置已更新到 DOM
      const timer = setTimeout(() => {
        try {
          fitView({ 
            padding: 0.2, // 20% 的边距
            duration: 500, // 动画时长
            maxZoom: 1.5, // 最大缩放级别
            minZoom: 0.1, // 最小缩放级别
          });
        } catch (error) {
          console.error('fitView 失败:', error);
        }
        layoutTriggeredRef.current = false;
      }, 200); // 增加延迟时间，确保节点位置已完全更新
      return () => clearTimeout(timer);
    }
  }, [nodes, fitView]);

  const handleLayout = () => {
    if (nodes.length === 0) {
      toast.info('暂无节点需要布局');
      return;
    }

    try {
      layoutTriggeredRef.current = true;
      layoutNodes();
      toast.success('自动布局完成');
    } catch (error) {
      toast.error('布局失败: ' + (error instanceof Error ? error.message : String(error)));
      layoutTriggeredRef.current = false;
    }
  };

  return (
    <button
      onClick={handleLayout}
      className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-lg hover:shadow-xl active:scale-95"
      title="自动布局节点"
      aria-label="自动布局"
    >
      <Network className="w-4 h-4" />
      <span>自动布局</span>
    </button>
  );
}