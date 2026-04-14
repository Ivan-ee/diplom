'use client';

import { Loader2, X } from 'lucide-react';
import { type PromoResult } from '@/stores/cart-store';
import { formatPrice } from '@/lib/utils';

export interface PromoCodeInputProps {
  promoCode: string;
  onPromoCodeChange: (value: string) => void;
  promoLoading: boolean;
  promoError: string | null;
  promoResult: PromoResult | null;
  onApply: () => void;
  onRemove: () => void;
  /** When true, omits the top border/margin wrapper — for use inside CartDrawer */
  compact?: boolean;
}

export function PromoCodeInput({
  promoCode,
  onPromoCodeChange,
  promoLoading,
  promoError,
  promoResult,
  onApply,
  onRemove,
  compact = false,
}: PromoCodeInputProps) {
  const wrapperClass = compact
    ? ''
    : 'mt-4 pt-4 border-t border-[var(--color-champagne)]';

  return (
    <div className={wrapperClass}>
      <p className="text-sm font-medium text-[var(--color-graphite)] mb-2">Промокод</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={promoCode}
          onChange={(e) => {
            onPromoCodeChange(e.target.value.toUpperCase());
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !promoResult) {
              e.preventDefault();
              onApply();
            }
          }}
          placeholder="Введите промокод"
          disabled={!!promoResult}
          className="flex-1 border border-[var(--border-default)] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[var(--color-caramel)] focus:ring-1 focus:ring-[var(--color-caramel)]/30 transition-colors bg-white text-[var(--color-graphite)] placeholder:text-[var(--color-graphite-light)]/60 disabled:opacity-50"
        />
        {promoResult ? (
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl border border-[var(--border-default)] hover:border-red-300 hover:bg-red-50 text-[var(--color-graphite-light)] hover:text-red-500 transition-colors"
            aria-label="Убрать промокод"
          >
            <X size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={onApply}
            disabled={promoLoading || !promoCode.trim()}
            className="shrink-0 px-4 h-10 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-default)] text-sm font-medium text-[var(--color-caramel)] hover:bg-[var(--color-caramel)] hover:text-white hover:border-[var(--color-caramel)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {promoLoading ? <Loader2 size={16} className="animate-spin" /> : 'OK'}
          </button>
        )}
      </div>
      {promoResult && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-[var(--color-success)]">
          Скидка: &minus;{formatPrice(promoResult.discountAmount)}
          {promoResult.discountType === 'percentage' && ` (${promoResult.discountValue}%)`}
        </p>
      )}
      {promoError && (
        <p className="mt-2 text-xs text-[var(--color-error,#ef4444)]">{promoError}</p>
      )}
    </div>
  );
}
