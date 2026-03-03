'use client';

import * as React from 'react';
import { cn } from './cn';

/**
 * 输入框：与 Stitch / Apple HIG 一致
 * - 细而淡的边框、无阴影、圆角 8–12px
 * - 焦点时轻微环与边框色，克制不抢戏
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        'flex h-11 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-base text-gray-900 placeholder:text-gray-400',
        'transition-colors duration-150',
        'focus:outline-none focus:ring-2 focus:ring-cyan-500/15 focus:border-cyan-400',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export { Input };
