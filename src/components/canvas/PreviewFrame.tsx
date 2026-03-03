'use client';

import React, { forwardRef } from 'react';

/**
 * 预览壳：内层为滚动容器，生成根节点保持自然高度，避免被 height:100% 压扁导致只看到底部。
 * 之前对 .preview-frame__inner > * 强制 height:100% 导致整页布局被压缩、仅 footer 可见。
 */
const PREVIEW_FRAME_CSS = `
  .preview-frame { display: flex !important; flex-direction: column !important; }
  .preview-frame__inner {
    flex: 1 1 0% !important;
    min-height: 0 !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    -webkit-overflow-scrolling: touch;
  }
  .preview-frame__inner > * {
    box-sizing: border-box !important;
  }
`;

export type PreviewFrameProps = {
  children: React.ReactNode;
  /** 最小高度（px），与视口一致以便根节点获得明确高度 */
  minHeight?: number;
  className?: string;
};

export const PreviewFrame = forwardRef<HTMLDivElement, PreviewFrameProps>(
  function PreviewFrame({ children, minHeight = 812, className = '' }, ref) {
    return (
      <div
        className={`preview-frame w-full overflow-x-hidden overflow-y-auto bg-white ${className}`.trim()}
        style={{
          height: '100%',
          minHeight,
          boxSizing: 'border-box',
        }}
      >
        <style dangerouslySetInnerHTML={{ __html: PREVIEW_FRAME_CSS }} />
        <div
          ref={ref ?? undefined}
          className="preview-frame__inner w-full h-full"
          style={{ minHeight, boxSizing: 'border-box' }}
        >
          {children}
        </div>
      </div>
    );
  }
);
