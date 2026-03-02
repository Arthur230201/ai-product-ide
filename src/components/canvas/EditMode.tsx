/**
 * Edit Mode Component (MVP: Text Editing)
 * 
 * Architecture:
 * - Uses postMessage for iframe <-> host communication
 * - All edits rewrite HTML source (single source of truth)
 * - No live DOM mutations; iframe reloads after each edit
 * 
 * MANUAL QA CHECKLIST:
 * 1. Enter edit mode -> iframe shows with text capture enabled
 * 2. Click a title text -> overlay shows with current text
 * 3. Change text -> save -> iframe reloads with new text
 * 4. Export HTML contains new text
 * 5. Undo/redo works and persists when switching modes
 */

'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Check, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { HtmlSandbox, type HtmlSandboxHandle } from './HtmlSandbox';
import { injectTextCaptureScript, handleApplyTextPatch } from '@/utils/edit-text-capture-injector';
import { validateIframeMessage, isAllowedOrigin, type IframeToHostMessage } from '@/utils/edit-message-protocol';
import { applyTextPatch } from '@/utils/html-text-patch';
import { toast } from 'sonner';

interface EditModeProps {
  /** Current HTML source (single source of truth) */
  htmlSource: string;
  /** Iframe reference */
  iframeRef: React.RefObject<HTMLIFrameElement>;
  /** Callback when edit is committed (HTML source updated) */
  onCommit: (updatedHtml: string) => void;
  /** Callback when edit is cancelled */
  onCancel: () => void;
}

interface EditOverlayState {
  visible: boolean;
  x: number;
  y: number;
  selector: string;
  oldText: string;
  newText: string;
}

/**
 * Edit Mode Component (MVP: Text Editing Only)
 */
