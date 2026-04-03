import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors duration-200 select-none',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--color-dusty-rose)] text-white',
        secondary:
          'bg-[var(--color-soft-peach)] text-[var(--color-dark)]',
        success:
          'bg-emerald-100 text-emerald-700',
        warning:
          'bg-orange-100 text-orange-700',
        error:
          'bg-red-100 text-red-600',
        info:
          'bg-blue-100 text-blue-700',
        outline:
          'border border-[var(--color-dusty-rose)] text-[var(--color-dusty-rose)] bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
);
Badge.displayName = 'Badge';

export { Badge, badgeVariants };
