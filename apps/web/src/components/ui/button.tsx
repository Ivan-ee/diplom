import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-caramel)] disabled:pointer-events-none disabled:opacity-40 select-none cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--color-caramel)] text-white hover:bg-[var(--color-caramel-hover)] active:scale-[0.97] shadow-sm hover:shadow-md',
        outline:
          'border border-[var(--color-caramel)] text-[var(--color-caramel)] bg-transparent hover:bg-[var(--color-caramel)] hover:text-white active:scale-[0.97]',
        ghost:
          'bg-transparent text-[var(--color-graphite)] hover:bg-[var(--color-toffee)] hover:text-[var(--color-caramel-hover)] active:scale-[0.97]',
        secondary:
          'bg-[var(--color-toffee)] text-[var(--color-graphite)] hover:bg-[var(--color-caramel)] hover:text-white active:scale-[0.97]',
        destructive:
          'bg-red-500 text-white hover:bg-red-600 active:scale-[0.97] shadow-sm',
      },
      size: {
        default: 'h-11 px-6 rounded-lg text-sm',
        sm: 'h-9 px-4 rounded-md text-sm',
        lg: 'h-12 px-8 rounded-xl text-base',
        icon: 'h-10 w-10 rounded-lg',
        'icon-sm': 'h-8 w-8 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
