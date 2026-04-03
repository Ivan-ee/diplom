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
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-[var(--color-dark)]">
        {label}
      </label>
      {children}
      {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}
    </div>
  );
}

export const inputClass =
  'h-11 w-full rounded-lg border border-gray-300 bg-white px-3.5 text-sm text-[var(--color-dark)] placeholder:text-gray-400 transition-colors duration-150 focus:border-[var(--color-dusty-rose)] focus:outline-none focus:ring-1 focus:ring-[var(--color-dusty-rose)]/50 disabled:opacity-50';
