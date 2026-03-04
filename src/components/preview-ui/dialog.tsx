'use client';

import * as React from 'react';
import { cn } from './cn';

/** 弹窗根：open 时渲染全屏遮罩 + 内容层，避免下层按钮透出 */
export interface DialogProps {
  open: boolean;
  onClose?: () => void;
  children: React.ReactNode;
}

const Dialog = React.forwardRef<HTMLDivElement, DialogProps>(
  ({ open, onClose, children }, ref) => {
    if (!open) return null;
    return (
      <div
        className="fixed inset-0 min-w-full min-h-full z-[2147483647] isolate"
        aria-modal
        role="dialog"
      >
        {/* 全屏不透明遮罩：完全盖住下层，点击关闭 */}
        <div
          className="absolute inset-0 min-w-full min-h-full bg-black/85 backdrop-blur-sm"
          aria-hidden
          onClick={onClose}
        />
        {/* 内容层：居中，内层 pointer-events-auto 防止点击穿透 */}
        <div
          ref={ref}
          className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none"
        >
          <div
            className={cn(
              'pointer-events-auto w-full max-w-lg max-h-[90vh] overflow-y-auto',
              'rounded-xl border border-gray-200 bg-white shadow-2xl'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </div>
        </div>
      </div>
    );
  }
);
Dialog.displayName = 'Dialog';

/** 弹窗标题区，可选与 Dialog 搭配 */
export interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const DialogHeader = React.forwardRef<HTMLDivElement, DialogHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-5 pb-2', className)}
      {...props}
    />
  )
);
DialogHeader.displayName = 'DialogHeader';

/** 弹窗内容区 */
export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-5 pt-0 text-gray-700', className)} {...props} />
  )
);
DialogContent.displayName = 'DialogContent';

/** 弹窗底部操作区 */
export interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const DialogFooter = React.forwardRef<HTMLDivElement, DialogFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex justify-end gap-2 p-5 pt-4 border-t border-gray-100', className)}
      {...props}
    />
  )
);
DialogFooter.displayName = 'DialogFooter';

export { Dialog, DialogHeader, DialogContent, DialogFooter };
