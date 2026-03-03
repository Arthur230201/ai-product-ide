'use client';

import * as React from 'react';
import { cn } from './cn';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(
        'rounded-lg border p-4 text-sm',
        variant === 'default' && 'border-gray-200 bg-gray-50 text-gray-800',
        variant === 'success' && 'border-emerald-200 bg-emerald-50 text-emerald-800',
        variant === 'warning' && 'border-amber-200 bg-amber-50 text-amber-800',
        variant === 'destructive' && 'border-red-200 bg-red-50 text-red-800',
        className
      )}
      {...props}
    />
  )
);
Alert.displayName = 'Alert';

export { Alert };
