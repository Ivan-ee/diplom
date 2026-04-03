import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  showLabel?: boolean;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, max = 100, showLabel = false, ...props }, ref) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        className={cn('relative w-full overflow-hidden rounded-full bg-gray-200', className)}
        style={{ height: '2px' }}
        {...props}
      >
        <div
          className="h-full rounded-full bg-[var(--color-dusty-rose)] transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
        {showLabel && (
          <span className="sr-only">{Math.round(percentage)}%</span>
        )}
      </div>
    );
  }
);
Progress.displayName = 'Progress';

export { Progress };
