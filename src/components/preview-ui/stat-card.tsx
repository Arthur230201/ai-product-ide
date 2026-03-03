'use client';

import * as React from 'react';
import { cn } from './cn';

export interface StatCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** 标题或指标名称 */
  title?: React.ReactNode;
  /** 主数值或短文案 */
  value?: React.ReactNode;
  /** 左侧或上方的图标（如 Lucide 图标组件） */
  icon?: React.ReactNode;
  /** 趋势或辅助说明 */
  description?: React.ReactNode;
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ className, title, value, icon, description, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border border-gray-100 bg-white p-5 shadow-md',
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          {title != null && (
            <p className="text-sm font-medium text-gray-500">{title}</p>
          )}
          {value != null && (
            <p className="mt-0.5 text-xl font-semibold text-gray-900">{value}</p>
          )}
          {description != null && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
          {children}
        </div>
      </div>
    </div>
  )
);
StatCard.displayName = 'StatCard';

export { StatCard };
