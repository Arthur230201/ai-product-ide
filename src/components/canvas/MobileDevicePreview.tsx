'use client';

import { LivePreview } from './LivePreview';
import { useCanvasStore } from '@/store/canvas-store';
import { useMemo } from 'react';

interface MobileDevicePreviewProps {
  imageUrl?: string;
  zoom?: number;
  width?: number;
  height?: number;
}

export function MobileDevicePreview({ 
  imageUrl, 
  zoom = 1, 
  width = 375, 
  height = 812 
}: MobileDevicePreviewProps) {
  const selectedNodeId = useCanvasStore((state) => state.selectedNodeId);
  const nodes = useCanvasStore((state) => state.nodes);
  
  const selectedNode = useMemo(() => {
    return selectedNodeId 
      ? nodes.find(n => n.id === selectedNodeId)
      : null;
  }, [selectedNodeId, nodes]);
  
  const code = useMemo(() => {
    return selectedNode?.data?.artifacts?.view?.code || '';
  }, [selectedNode]);

  return (
    <div 
      className="relative mx-auto transition-transform duration-200 ease-out"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        transform: `scale(${zoom})`,
        transformOrigin: 'top center',
      }}
    >
      {/* 手机外框 - 简单样式 */}
      <div className="relative w-full h-full border-[12px] border-gray-900 rounded-[45px] shadow-2xl overflow-hidden bg-gray-900">
        {/* 内屏包装器 */}
        <div 
          className="bg-white w-full h-full rounded-[32px] overflow-hidden relative flex flex-col"
          style={{
            margin: '3px',
            width: 'calc(100% - 6px)',
            height: 'calc(100% - 6px)',
          }}
        >
        {/* 屏幕内容区域 */}
          <div className="w-full h-full overflow-hidden relative">
          {code ? (
              <div className="w-full h-full overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-zinc-300 scrollbar-track-transparent">
              <div className="w-full min-h-full max-w-full break-words">
                <LivePreview code={code} zoom={1} />
              </div>
            </div>
          ) : imageUrl ? (
            <img 
              src={imageUrl} 
              alt="Preview" 
              className="w-full h-full object-contain"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 text-gray-400">
              <div className="text-4xl mb-3 opacity-50">📱</div>
              <p className="text-sm font-medium">暂无预览</p>
              <p className="text-xs mt-1 opacity-60">生成 UI 代码后将显示在这里</p>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

