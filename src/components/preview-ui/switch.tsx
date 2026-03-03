'use client';

import * as React from 'react';
import { cn } from './cn';

export interface SwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  children?: React.ReactNode;
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked = false, onCheckedChange, onClick, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      className={cn(
        'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30',
        checked ? 'bg-cyan-500' : 'bg-gray-200',
        className
      )}
      onClick={(e) => {
        onCheckedChange?.(!checked);
        onClick?.(e);
      }}
      {...props}
    >
      <span
        className={cn(
          'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition',
          checked ? 'translate-x-5' : 'translate-x-1'
        )}
      />
    </button>
  )
);
Switch.displayName = 'Switch';

export { Switch };
