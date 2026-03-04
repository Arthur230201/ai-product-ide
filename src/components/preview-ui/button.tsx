'use client';

import * as React from 'react';
import { cn } from './cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30 disabled:pointer-events-none disabled:opacity-50',
          variant === 'default' && 'bg-cyan-500 text-white shadow-md hover:bg-cyan-600 hover:shadow-lg',
          variant === 'outline' && 'border border-gray-200 bg-white text-gray-900 hover:bg-gray-50',
          variant === 'secondary' && 'bg-gray-100 text-gray-900 hover:bg-gray-200',
          variant === 'ghost' && 'text-gray-700 hover:bg-gray-100',
          variant === 'link' && 'text-cyan-600 underline-offset-4 hover:underline',
          size === 'default' && 'h-10 px-4 py-2',
          size === 'sm' && 'h-8 rounded-md px-3 text-xs',
          size === 'lg' && 'h-11 rounded-xl px-6 text-base',
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
