'use client';

import * as React from 'react';
import { cn } from './cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning';
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
        variant === 'default' && 'bg-cyan-500/15 text-cyan-700',
        variant === 'secondary' && 'bg-gray-100 text-gray-700',
        variant === 'outline' && 'border border-gray-200 text-gray-700',
        variant === 'success' && 'bg-emerald-500/15 text-emerald-700',
        variant === 'warning' && 'bg-amber-500/15 text-amber-700',
        className
      )}
      {...props}
    />
  )
);
Badge.displayName = 'Badge';

export { Badge };
