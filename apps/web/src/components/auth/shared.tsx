'use client';

import type { ReactNode } from 'react';

export interface FieldWrapperProps {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}

export function FieldWrapper({ id, label, error, children }: FieldWrapperProps) {
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="text-sm font-medium text-neutral-700 mb-1.5 block">
        {label}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

export const inputClass =
  'w-full border border-[var(--color-champagne)] rounded-xl px-4 py-3 text-sm focus:border-[var(--color-caramel)] focus:ring-1 focus:ring-[var(--color-caramel)]/30 transition-colors outline-none disabled:opacity-50 bg-white text-[var(--color-graphite)] placeholder:text-[var(--color-graphite-light)]/60';
