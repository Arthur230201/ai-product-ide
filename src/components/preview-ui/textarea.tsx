'use client';

import * as React from 'react';
import { cn } from './cn';

/**
 * 多行输入：与 Input 同套 Stitch / Apple HIG 约定（圆角、细边框、克制焦点环）
 */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[80px] w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-base text-gray-900 placeholder:text-gray-400',
        'transition-colors duration-150 resize-y',
        'focus:outline-none focus:ring-2 focus:ring-cyan-500/15 focus:border-cyan-400',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50',
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

export { Textarea };
