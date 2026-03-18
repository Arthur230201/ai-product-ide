'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

const FAILED_TO_FETCH_MSG =
  '无法连接服务器。请确保开发服务已启动（如 npm run dev），并检查网络与防火墙。';

/**
 * 全局捕获未处理的 "Failed to fetch"（如 Server Action 请求时服务未启动），
 * 避免直接弹出 Next 的 Unhandled Runtime Error，改为 toast 提示。
 */
export function GlobalFetchErrorHandler() {
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      const msg =
        event.reason?.message ?? event.reason?.error?.message ?? String(event.reason ?? '');
      const isFetchError =
        typeof msg === 'string' &&
        (msg.includes('Failed to fetch') || msg.includes('fetch') || msg.includes('NetworkError'));

      if (isFetchError) {
        event.preventDefault();
        toast.error('请求失败', {
          description: FAILED_TO_FETCH_MSG,
          duration: 8000,
        });
      }
    };

    window.addEventListener('unhandledrejection', handler);
    return () => window.removeEventListener('unhandledrejection', handler);
  }, []);

  return null;
}
