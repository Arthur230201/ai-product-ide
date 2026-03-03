'use client';

import * as React from 'react';
import { cn } from './cn';

export interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** 页面主标题 */
  title: React.ReactNode;
  /** 可选描述 */
  description?: React.ReactNode;
  /** 右侧操作区（按钮组等） */
  actions?: React.ReactNode;
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ className, title, description, actions, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between', className)}
      {...props}
    >
      <div>
        <h1 className="text-xl font-semibold text-gray-900 leading-tight">{title}</h1>
        {description != null && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>
      {actions != null && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
);
PageHeader.displayName = 'PageHeader';

export { PageHeader };
