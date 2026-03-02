/**
 * HTML-First Preview Component
 * 
 * Core architecture:
 * - HTML is the single source of truth
 * - Renders HTML as-is in iframe sandbox
 * - Supports Preview / Edit / Beautify modes
 * - All edits translate to HTML source changes
 * 
 * MANUAL QA CHECKLIST:
 * 1. Toolbar: Verify all 4 buttons (Preview, Edit, Beautify, Export) are visible and clickable
 * 2. Beautify: Click "美化", verify loading state ("美化中..."), success toast, auto-switch to preview
 * 3. Export HTML: Click "导出" → "导出 HTML", verify file download and success toast
 * 4. Export Image: Click "导出" → "导出图片 (PNG)", verify long-page export (full height), loading toast, success toast
 * 5. Error Handling: Test beautify/export failures, verify error toasts are shown
 * 
 * EDIT MODE MVP QA CHECKLIST:
 * 1. Enter edit mode -> iframe shows with text capture enabled
 * 2. Click a title text -> overlay shows with current text
 * 3. Change text -> save -> iframe reloads with new text
 * 4. Export HTML contains new text
 * 5. Undo/redo works and persists when switching modes
 */

'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { HtmlSandbox } from './HtmlSandbox';
import { Eye, Edit2, Wand2, Download, ChevronDown, FileCode, Image as ImageIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { toast } from 'sonner';
import { buildInjectorScript } from '@/lib/ui/injector';
import { buildEditorInjector } from '@/lib/ui/editor-injector';
import { applyPatches, type HTMLPatch } from '@/lib/ui/html-patch';
import { buildCaptureScript } from '@/lib/ui/capture-injector';

export type PreviewMode = 'preview' | 'edit' | 'beautify';

interface HtmlFirstPreviewProps {
  /** Raw HTML source (single source of truth) */
  htmlSource: string;
  /** Callback when HTML source is modified */
  onSourceChange?: (newHtml: string) => void;
  /** Callback when beautify is requested */
  onBeautify?: (currentHtml: string) => Promise<string>;
  /** Initial mode */
  initialMode?: PreviewMode;
  /** Zoom level */
  zoom?: number;
  /** Custom className */
  className?: string;
  /** Page name for export file naming */
  pageName?: string;
  /** Hide internal toolbar (buttons moved to parent) */
  hideToolbar?: boolean;
}

/**
 * Main HTML-First Preview Component
 */
interface HistoryEntry {
  html: string;
  timestamp: number;
}

export const HtmlFirstPreview: React.FC<HtmlFirstPreviewProps> = ({
  htmlSource,
  onSourceChange,
  onBeautify,
  initialMode = 'preview',
  zoom = 1,
  className = '',
  pageName = 'page',
  hideToolbar = false,
}) => {
  const [mode, setMode] = useState<PreviewMode>(initialMode);
  const [isBeautifying, setIsBeautifying] = useState(false);
  const [renderValid, setRenderValid] = useState<boolean | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const sandboxRef = useRef<{ getIframe: () => HTMLIFrameElement | null } | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  
  // Undo/Redo history (only in edit mode) - minimum 10 steps
  const [history, setHistory] = useState<HistoryEntry[]>([{ html: htmlSource, timestamp: Date.now() }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const currentHtmlRef = useRef<string>(htmlSource);
  
  // Ensure history has at least 10 steps capacity
  const MAX_HISTORY_SIZE = Math.max(50, 10); // At least 10, but allow more

  // Handle mode switching (must NOT re-render iframe)
  const handleModeChange = useCallback((newMode: PreviewMode) => {
    if (newMode === mode) return;
    setMode(newMode);
  }, [mode]);

  // Handle beautify
  const handleBeautify = useCallback(async () => {
    if (!onBeautify || isBeautifying) return;
    
    setIsBeautifying(true);
    try {
      const beautifiedHtml = await onBeautify(htmlSource);
      if (onSourceChange) {
        onSourceChange(beautifiedHtml);
      }
      // Switch to preview mode after beautify
      setMode('preview');
      toast.success('美化完成', {
        description: 'UI样式已优化',
        duration: 2000,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '美化失败';
      console.error('Beautify failed:', error);
      toast.error('美化失败', {
        description: errorMessage,
        duration: 3000,
      });
    } finally {
      setIsBeautifying(false);
    }
  }, [onBeautify, onSourceChange, isBeautifying, htmlSource]);

  // Sync currentHtmlRef with htmlSource prop; reset history when htmlSource changes externally (e.g. from beautify)
  useEffect(() => {
    currentHtmlRef.current = htmlSource;
    if (htmlSource !== history[historyIndex]?.html) {
      setHistory([{ html: htmlSource, timestamp: Date.now() }]);
      setHistoryIndex(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: do not add history (we reset it here)
  }, [htmlSource, historyIndex]);

  // Handle edit patch from iframe
  const handleEditPatch = useCallback((patch: HTMLPatch) => {
    const currentHtml = currentHtmlRef.current;
    
    // Apply patch to HTML
    const updatedHtml = applyPatches(currentHtml, [patch]);
    
    // Push current state to history (before update)
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ html: updatedHtml, timestamp: Date.now() });
    
    // Limit history size (keep last MAX_HISTORY_SIZE entries, at least 10)
    if (newHistory.length > MAX_HISTORY_SIZE) {
      newHistory.shift();
      setHistoryIndex(MAX_HISTORY_SIZE - 1);
    } else {
      setHistoryIndex(newHistory.length - 1);
    }
    
    setHistory(newHistory);
    currentHtmlRef.current = updatedHtml;
    
    // Update source of truth
    if (onSourceChange) {
      onSourceChange(updatedHtml);
    }
    
    // Reload iframe with updated HTML (stay in edit mode)
    // The iframe will be reloaded when htmlSource prop changes
  }, [history, historyIndex, onSourceChange, MAX_HISTORY_SIZE]);

  // Handle edit commit (rewrite HTML source and update history)
  const handleEditCommit = useCallback((updatedHtml: string) => {
    // Push current state to history (before update)
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ html: updatedHtml, timestamp: Date.now() });
    
    // Limit history size (keep last MAX_HISTORY_SIZE entries)
    if (newHistory.length > MAX_HISTORY_SIZE) {
      newHistory.shift();
      setHistoryIndex(MAX_HISTORY_SIZE - 1);
    } else {
      setHistoryIndex(newHistory.length - 1);
    }
    
    setHistory(newHistory);
    currentHtmlRef.current = updatedHtml;
    
    // Update source of truth
    if (onSourceChange) {
      onSourceChange(updatedHtml);
    }
    
    // Stay in edit mode (don't auto-switch to preview)
  }, [history, historyIndex, onSourceChange, MAX_HISTORY_SIZE]);

  // Undo (Ctrl/Cmd+Z) - minimum 10 steps
  const handleUndo = useCallback(() => {
    if (historyIndex > 0 && mode === 'edit') {
      const prevIndex = historyIndex - 1;
      const prevHtml = history[prevIndex].html;
      setHistoryIndex(prevIndex);
      currentHtmlRef.current = prevHtml;
      if (onSourceChange) {
        onSourceChange(prevHtml);
      }
      toast.success('已撤销', { duration: 1500 });
    } else if (mode === 'edit') {
      toast.info('无法撤销', { description: '已到达历史记录开头', duration: 1500 });
    }
  }, [history, historyIndex, mode, onSourceChange]);

  // Redo (Ctrl/Cmd+Shift+Z)
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1 && mode === 'edit') {
      const nextIndex = historyIndex + 1;
      const nextHtml = history[nextIndex].html;
      setHistoryIndex(nextIndex);
      currentHtmlRef.current = nextHtml;
      if (onSourceChange) {
        onSourceChange(nextHtml);
      }
      toast.success('已重做', { duration: 1500 });
    } else if (mode === 'edit') {
      toast.info('无法重做', { description: '已到达历史记录末尾', duration: 1500 });
    }
  }, [history, historyIndex, mode, onSourceChange]);

  // Keyboard shortcuts for undo/redo (only in edit mode)
  useEffect(() => {
    if (mode !== 'edit') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl/Cmd+Z
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Redo: Ctrl/Cmd+Shift+Z
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mode, handleUndo, handleRedo]);

  // Handle iframe ready
  const handleIframeReady = useCallback(() => {
    setIsReady(true);
    setRenderValid(true); // Assume valid by default
  }, []);

  // Handle DOM events from sandbox
  const handleDomEvent = useCallback((event: { type: string; data?: unknown }) => {
    if (event.type === 'ready' || event.type === 'INJECTOR_READY' || event.type === 'EDIT_INJECTOR_READY') {
      handleIframeReady();
    } else if (event.type === 'EDIT_PATCH' && event.data) {
      const patchData = event.data as { patch?: HTMLPatch };
      if (patchData.patch && mode === 'edit') {
        handleEditPatch(patchData.patch);
      }
    }
  }, [handleIframeReady, mode, handleEditPatch]);

  // Determine if edit/beautify actions should be disabled
  const isActionDisabled = !isReady;

  // Handle export HTML
  const handleExportHTML = useCallback(() => {
    setIsExportMenuOpen(false);
    try {
      // Export current HTML source (use currentHtmlRef for latest edits)
      const currentHtml = currentHtmlRef.current;
      // Check if currentHtml is a full HTML document or fragment
      const hasDoctype = currentHtml.includes('<!DOCTYPE');
      const hasHtmlTag = currentHtml.includes('<html');
      const hasHeadTag = currentHtml.includes('<head');
      const hasBodyTag = currentHtml.includes('<body');

      let exportHtml = currentHtml;

      // If it's a fragment, wrap it in a complete HTML document
      if (!hasDoctype && !hasHtmlTag) {
        // Extract <style> blocks
        const styleMatches = currentHtml.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi);
        const styles: string[] = [];
        for (const match of styleMatches) {
          styles.push(match[0]); // Include the full <style> tag
        }

        // Extract <script> blocks (including tailwind.config)
        const scriptMatches = currentHtml.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi);
        const scripts: string[] = [];
        for (const match of scriptMatches) {
          scripts.push(match[0]); // Include the full <script> tag
        }

        // Extract body content (remove <style> and <script> tags)
        let bodyContent = currentHtml;
        styles.forEach(style => {
          bodyContent = bodyContent.replace(style, '');
        });
        scripts.forEach(script => {
          bodyContent = bodyContent.replace(script, '');
        });
        bodyContent = bodyContent.trim();

        // Wrap in complete HTML document
        exportHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageName}</title>
  ${styles.join('\n')}
  ${scripts.join('\n')}
  <!-- Tailwind CDN for JIT compilation -->
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  ${bodyContent}
</body>
</html>`;
      }

      // Download directly using Blob and URL
      const blob = new Blob([exportHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${pageName}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('导出成功', {
        description: `已导出 ${pageName}.html`,
        duration: 2000,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '导出失败';
      console.error('Export HTML failed:', error);
      toast.error('导出 HTML 失败', {
        description: errorMessage,
        duration: 3000,
      });
    }
  }, [pageName]);

  // Handle export image - use iframe capture script
  const handleExportImage = useCallback(() => {
    setIsExportMenuOpen(false);
    
    if (!iframeRef.current) {
      toast.error('导出图片失败', {
        description: '预览未就绪',
        duration: 2000,
      });
      return;
    }

    const loadingToast = toast.loading('正在导出长图...', {
      description: '请稍候，正在拼接图片',
    });

    // Inject capture script into iframe
    const iframe = iframeRef.current;
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      toast.dismiss(loadingToast);
      toast.error('导出图片失败', {
        description: '无法访问 iframe 文档',
        duration: 2000,
      });
      return;
    }

    // Inject capture script
    const captureScript = iframeDoc.createElement('script');
    captureScript.textContent = buildCaptureScript({
      includeFixed: false, // Exclude fixed elements by default
      quality: 0.9,
      pixelRatio: 2,
    });
    iframeDoc.body.appendChild(captureScript);

    // Set up message listener for capture results
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from iframe
      if (event.source !== iframe.contentWindow) return;

      const message = event.data;
      
      if (message?.type === 'CAPTURE_PROGRESS') {
        const progress = message.progress as number;
        toast.loading('正在导出长图...', {
          id: loadingToast,
          description: `进度: ${progress}%`,
        });
      } else if (message?.type === 'CAPTURE_COMPLETE') {
        toast.dismiss(loadingToast);
        
        const dataUrl = message.dataUrl as string;
        const width = message.width as number;
        const height = message.height as number;
        
        // Download image
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${pageName}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success('导出成功', {
          description: `已导出 ${pageName}.png (${width}x${height}px)`,
          duration: 3000,
        });
        
        // Clean up
        window.removeEventListener('message', handleMessage);
        if (iframeDoc.body.contains(captureScript)) {
          iframeDoc.body.removeChild(captureScript);
        }
      } else if (message?.type === 'CAPTURE_ERROR') {
        toast.dismiss(loadingToast);
        const error = message.error as string;
        toast.error('导出图片失败', {
          description: error || '未知错误',
          duration: 3000,
        });
        
        // Clean up
        window.removeEventListener('message', handleMessage);
        if (iframeDoc.body.contains(captureScript)) {
          iframeDoc.body.removeChild(captureScript);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Request capture after a short delay to ensure script is loaded
    setTimeout(() => {
      const iframeWindow = iframe.contentWindow;
      if (iframeWindow) {
        iframeWindow.postMessage(
          { type: 'CAPTURE_REQUEST' },
          typeof window !== 'undefined' ? window.location.origin : '*'
        );
      }
    }, 200);
  }, [pageName]);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };

    if (isExportMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isExportMenuOpen]);

  return (
    <div className={clsx('flex flex-col h-full w-full', className)}>
      {/* Toolbar: Preview / Edit / Beautify / Export - Four buttons must always be visible */}
      {!hideToolbar && (
        <div className="h-10 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-900/30">
          {/* 实时预览文字已移除，按钮已移至 NodeDetailPanel */}
          <div className="flex items-center gap-2">
            {/* Preview Mode Button */}
          <button
            data-testid="html-preview-button"
            onClick={() => handleModeChange('preview')}
            disabled={isActionDisabled}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors',
              mode === 'preview'
                ? 'bg-cyan-500 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300',
              isActionDisabled && 'opacity-50 cursor-not-allowed'
            )}
            title="预览模式"
          >
            <Eye size={12} />
            预览
          </button>

          {/* Edit Mode Button */}
          <button
            data-testid="html-edit-button"
            onClick={() => handleModeChange('edit')}
            disabled={isActionDisabled}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors',
              mode === 'edit'
                ? 'bg-blue-500 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300',
              isActionDisabled && 'opacity-50 cursor-not-allowed'
            )}
            title="编辑模式"
          >
            <Edit2 size={12} />
            编辑
          </button>

          {/* Beautify Button */}
          <button
            data-testid="html-beautify-button"
            onClick={handleBeautify}
            disabled={isActionDisabled || isBeautifying}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors',
              isBeautifying
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : 'bg-cyan-500 hover:bg-cyan-400 text-white',
              isActionDisabled && 'opacity-50 cursor-not-allowed'
            )}
            title="美化 UI 样式"
          >
            <Wand2 size={12} />
            {isBeautifying ? '美化中...' : '美化'}
          </button>

          {/* Export Button with Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              data-testid="html-export-button"
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              disabled={isActionDisabled}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors',
                isExportMenuOpen
                  ? 'bg-blue-500 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300',
                isActionDisabled && 'opacity-50 cursor-not-allowed'
              )}
              title="导出"
            >
              <Download size={12} />
              导出
              <ChevronDown size={10} className={clsx('transition-transform', isExportMenuOpen && 'rotate-180')} />
            </button>

            {/* Export Menu */}
            {isExportMenuOpen && (
              <div className="absolute right-0 top-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-30 min-w-[160px] py-1">
                <button
                  data-testid="html-export-html"
                  onClick={handleExportHTML}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors"
                >
                  <FileCode size={14} />
                  Export HTML
                </button>
                <button
                  data-testid="html-export-png"
                  onClick={handleExportImage}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors"
                >
                  <ImageIcon size={14} />
                  Export PNG (Long)
                </button>
              </div>
            )}
          </div>
          </div>
        </div>
      )}

      {/* Preview Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {mode === 'edit' ? (
          // Edit Mode: HtmlSandbox with edit injector
          // ⚠️ 重要：使用 htmlSource prop 而不是 ref，确保响应式更新
          <div className="w-full h-full relative">
            <HtmlSandbox
              key={`edit-${htmlSource.substring(0, 50)}`} // 使用 key 强制重新渲染
              html={htmlSource}
              mode="edit"
              injectorScript={buildEditorInjector({ mode: 'edit' }) + '\n' + buildInjectorScript({})}
              heightMode="auto"
              className="w-full h-full"
              onMessage={(msg) => {
                handleDomEvent({ type: msg.type, data: msg });
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
          </div>
        ) : (
          // Preview Mode: Standard HTML rendering using HtmlSandbox
          // ⚠️ 重要：使用 htmlSource prop 而不是 ref，确保响应式更新
          <div className="w-full h-full relative">
            <HtmlSandbox
              key={`preview-${htmlSource.substring(0, 50)}`} // 使用 key 强制重新渲染
              html={htmlSource}
              mode="preview"
              injectorScript={buildInjectorScript({})}
              heightMode="auto"
              className="w-full h-full"
              onMessage={(msg) => {
                handleDomEvent({ type: msg.type, data: msg });
                // Handle navigation events
                if (msg.type === 'NAV') {
                  console.log('[HtmlFirstPreview] Navigation event:', msg.to);
                  // Navigation can be handled by parent component if needed
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
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Self-check for Edit Mode MVP
 * Returns PASS/FAIL with reason
 */
export function selfCheckEditMvp(): { pass: boolean; reason: string } {
  // Check if required utilities are available
  try {
    const patchCheck = require('@/utils/html-text-patch').selfCheckEditMvp();
    if (!patchCheck.pass) {
      return { pass: false, reason: `HTML text patch check failed: ${patchCheck.reason}` };
    }
  } catch (error) {
    return { pass: false, reason: `Failed to load html-text-patch: ${error instanceof Error ? error.message : String(error)}` };
  }

  // Check if message protocol is available
  try {
    const protocolCheck = require('@/utils/edit-message-protocol');
    if (!protocolCheck.validateIframeMessage || !protocolCheck.validateHostMessage) {
      return { pass: false, reason: 'Message protocol validation functions not found' };
    }
  } catch (error) {
    return { pass: false, reason: `Failed to load edit-message-protocol: ${error instanceof Error ? error.message : String(error)}` };
  }

  // Check if text capture injector is available
  try {
    const injectorCheck = require('@/utils/edit-text-capture-injector');
    if (!injectorCheck.injectTextCaptureScript) {
      return { pass: false, reason: 'Text capture injector not found' };
    }
  } catch (error) {
    return { pass: false, reason: `Failed to load edit-text-capture-injector: ${error instanceof Error ? error.message : String(error)}` };
  }

  return { pass: true, reason: 'All checks passed' };
}

