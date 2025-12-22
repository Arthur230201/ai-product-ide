'use client';

import { useEffect } from 'react';
import { useCanvasStore } from '@/store/canvas-store';

/**
 * Store Hydration 组件
 * 手动触发 Zustand persist store 的 hydration
 * 由于设置了 skipHydration: true，需要手动调用 rehydrate
 */
export function StoreHydration() {
  useEffect(() => {
    // 手动触发 hydration，使用 try-catch 确保不会阻塞
    const rehydrate = async () => {
      try {
        // 获取 persist 中间件的 rehydrate 方法
        const persistState = useCanvasStore.persist;
        if (persistState && typeof persistState.rehydrate === 'function') {
          await persistState.rehydrate();
        } else {
          // 如果没有 persist 方法，直接访问 store 触发初始化
          useCanvasStore.getState();
        }
      } catch (error) {
        // 静默处理错误，不阻塞页面渲染
        console.warn('Store hydration error (non-blocking):', error);
      }
    };

    // 立即执行，不等待
    rehydrate();
  }, []);

  // 不渲染任何内容，不阻塞页面
  return null;
}