'use client';

import * as React from 'react';
import { cn } from './cn';

const TabsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('inline-flex h-10 items-center justify-center rounded-lg bg-gray-100 p-1', className)}
      {...props}
    />
  )
);
TabsList.displayName = 'TabsList';

type TabsTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  'data-state'?: 'active' | 'inactive';
  /** 生成代码常用：是否当前激活，会映射为 data-state */
  active?: boolean;
};

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, 'data-state': dataState, active, ...props }, ref) => {
    const state =
      active !== undefined ? (active ? 'active' : 'inactive') : dataState ?? 'inactive';
    return (
      <button
        ref={ref}
        type="button"
        data-state={state}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30',
          state === 'active' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900',
          className
        )}
        {...props}
      />
    );
  }
);
TabsTrigger.displayName = 'TabsTrigger';

type TabsContentProps = React.HTMLAttributes<HTMLDivElement> & {
  /** 生成代码常用：为 false 时不渲染，仅显示当前激活的 tab */
  active?: boolean;
};

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, active, ...props }, ref) => {
    if (active === false) return null;
    return (
      <div ref={ref} className={cn('mt-2 focus-visible:outline-none', className)} {...props} />
    );
  }
);
TabsContent.displayName = 'TabsContent';

export { TabsList, TabsTrigger, TabsContent };
