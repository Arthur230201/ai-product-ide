'use client';

import * as React from 'react';
import { cn } from './cn';

/** 移动端顶部导航栏：标题居中，可选左侧返回、右侧操作 */
export interface NavBarProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  title?: React.ReactNode;
  left?: React.ReactNode;
  right?: React.ReactNode;
}

const NavBar = React.forwardRef<HTMLElement, NavBarProps>(
  ({ className, title, left, right, children, ...props }, ref) => (
    <header
      ref={ref}
      className={cn(
        'flex h-12 shrink-0 items-center justify-between border-b border-gray-100 bg-white px-4 safe-area-inset-top',
        className
      )}
      {...props}
    >
      <div className="flex w-16 justify-start">{left ?? null}</div>
      <div className="flex flex-1 justify-center font-semibold text-gray-900">{title ?? children}</div>
      <div className="flex w-16 justify-end">{right ?? null}</div>
    </header>
  )
);
NavBar.displayName = 'NavBar';

export { NavBar };
