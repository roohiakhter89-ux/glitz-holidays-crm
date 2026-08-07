import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * The one container in the product. Hover lift is 1px — enough to register as
 * interactive, small enough not to make a dense table feel like it's breathing.
 */
export function Panel({
  className,
  interactive = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-[10px] border border-ink-700/80 bg-ink-900',
        'shadow-[0_1px_2px_rgba(0,0,0,0.4),0_8px_24px_-12px_rgba(0,0,0,0.7)]',
        interactive &&
          'transition-[transform,border-color,box-shadow] duration-200 ease-out ' +
            'hover:-translate-y-px hover:border-ink-600 ' +
            'hover:shadow-[0_2px_4px_rgba(0,0,0,0.5),0_16px_32px_-16px_rgba(0,0,0,0.85)]',
        className,
      )}
      {...props}
    />
  );
}

export function PanelHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 border-b border-ink-700/60 px-5 py-3.5',
        className,
      )}
      {...props}
    />
  );
}

export function PanelTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        'text-[13px] font-semibold tracking-[0.08em] uppercase text-ink-300',
        className,
      )}
      {...props}
    />
  );
}

export function PanelBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5', className)} {...props} />;
}
