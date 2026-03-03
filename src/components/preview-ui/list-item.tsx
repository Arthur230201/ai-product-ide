'use client';

import * as React from 'react';
import { cn } from './cn';

export interface ListItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** 左侧图标或头像 */
  left?: React.ReactNode;
  /** 主标题 */
  title: React.ReactNode;
  /** 副标题或描述 */
  description?: React.ReactNode;
  /** 右侧内容（如 Badge、按钮、箭头） */
  right?: React.ReactNode;
}

const ListItem = React.forwardRef<HTMLDivElement, ListItemProps>(
  ({ className, left, title, description, right, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center gap-4 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm transition-colors hover:bg-gray-50/80',
        className
      )}
      {...props}
    >
      {left != null && <div className="shrink-0">{left}</div>}
      <div className="min-w-0 flex-1">
        <div className="font-medium text-gray-900">{title}</div>
        {description != null && (
          <div className="mt-0.5 text-sm text-gray-500">{description}</div>
        )}
        {children}
      </div>
      {right != null && <div className="shrink-0">{right}</div>}
    </div>
  )
);
ListItem.displayName = 'ListItem';

export { ListItem };
