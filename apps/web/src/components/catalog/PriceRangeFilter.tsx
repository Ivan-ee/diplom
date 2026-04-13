'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { PRICE_FILTER_DEBOUNCE_MS } from '@/lib/constants';

interface PriceRangeFilterProps {
  priceMin?: string;
  priceMax?: string;
  onUpdate: (params: { priceMin?: string; priceMax?: string }) => void;
  className?: string;
}

/** Convert a ruble string from the input to a kopeck string for the API.
 *  Empty / non-numeric input → undefined (clears the param). */
function rubleInputToKopecks(value: string): string | undefined {
  const trimmed = value.trim();
  if (trimmed === '') return undefined;
  const rubles = parseFloat(trimmed);
  if (isNaN(rubles) || rubles < 0) return undefined;
  return String(Math.round(rubles * 100));
}

/** Convert a kopeck string coming from URL params back to a ruble display value. */
function kopecksParamToRubles(value: string | undefined): string {
  if (!value) return '';
  const kopecks = parseInt(value, 10);
  if (isNaN(kopecks)) return '';
  return String(Math.round(kopecks / 100));
}

export function PriceRangeFilter({
  priceMin,
  priceMax,
  onUpdate,
  className,
}: PriceRangeFilterProps) {
  const [minValue, setMinValue] = useState<string>(() => kopecksParamToRubles(priceMin));
  const [maxValue, setMaxValue] = useState<string>(() => kopecksParamToRubles(priceMax));

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local state when URL params change externally (e.g. filter reset).
  useEffect(() => {
    setMinValue(kopecksParamToRubles(priceMin));
  }, [priceMin]);

  useEffect(() => {
    setMaxValue(kopecksParamToRubles(priceMax));
  }, [priceMax]);

  // Clear the debounce timer on unmount.
  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  function scheduleUpdate(nextMin: string, nextMax: string) {
    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      onUpdate({
        priceMin: rubleInputToKopecks(nextMin),
        priceMax: rubleInputToKopecks(nextMax),
      });
    }, PRICE_FILTER_DEBOUNCE_MS);
  }

  function handleMinChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    setMinValue(next);
    scheduleUpdate(next, maxValue);
  }

  function handleMaxChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    setMaxValue(next);
    scheduleUpdate(minValue, next);
  }

  const inputClass =
    'w-16 border border-[var(--border-default)] rounded-lg px-2 py-1.5 text-sm text-center outline-none focus:border-[var(--color-caramel)] focus:ring-1 focus:ring-[var(--color-caramel)]/30 transition-colors bg-white';

  const labelClass = 'text-xs text-[var(--color-graphite-light)]';

  return (
    <div
      className={cn(
        'flex items-center gap-2 bg-[var(--surface-secondary)] border border-[var(--border-default)] rounded-xl px-3 py-2',
        className,
      )}
    >
      <span className={labelClass}>Цена:</span>

      <input
        type="number"
        min={0}
        step={1}
        value={minValue}
        onChange={handleMinChange}
        placeholder="от"
        aria-label="Минимальная цена (руб.)"
        className={inputClass}
      />

      <span className={labelClass}>—</span>

      <input
        type="number"
        min={0}
        step={1}
        value={maxValue}
        onChange={handleMaxChange}
        placeholder="до"
        aria-label="Максимальная цена (руб.)"
        className={inputClass}
      />

      <span className={labelClass}>₽</span>
    </div>
  );
}
