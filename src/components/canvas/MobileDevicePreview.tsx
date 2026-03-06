'use client';

import Image from 'next/image';
import { useCallback, useMemo } from 'react';
import { LivePreview } from './LivePreview';
import { useCanvasStore } from '@/store/canvas-store';

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
  const selectNode = useCanvasStore((state) => state.selectNode);
  const openNodeDetail = useCanvasStore((state) => state.openNodeDetail);

  const selectedNode = useMemo(() => {
    return selectedNodeId
      ? nodes.find(n => n.id === selectedNodeId)
      : null;
  }, [selectedNodeId, nodes]);

  const code = useMemo(() => {
    return selectedNode?.data?.artifacts?.view?.code || '';
  }, [selectedNode]);

  /** 预览内「跳转到某页」时调用：按 id 或 label 匹配节点并打开详情 */
  const onNavigateToNode = useCallback((target: string) => {
    const idOrLabel = target.trim();
    const node = nodes.find(
      (n) => n.id === idOrLabel || (n.data?.label && String(n.data.label).trim() === idOrLabel)
    );
    if (node) {
      selectNode(node.id);
      openNodeDetail(node.id);
    }
  }, [nodes, selectNode, openNodeDetail]);

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
      {/* 移动端：手机黑边外框；桌面：PC 黑边外框（与移动端风格一致，无浏览器样式） */}
      <div 
        className={`relative w-full h-full overflow-hidden flex flex-col ${
          isDeviceFrame
            ? 'bg-transparent border-[12px] border-gray-900 rounded-[45px]'
            : 'bg-transparent border-[12px] border-gray-900 rounded-2xl'
        }`}
      >
        <div 
          className={`w-full h-full overflow-hidden relative flex flex-col bg-white ${isDeviceFrame ? 'rounded-[32px]' : 'rounded-xl'}`}
          style={{
            margin: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#ffffff',
          }}
        >
          {code ? (
              /* 有代码时不再在此层滚动，仅由 LivePreview 内 PreviewFrame 滚动，避免只看到底部 */
              <div className="w-full h-full overflow-hidden flex flex-col min-h-0">
                <LivePreview
                  code={code}
                  zoom={1}
                  viewportPreset={viewportPreset}
                  onNavigateToNode={onNavigateToNode}
                />
              </div>
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
              <div className="text-4xl mb-3 opacity-50">{isDeviceFrame ? '📱' : '🖥️'}</div>
              <p className="text-sm font-medium">暂无预览</p>
              <p className="text-xs mt-1 opacity-60">生成 UI 代码后将显示在这里</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

