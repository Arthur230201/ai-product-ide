'use client';

import { InfiniteCanvas } from '@/components/canvas/InfiniteCanvas';
import { ProjectToolbar } from '@/components/canvas/ProjectToolbar';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { StoreHydration } from '@/components/canvas/StoreHydration';
import { useCanvasStore } from '@/store/canvas-store';
import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

/** 是否处于 Stitch 首页（无项目）：仅进入项目后才显示工具栏与右侧对话。仅在已 hydrated 后使用，避免首帧读 store 导致白屏。 */
function useShowStitchHome() {
  const nodes = useCanvasStore((s) => s.nodes);
  return (
    nodes.length === 0 ||
    (nodes.length === 1 && nodes[0].data?.label === '首页' && nodes[0].id === 'page-1')
  );
}

/** 主内容：仅在 isHydrated 后挂载，避免首帧读取 store 抛错导致黑屏 */
function MainContent({ showSuccessMessage }: { showSuccessMessage: boolean }) {
  const showStitchHome = useShowStitchHome();
  return (
    <>
      {!showStitchHome && <ProjectToolbar />}
      <InfiniteCanvas />
      {showSuccessMessage && (
        <div
          className="fixed bottom-6 right-6 flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/90 text-zinc-300 text-sm border border-zinc-700/50 shadow-lg z-50 animate-[fadeInSlideDown_0.25s_ease-out]"
          aria-live="polite"
          role="status"
        >
          <Check className="w-4 h-4 text-cyan-400 shrink-0" aria-hidden />
          <span>已就绪</span>
        </div>
      )}
    </>
  );
}

export default function HomePageClient() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [loadStartTime] = useState(() => Date.now());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const STORAGE_KEY = 'hasSeenLoadComplete';
    const isFirstLoad = () => {
      try {
        return !sessionStorage.getItem(STORAGE_KEY);
      } catch {
        return true;
      }
    };
    const markSeen = () => {
      try {
        sessionStorage.setItem(STORAGE_KEY, '1');
      } catch {
        /* ignore */
      }
    };

    const applyDone = () => {
      setIsHydrated(true);
      if (isFirstLoad()) {
        setShowSuccessMessage(true);
        markSeen();
        setTimeout(() => setShowSuccessMessage(false), 1000);
      }
    };

    if ((window as any).__canvasStoreHydrated) {
      applyDone();
      return;
    }

    const handleHydrated = () => applyDone();
    window.addEventListener('canvas-store-hydrated', handleHydrated);

    const timeoutId = setTimeout(() => {
      applyDone();
    }, 300);

    return () => {
      window.removeEventListener('canvas-store-hydrated', handleHydrated);
      clearTimeout(timeoutId);
    };
  }, [loadStartTime]);

  return (
    <main className="fixed inset-0 w-full h-full bg-zinc-950 text-zinc-50 overflow-hidden" suppressHydrationWarning>
      <ErrorBoundary>
        <StoreHydration />
        {isHydrated ? (
          <MainContent showSuccessMessage={showSuccessMessage} />
        ) : (
          <div className="fixed inset-0 flex items-center justify-center bg-zinc-950" role="status" aria-label="加载中">
            <div className="flex flex-col items-center gap-5">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 border-2 border-zinc-800 rounded-full" aria-hidden />
                <div
                  className="absolute inset-0 border-2 border-transparent border-t-cyan-400 rounded-full animate-spin"
                  style={{ animationDuration: '0.9s' }}
                  aria-hidden
                />
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-zinc-300 text-sm font-medium">加载中</span>
                <span className="text-zinc-500 text-xs">正在初始化画布</span>
              </div>
            </div>
          </div>
        )}
      </ErrorBoundary>
    </main>
  );
}