export const EditMode: React.FC<EditModeProps> = ({
  htmlSource,
  iframeRef,
  onCommit,
  onCancel,
}) => {
  const [overlay, setOverlay] = useState<EditOverlayState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cleanupTextCaptureRef = useRef<(() => void) | null>(null);
  const sandboxRef = useRef<HtmlSandboxHandle | null>(null);
  const expectedOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  // Handle messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate origin
      if (!isAllowedOrigin(event.origin, expectedOrigin)) {
        console.warn('[EditMode] Message from disallowed origin:', event.origin);
        return;
      }

      // Validate message
      const validation = validateIframeMessage(event.data);
      if (!validation.valid) {
        console.warn('[EditMode] Invalid message:', validation.error);
        return;
      }

      const message = validation.message;

      // Handle TEXT_NODE_CLICKED
      if (message.type === 'TEXT_NODE_CLICKED') {
        const iframe = iframeRef.current;
        if (!iframe) return;

        // Get iframe position relative to viewport
        const iframeRect = iframe.getBoundingClientRect();

        // Calculate overlay position (relative to iframe container)
        const overlayX = message.rect.x + iframeRect.left;
        const overlayY = message.rect.y + iframeRect.top + message.rect.height + 8; // 8px gap

        setOverlay({
          visible: true,
          x: overlayX,
          y: overlayY,
          selector: message.selector,
          oldText: message.text,
          newText: message.text,
        });
        setError(null);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [expectedOrigin, iframeRef]);

  // Inject text capture script when iframe is ready
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !htmlSource) return;

    // Wait for iframe to load
    const checkIframeReady = () => {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc || !iframeDoc.body) {
        // Retry after a short delay
        setTimeout(checkIframeReady, 100);
        return;
      }

      // Cleanup previous injection
      if (cleanupTextCaptureRef.current) {
        cleanupTextCaptureRef.current();
      }

      // Inject text capture script
      cleanupTextCaptureRef.current = injectTextCaptureScript(iframe, expectedOrigin);
    };

    // Check immediately and also on load
    checkIframeReady();
    iframe.addEventListener('load', checkIframeReady);

    return () => {
      iframe.removeEventListener('load', checkIframeReady);
      if (cleanupTextCaptureRef.current) {
        cleanupTextCaptureRef.current();
        cleanupTextCaptureRef.current = null;
      }
    };
  }, [htmlSource, iframeRef, expectedOrigin]);

  // Handle save (apply text patch to HTML source)
  const handleSave = useCallback(() => {
    if (!overlay || !iframeRef.current) return;

    const { selector, newText, oldText } = overlay;

    // Validate: text must have changed
    if (newText.trim() === oldText.trim()) {
      setOverlay(null);
      return;
    }

    // Apply text patch to HTML source
    const result = applyTextPatch(htmlSource, selector, newText);

    if (!result.ok) {
      setError(result.error);
      toast.error('编辑失败', {
        description: result.error,
        duration: 3000,
      });
      return;
    }

    // Commit updated HTML source
    onCommit(result.html);
    setOverlay(null);
    setError(null);
    toast.success('编辑已保存', {
      description: 'HTML源代码已更新',
      duration: 2000,
    });
  }, [overlay, htmlSource, iframeRef, onCommit]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    setOverlay(null);
    setError(null);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!overlay) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [overlay, handleSave, handleCancel]);

  if (!iframeRef.current) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-400">
        <div className="text-sm">等待 iframe 加载...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      {/* Render iframe in background */}
      <HtmlSandbox
        html={htmlSource}
        mode="edit"
        heightMode="auto"
        className="w-full h-full absolute inset-0"
        onMessage={(msg) => {
          // Handle messages from sandbox
          if (msg.type === 'PATCH' && msg.patch) {
            // Handle patch messages
            console.log('[EditMode] Patch received:', msg.patch);
          }
        }}
        ref={(ref) => {
          sandboxRef.current = ref;
          if (ref && ref.getIframe) {
            const iframe = ref.getIframe();
            if (iframe) {
              // Use a mutable ref pattern to update iframeRef
              (iframeRef as React.MutableRefObject<HTMLIFrameElement | null>).current = iframe;
            }
          }
        }}
      />

      {/* Edit Overlay UI (positioned relative to viewport) */}
      {overlay && (
        <div
          className="fixed z-50 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl p-4 min-w-[300px] max-w-[500px] pointer-events-auto"
          style={{
            left: `${Math.min(overlay.x, window.innerWidth - 320)}px`,
            top: `${Math.min(overlay.y, window.innerHeight - 200)}px`,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-zinc-200">编辑文本</h3>
            <button
              onClick={handleCancel}
              className="text-zinc-400 hover:text-zinc-200 transition-colors"
              title="取消 (Esc)"
            >
              <X size={16} />
            </button>
          </div>

          {error && (
            <div className="mb-3 p-2 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-xs flex items-center gap-2">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div className="mb-3">
            <label className="block text-xs text-zinc-400 mb-1.5">文本内容</label>
            <textarea
              value={overlay.newText}
              onChange={(e) => setOverlay({ ...overlay, newText: e.target.value })}
              className="w-full h-24 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 resize-none"
              placeholder="输入文本内容..."
              autoFocus
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-white px-4 py-2 rounded text-sm transition-colors"
              title="保存 (Ctrl/Cmd+Enter)"
            >
              <Check size={14} />
              保存
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded text-sm transition-colors"
              title="取消 (Esc)"
            >
              取消
            </button>
          </div>

          <div className="mt-3 pt-3 border-t border-zinc-700">
            <p className="text-xs text-zinc-500">
              提示: 按 Ctrl/Cmd+Enter 保存，Esc 取消
            </p>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!overlay && (
        <div className="absolute top-4 left-4 bg-zinc-900/90 border border-zinc-700 rounded-lg shadow-xl z-20 p-3 pointer-events-auto">
          <p className="text-xs text-zinc-300 mb-1">编辑模式已启用</p>
          <p className="text-xs text-zinc-500">点击页面中的文本元素进行编辑</p>
        </div>
      )}
    </div>
  );
};
