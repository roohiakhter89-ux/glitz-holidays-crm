'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className,
  children,
  title,
  description,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  title: string;
  description?: string;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className={cn(
          'fixed inset-0 z-50 bg-ink-950/80 backdrop-blur-[2px]',
          'data-[state=open]:animate-[fadeIn_160ms_ease-out]',
        )}
      />
      <DialogPrimitive.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-[min(92vw,720px)] -translate-x-1/2 -translate-y-1/2',
          'max-h-[85vh] overflow-hidden rounded-[10px] border border-ink-700 bg-ink-900',
          'shadow-[0_24px_64px_-16px_rgba(0,0,0,0.9)]',
          'data-[state=open]:animate-[popIn_180ms_cubic-bezier(0.16,1,0.3,1)]',
          className,
        )}
        {...props}
      >
        <div className="flex items-start justify-between border-b border-ink-800 px-5 py-3.5">
          <div>
            <DialogPrimitive.Title className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-200">
              {title}
            </DialogPrimitive.Title>
            {description && (
              <DialogPrimitive.Description className="mt-1 text-[12px] text-ink-500">
                {description}
              </DialogPrimitive.Description>
            )}
          </div>
          <DialogPrimitive.Close className="rounded p-1 text-ink-500 transition-colors hover:bg-ink-800 hover:text-ink-200">
            <X className="size-4" strokeWidth={1.75} />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </div>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
