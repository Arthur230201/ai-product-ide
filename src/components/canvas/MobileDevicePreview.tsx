'use client';

import Image from 'next/image';
import { LivePreview } from './LivePreview';
import { useCanvasStore } from '@/store/canvas-store';
import { useMemo } from 'react';

type ViewportPreset = 'mobile' | 'desktop';

interface MobileDevicePreviewProps {
  imageUrl?: string;
  zoom?: number;
  width?: number;
  height?: number;
  /** 视口类型：桌面时不渲染手机外框 */
  viewportPreset?: ViewportPreset;
}

export function MobileDevicePreview({ 
  imageUrl, 
  zoom = 1, 
  width = 375, 
  height = 812,
  viewportPreset = 'mobile',
}: MobileDevicePreviewProps) {
  const isDeviceFrame = viewportPreset === 'mobile';
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
      {/* 移动端：手机外框；桌面：简单圆角卡片，无手机边框 */}
      <div 
        className={`relative w-full h-full overflow-hidden flex flex-col bg-white ${
          isDeviceFrame
            ? 'border-[12px] border-gray-900 rounded-[45px]'
            : 'rounded-xl'
        }`}
        style={{
          backgroundColor: isDeviceFrame ? 'transparent' : '#ffffff',
        }}
      >
        <div 
          className={`w-full h-full overflow-hidden relative flex flex-col bg-white ${isDeviceFrame ? 'rounded-[32px]' : 'rounded-lg'}`}
          style={{
            margin: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#ffffff',
          }}
        >
          {code ? (
              <>
              <style dangerouslySetInnerHTML={{ __html: `.preview-inner-scroll::-webkit-scrollbar { display: none; }` }} />
              <div className="preview-inner-scroll w-full h-full overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <LivePreview code={code} zoom={1} viewportPreset={viewportPreset} />
              </div>
            </>
          ) : imageUrl ? (
            <Image 
              src={imageUrl} 
              alt="Preview" 
              width={width}
              height={height}
              className="w-full h-full object-contain"
              loading="lazy"
              unoptimized
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
  );
}

