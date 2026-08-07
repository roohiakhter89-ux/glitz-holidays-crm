'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ' +
    'transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out ' +
    'disabled:pointer-events-none disabled:opacity-45 active:translate-y-px ' +
    '[&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-signal-600 text-ink-50 hover:bg-signal-500 shadow-[0_1px_0_0_rgba(255,255,255,0.08)_inset,0_1px_2px_0_rgba(0,0,0,0.6)]',
        secondary:
          'bg-ink-800 text-ink-100 border border-ink-700 hover:bg-ink-700 hover:border-ink-600',
        ghost: 'text-ink-300 hover:text-ink-50 hover:bg-ink-800',
        danger: 'bg-loss-500 text-ink-50 hover:bg-loss-400',
        link: 'text-signal-400 underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-9 px-4',
        lg: 'h-10 px-5',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { buttonVariants };
