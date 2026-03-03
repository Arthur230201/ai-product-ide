'use client';

import * as React from 'react';
import { cn } from './cn';

/** PC 端顶部栏：支持 title/right（生成代码常用）或 children */
export interface AppBarProps extends React.HTMLAttributes<HTMLElement> {
  /** 主标题，与 right 同时使用时渲染在左侧 */
  title?: React.ReactNode;
  /** 副标题，可选 */
  subtitle?: React.ReactNode;
  /** 右侧操作区（按钮等），与 title 同时使用时渲染在右侧 */
  right?: React.ReactNode;
  /** 无 title/right 时使用 children 作为整栏内容 */
  children?: React.ReactNode;
}

const AppBar = React.forwardRef<HTMLElement, AppBarProps>(
  ({ className, title, subtitle, right, children, ...props }, ref) => {
    const useSlots = title != null || right != null;
    return (
      <header
        ref={ref}
        className={cn(
          'flex h-14 shrink-0 items-center justify-between border-b border-gray-100 bg-white px-6',
          className
        )}
        {...props}
      >
        {useSlots ? (
          <>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-base font-semibold text-gray-900">{title}</span>
              {subtitle != null && (
                <span className="truncate text-xs text-gray-500">{subtitle}</span>
              )}
            </div>
            {right != null && <div className="flex shrink-0 items-center gap-2">{right}</div>}
          </>
        ) : (
          children
        )}
      </header>
    );
  }
);
AppBar.displayName = 'AppBar';

export { AppBar };
