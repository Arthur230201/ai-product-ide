'use client';

import * as React from 'react';
import { cn } from './cn';

export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** 居中显示的图标（如 Lucide Inbox、FileQuestion） */
  icon?: React.ReactNode;
  /** 主标题，如「暂无数据」 */
  title: React.ReactNode;
  /** 说明文案 */
  description?: React.ReactNode;
  /** 可选操作按钮 */
  action?: React.ReactNode;
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon, title, description, action, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-gray-50/50 p-8 text-center',
        className
      )}
      {...props}
    >
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          {icon}
        </div>
      )}
      <p className="text-base font-semibold text-gray-900">{title}</p>
      {description != null && (
        <p className="mt-2 max-w-sm text-sm text-gray-500">{description}</p>
      )}
      {action != null && <div className="mt-5">{action}</div>}
    </div>
  )
);
EmptyState.displayName = 'EmptyState';

export { EmptyState };
