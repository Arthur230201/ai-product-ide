'use client';

import * as React from 'react';
import { cn } from './cn';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback?: string; // 1-2 chars, e.g. "张三" -> "张"
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt = '', fallback, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 text-sm font-medium text-gray-600',
        className
      )}
      {...props}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- Avatar 使用动态/外部 src，next/image 需配置 remotePatterns
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <span>{fallback ? fallback.slice(0, 1) : '?'}</span>
      )}
    </div>
  )
);
Avatar.displayName = 'Avatar';

export { Avatar };
