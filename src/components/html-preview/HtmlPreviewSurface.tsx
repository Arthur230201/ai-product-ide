/**
 * 单一展示入口：所有 HTML 预览统一经 prepareHtmlForDisplay → HtmlSandboxRenderer。
 * 保证同一份 HTML 在各入口（LivePreview / PresentationMode / HtmlFirstPreview）行为一致。
 */

'use client';

import React, { useMemo, useState } from 'react';
import { HtmlSandboxRenderer } from '@/components/canvas/HtmlSandboxRenderer';
import { prepareHtmlForDisplay } from '@/lib/html-preview/prepareHtmlForDisplay';
import { Alert } from '@/components/preview-ui';
import { ChevronDown, ChevronRight } from 'lucide-react';

export interface HtmlPreviewSurfaceProps {
  /** 原始 HTML，展示前会经 guard（prepareHtmlForDisplay） */
  rawHtml: string;
  className?: string;
  onReady?: () => void;
  /** 导航回调：data-nav / data-edge-ref 点击时调用 */
  onNav?: (target: string) => void;
  iframeRef?: React.RefObject<HTMLIFrameElement>;
}

export const HtmlPreviewSurface: React.FC<HtmlPreviewSurfaceProps> = ({
  rawHtml,
  className = '',
  onReady,
  onNav,
  iframeRef,
}) => {
  const { html, diagnostics } = useMemo(() => prepareHtmlForDisplay(rawHtml), [rawHtml]);
  const [guardOpen, setGuardOpen] = useState(false);
  const hasDiagnostics = diagnostics.warnings.length > 0 || diagnostics.errors.length > 0;

  if (!rawHtml || rawHtml.trim().length === 0) {
    return (
      <div className={`flex items-center justify-center text-slate-500 text-sm ${className}`}>
        暂无 HTML 内容
      </div>
    );
  }

  return (
    <div className={`flex flex-col w-full h-full ${className}`}>
      {hasDiagnostics && (
        <div className="flex-shrink-0 border-b border-slate-200 bg-slate-50/80">
          <button
            type="button"
            onClick={() => setGuardOpen((o) => !o)}
            className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-slate-600 hover:bg-slate-100"
          >
            {guardOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <span>HtmlGuard 诊断（{diagnostics.warnings.length + diagnostics.errors.length} 条）</span>
          </button>
          {guardOpen && (
            <div className="px-3 pb-3 space-y-2">
              {diagnostics.errors.length > 0 && (
                <Alert variant="destructive" className="py-2 text-xs">
                  <ul className="list-disc list-inside">
                    {diagnostics.errors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </Alert>
              )}
              {diagnostics.warnings.length > 0 && (
                <Alert variant="warning" className="py-2 text-xs">
                  <ul className="list-disc list-inside">
                    {diagnostics.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </Alert>
              )}
            </div>
          )}
        </div>
      )}
      <div className="flex-1 min-h-0 relative">
        <HtmlSandboxRenderer
          rawHtml={html}
          className="w-full h-full"
          onReady={onReady}
          onNav={onNav}
          iframeRef={iframeRef}
        />
      </div>
    </div>
  );
};
