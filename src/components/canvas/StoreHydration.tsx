'use client';

import { useEffect, useState } from 'react';
import { useCanvasStore } from '@/store/canvas-store';

/**
 * Store Hydration 组件
 * 手动触发 Zustand persist store 的 hydration
 * 由于设置了 skipHydration: true，需要手动调用 rehydrate
 */
export function StoreHydration() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // 手动触发 hydration，使用 try-catch 确保不会阻塞
    const rehydrate = async () => {
      try {
        // 获取 persist 中间件的 rehydrate 方法
        const persistState = useCanvasStore.persist;
        if (persistState && typeof persistState.rehydrate === 'function') {
          await persistState.rehydrate();
        } else {
          // 如果没有 persist 方法，直接访问 store 触发初始化（仅在 getState 可用时调用，避免 null.get 报错）
          const getState = useCanvasStore?.getState;
          if (typeof getState === 'function') getState();
        }
        // 标记 hydration 完成
        setIsHydrated(true);
      } catch (error) {
        // 即使出错也标记为完成，避免阻塞页面
        console.warn('Store hydration error (non-blocking):', error);
        setIsHydrated(true);
      }
    };

    // 立即执行
    rehydrate();
  }, []);

  // 将 hydration 状态存储到全局，供其他组件使用
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      (window as any).__canvasStoreHydrated = true;
      // 触发自定义事件，通知其他组件
      window.dispatchEvent(new CustomEvent('canvas-store-hydrated'));
    }
  }, [isHydrated]);

  // 不渲染任何内容，不阻塞页面
  return null;
}