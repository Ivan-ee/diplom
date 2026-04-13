'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, X } from 'lucide-react';
import { TrustSignals } from '@/components/ui/TrustSignals';
import { motion } from 'framer-motion';
import { useCartStore, type PromoResult } from '@/stores/cart-store';
import { useAuth } from '@/hooks/useAuth';
import { fetchClient } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { FREE_DECOR_THRESHOLD } from '@/lib/constants';

interface CartSummaryProps {
  hasUnavailable?: boolean;
}

export function CartSummary({ hasUnavailable = false }: CartSummaryProps) {
  const router = useRouter();
  const { isAuthenticated, openAuth } = useAuth();
  const totalPrice = useCartStore((s) => s.getTotalPrice());
  const totalItems = useCartStore((s) => s.getTotalItems());
  const promoResult = useCartStore((s) => s.promoResult);
  const setPromoResult = useCartStore((s) => s.setPromoResult);
  const clearPromo = useCartStore((s) => s.clearPromo);

  const [promoCode, setPromoCode] = useState(promoResult?.code ?? '');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError(null);
    try {
      const res = await fetchClient<PromoResult>('/promo-codes/validate', {
        method: 'POST',
        body: JSON.stringify({ code: promoCode.trim().toUpperCase(), cartTotal: totalPrice }),
      });
      if (res.data?.valid) {
        setPromoResult(res.data);
        setPromoError(null);
      } else {
        setPromoResult(null);
        setPromoError(res.data?.message ?? 'Промокод недействителен');
      }
    } catch {
      setPromoError('Не удалось проверить промокод');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    clearPromo();
    setPromoCode('');
    setPromoError(null);
  };

  const finalPrice = promoResult ? totalPrice - promoResult.discountAmount : totalPrice;

  function handleCheckout() {
    if (!isAuthenticated) {
      openAuth('login');
      return;
    }
    router.push('/checkout');
  }

  const itemWord =
    totalItems === 1
      ? 'товар'
      : totalItems >= 2 && totalItems <= 4
        ? 'товара'
        : 'товаров';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="sticky lg:top-24 bg-[var(--surface-secondary)] rounded-[var(--radius-card)] p-6 lg:p-8 border border-[var(--border-default)]"
    >
      <h2 className="font-heading font-semibold text-[var(--color-graphite)] text-lg mb-4">
        Итого
      </h2>

      {/* Progress bar — free decor threshold */}
      {(() => {
        const progress = Math.min(totalPrice / FREE_DECOR_THRESHOLD, 1);
        const remaining = FREE_DECOR_THRESHOLD - totalPrice;

        return (
          <div className="mb-4 rounded-xl border border-[var(--color-caramel)]/20 bg-[var(--color-caramel)]/5 p-3">
            {progress < 1 ? (
              <>
                <p className="text-sm font-medium text-[var(--color-graphite)] mb-2">
                  🎁 До бесплатного декора осталось {formatPrice(remaining)}
                </p>
                <div className="h-1.5 w-full rounded-full bg-[var(--color-champagne)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--color-caramel)] to-[var(--color-toffee)] transition-all duration-300"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
              </>
            ) : (
              <p className="text-sm font-medium text-[var(--color-success)] flex items-center gap-1.5">
                ✅ Бесплатный декор включён!
              </p>
            )}
          </div>
        );
      })()}

      {/* Line items */}
      <div className="flex flex-col">
        <div className="flex justify-between py-3 border-b border-[var(--color-champagne)]">
          <span className="text-sm text-[var(--color-graphite-light)]">
            Товары ({totalItems}&nbsp;{itemWord})
          </span>
          <span className="text-sm font-medium text-[var(--color-graphite)] tabular-nums">
            {formatPrice(totalPrice)}
          </span>
        </div>

        <div className="flex justify-between py-3 border-b border-[var(--color-champagne)]">
          <span className="text-sm text-[var(--color-graphite-light)]">Доставка</span>
          <span className="text-sm text-emerald-600 font-medium">Самовывоз</span>
        </div>

        {promoResult && (
          <div className="flex justify-between py-3 border-b border-[var(--color-champagne)]">
            <span className="text-sm text-[var(--color-success)]">Скидка ({promoResult.code})</span>
            <span className="text-sm font-medium text-[var(--color-success)] tabular-nums">−{formatPrice(promoResult.discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between py-3">
          <span className="text-sm font-semibold text-[var(--color-graphite)]">К оплате</span>
          <motion.span
            key={finalPrice}
            initial={{ scale: 0.92, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="font-heading font-bold text-2xl text-[var(--color-caramel)] tabular-nums"
          >
            {formatPrice(finalPrice)}
          </motion.span>
        </div>
      </div>

      {/* Promo code */}
      <div className="mt-4 pt-4 border-t border-[var(--color-champagne)]">
        <p className="text-sm font-medium text-[var(--color-graphite)] mb-2">Промокод</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={promoCode}
            onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(null); }}
            placeholder="Введите промокод"
            disabled={!!promoResult}
            className="flex-1 border border-[var(--border-default)] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[var(--color-caramel)] focus:ring-1 focus:ring-[var(--color-caramel)]/30 transition-colors bg-white text-[var(--color-graphite)] placeholder:text-[var(--color-graphite-light)]/60 disabled:opacity-50"
          />
          {promoResult ? (
            <button type="button" onClick={handleRemovePromo} className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl border border-[var(--border-default)] hover:border-red-300 hover:bg-red-50 text-[var(--color-graphite-light)] hover:text-red-500 transition-colors" aria-label="Убрать промокод">
              <X size={16} />
            </button>
          ) : (
            <button type="button" onClick={handleApplyPromo} disabled={promoLoading || !promoCode.trim()} className="shrink-0 px-4 h-10 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-default)] text-sm font-medium text-[var(--color-caramel)] hover:bg-[var(--color-caramel)] hover:text-white hover:border-[var(--color-caramel)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {promoLoading ? <Loader2 size={16} className="animate-spin" /> : 'OK'}
            </button>
          )}
        </div>
        {promoResult && (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-[var(--color-success)]">
            ✅ Скидка: −{formatPrice(promoResult.discountAmount)}
            {promoResult.discountType === 'percentage' && ` (${promoResult.discountValue}%)`}
          </p>
        )}
        {promoError && (
          <p className="mt-2 text-xs text-[var(--color-error,#ef4444)]">{promoError}</p>
        )}
      </div>

      {/* CTA */}
      <button
        onClick={handleCheckout}
        disabled={hasUnavailable}
        className="w-full flex items-center justify-center gap-2 bg-[var(--color-caramel)] hover:bg-[var(--color-caramel-hover)] text-white rounded-[var(--radius-control)] h-14 text-base font-semibold mt-6 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[var(--color-caramel)] cursor-pointer"
      >
        Оформить заказ
        <ArrowRight size={16} />
      </button>

      {/* Trust strip */}
      <TrustSignals variant="cart" />

      {/* Unavailable warning */}
      {hasUnavailable && (
        <p className="text-xs text-[var(--color-error,#ef4444)] mt-2 text-center">
          Удалите недоступные товары для оформления заказа
        </p>
      )}

      {/* Auth hint */}
      {!isAuthenticated && (
        <p className="mt-3 text-center text-xs text-[var(--color-graphite-light)]">
          Для оформления необходимо{' '}
          <button
            onClick={() => openAuth('login')}
            className="text-[var(--color-caramel)] underline underline-offset-2 cursor-pointer hover:no-underline transition-all duration-150"
          >
            войти
          </button>
        </p>
      )}

    </motion.div>
  );
}
