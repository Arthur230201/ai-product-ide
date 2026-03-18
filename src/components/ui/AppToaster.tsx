'use client';

import { Toaster } from 'sonner';
import {
  CheckCircle2,
  XCircle,
  Info,
  AlertTriangle,
  Loader2,
  X,
} from 'lucide-react';

const ic = 'h-[18px] w-[18px] shrink-0';

/**
 * 全局 Toast：与画布 IDE 深色语言一致（毛玻璃、左侧语义色条、Lucide 图标）。
 * 替代默认 Sonner 的「系统感」样式，形成可识别的产品反馈层。
 */
export function AppToaster() {
  return (
    <Toaster
      theme="dark"
      position="bottom-right"
      expand
      visibleToasts={5}
      gap={12}
      offset={{ bottom: '1.25rem', right: '1.25rem' }}
      mobileOffset={{ bottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      closeButton
      richColors={false}
      className="app-toaster"
      icons={{
        success: <CheckCircle2 className={`${ic} text-emerald-400`} strokeWidth={2.25} aria-hidden />,
        error: <XCircle className={`${ic} text-rose-400`} strokeWidth={2.25} aria-hidden />,
        warning: <AlertTriangle className={`${ic} text-amber-400`} strokeWidth={2.25} aria-hidden />,
        info: <Info className={`${ic} text-cyan-400`} strokeWidth={2.25} aria-hidden />,
        loading: <Loader2 className={`${ic} text-cyan-400 animate-spin`} strokeWidth={2.25} aria-hidden />,
        close: (
          <X
            className="h-3.5 w-3.5 text-zinc-500 transition-colors group-hover:text-zinc-200"
            strokeWidth={2}
            aria-hidden
          />
        ),
      }}
      toastOptions={{
        duration: 4400,
        classNames: {
          toast:
            'group app-toast !relative !flex !w-[min(calc(100vw-2rem),22rem)] !rounded-2xl !border !p-4 !pl-[18px] !pr-10 !gap-3 !items-start !shadow-2xl overflow-hidden',
          title:
            '!text-[13px] !font-semibold !tracking-tight !text-zinc-50 !leading-snug !font-sans',
          description:
            '!text-[12px] !text-zinc-400 !leading-relaxed !mt-1 !font-sans !font-normal',
          content: '!gap-3',
          icon: '!mt-0.5',
          closeButton:
            '!left-auto !right-2.5 !top-2.5 !border-0 !bg-zinc-800/50 hover:!bg-zinc-700/80 !rounded-lg !w-7 !h-7 !transform-none',
          actionButton:
            '!rounded-lg !bg-cyan-500/15 !text-cyan-300 !text-xs !font-medium !px-3 !py-1.5 !mt-2 !border !border-cyan-500/20 hover:!bg-cyan-500/25',
          cancelButton:
            '!rounded-lg !text-zinc-400 !text-xs !px-2 !py-1.5 hover:!text-zinc-200',
          success: 'app-toast--success',
          error: 'app-toast--error',
          warning: 'app-toast--warning',
          info: 'app-toast--info',
          loading: 'app-toast--info',
        },
      }}
      containerAriaLabel="通知"
    />
  );
}
