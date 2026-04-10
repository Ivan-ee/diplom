'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  showValue?: boolean;
  formatValue?: (value: number) => string;
  label?: string;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      className,
      value,
      min = 0,
      max = 100,
      step = 1,
      onChange,
      showValue = false,
      formatValue,
      label,
      ...props
    },
    ref
  ) => {
    const percentage = max > min ? ((value - min) / (max - min)) * 100 : 0;

    return (
      <div className={cn('w-full flex flex-col gap-1.5', className)}>
        {(label || showValue) && (
          <div className="flex items-center justify-between">
            {label && (
              <span className="text-sm font-medium text-[var(--color-graphite)]">{label}</span>
            )}
            {showValue && (
              <span className="text-sm font-semibold text-[var(--color-caramel)]">
                {formatValue ? formatValue(value) : value}
              </span>
            )}
          </div>
        )}
        <div className="relative flex items-center h-5">
          {/* Track background */}
          <div className="absolute w-full h-1.5 rounded-full bg-[var(--color-champagne)] overflow-hidden">
            {/* Filled portion */}
            <div
              className="h-full rounded-full bg-[var(--color-caramel)] transition-all duration-150 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
          {/* Native input */}
          <input
            ref={ref}
            type="range"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => onChange(Number(e.target.value))}
            className={cn(
              'absolute w-full h-5 opacity-0 cursor-pointer',
              '[&::-webkit-slider-thumb]:opacity-100',
              '[&::-webkit-slider-thumb]:appearance-none',
              '[&::-webkit-slider-thumb]:w-5',
              '[&::-webkit-slider-thumb]:h-5',
              '[&::-webkit-slider-thumb]:rounded-full',
              '[&::-webkit-slider-thumb]:bg-[var(--color-caramel)]',
              '[&::-webkit-slider-thumb]:border-2',
              '[&::-webkit-slider-thumb]:border-white',
              '[&::-webkit-slider-thumb]:shadow-md',
              '[&::-webkit-slider-thumb]:cursor-pointer',
              '[&::-webkit-slider-thumb]:transition-transform',
              '[&::-webkit-slider-thumb]:hover:scale-110'
            )}
            {...props}
          />
          {/* Visual thumb */}
          <div
            className="absolute w-5 h-5 rounded-full bg-[var(--color-caramel)] border-2 border-white shadow-md pointer-events-none transition-transform duration-150 ease-out"
            style={{ left: `calc(${percentage}% - 10px)` }}
          />
        </div>
      </div>
    );
  }
);
Slider.displayName = 'Slider';

export { Slider };
