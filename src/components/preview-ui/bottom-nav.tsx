'use client';

import * as React from 'react';
import { cn } from './cn';

/** 移动端底部导航：图标+文字，用于 3-5 个 Tab */
export interface BottomNavProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

const BottomNav = React.forwardRef<HTMLElement, BottomNavProps>(
  ({ className, children, ...props }, ref) => (
    <nav
      ref={ref}
      className={cn(
        'flex h-14 shrink-0 items-center justify-around border-t border-gray-100 bg-white safe-area-inset-bottom',
        className
      )}
      {...props}
    >
      {children}
    </nav>
  )
);
BottomNav.displayName = 'BottomNav';

export interface BottomNavItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  icon?: React.ReactNode;
  label?: React.ReactNode;
}

const BottomNavItem = React.forwardRef<HTMLButtonElement, BottomNavItemProps>(
  ({ className, active, icon, label, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        'flex flex-col items-center justify-center gap-0.5 px-4 py-2 text-xs transition-colors',
        active ? 'text-cyan-600' : 'text-gray-500',
        className
      )}
      {...props}
    >
      {icon ?? children}
      {label != null && <span>{label}</span>}
    </button>
  )
);
BottomNavItem.displayName = 'BottomNavItem';

export { BottomNav, BottomNavItem };
