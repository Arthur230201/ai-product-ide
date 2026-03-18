'use client';

import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { useCanvasStore } from '@/store/canvas-store';

const FALLBACK_MS = 150;

/**
 * Store Hydration 组件
 * 手动触发 Zustand persist store 的 hydration
 * 由于设置了 skipHydration: true，需要手动调用 rehydrate
 * 带保底超时，避免 rehydrate 未完成时一直卡在加载态
 */
export function StoreHydration() {
  const [isHydrated, setIsHydrated] = useState(false);
  const doneRef = useRef(false);

  const markDone = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setIsHydrated(true);
  };

  useEffect(() => {
    // 保底：一定在 FALLBACK_MS 后标记完成，避免永远卡在「正在初始化画布」
    const fallbackId = setTimeout(markDone, FALLBACK_MS);

    const rehydrate = async () => {
      try {
        const persistState = useCanvasStore.persist;
        if (persistState && typeof persistState.rehydrate === 'function') {
          await persistState.rehydrate();
        } else {
          const getState = useCanvasStore?.getState;
          if (typeof getState === 'function') getState();
        }
        markDone();
      } catch (error) {
        console.warn('Store hydration error (non-blocking):', error);
        markDone();
      }
    };

    rehydrate();

    return () => clearTimeout(fallbackId);
  }, []);

  // 将 hydration 状态存储到全局，供其他组件使用
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      (window as any).__canvasStoreHydrated = true;
      // 触发自定义事件，通知其他组件
      window.dispatchEvent(new CustomEvent('canvas-store-hydrated'));
    }
  }, [isHydrated]);

  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return;
    const s = useCanvasStore.getState();
    if (s.designSystemLocked && s.designSystemSnapshot) {
      toast.info('已加载锁定的项目设计系统', {
        description: `当前风格：${s.designSystemSnapshot.style.name}。可在风格面板取消锁定以重新推荐。`,
        duration: 6500,
        id: 'design-system-locked-hydrated',
      });
    }
  }, [isHydrated]);

  // 不渲染任何内容，不阻塞页面
  return null;
}