'use client';

import * as React from 'react';
import { cn } from './cn';

/** PC 端侧边栏容器 */
export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(
  ({ className, children, ...props }, ref) => (
    <aside
      ref={ref}
      className={cn('w-56 shrink-0 border-r border-gray-100 bg-gray-50/50 py-4', className)}
      {...props}
    >
      {children}
    </aside>
  )
);
Sidebar.displayName = 'Sidebar';

export interface SidebarItemProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean;
}

const SidebarItem = React.forwardRef<HTMLDivElement, SidebarItemProps>(
  ({ className, active, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'px-4 py-2 text-sm transition-colors',
        active ? 'bg-cyan-500/10 text-cyan-700 font-medium' : 'text-gray-600 hover:bg-gray-100',
        className
      )}
      {...props}
    />
  )
);
SidebarItem.displayName = 'SidebarItem';

export { Sidebar, SidebarItem };
