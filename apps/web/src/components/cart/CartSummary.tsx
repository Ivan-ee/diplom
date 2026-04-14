'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { TrustSignals } from '@/components/ui/TrustSignals';
import { motion } from 'framer-motion';
import { useCartStore } from '@/stores/cart-store';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice } from '@/lib/utils';
import { usePromoCode } from '@/hooks/usePromoCode';
import { PromoCodeInput } from '@/components/cart/PromoCodeInput';

interface CartSummaryProps {
  hasUnavailable?: boolean;
}

export function CartSummary({ hasUnavailable = false }: CartSummaryProps) {
  const router = useRouter();
  const { isAuthenticated, openAuth } = useAuth();
  const totalPrice = useCartStore((s) => s.getTotalPrice());
  const totalItems = useCartStore((s) => s.getTotalItems());
  const {
    promoCode,
    setPromoCode,
    promoLoading,
    promoError,
    promoResult,
    finalPrice,
    handleApplyPromo,
    handleRemovePromo,
  } = usePromoCode(totalPrice);

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
      <PromoCodeInput
        promoCode={promoCode}
        onPromoCodeChange={setPromoCode}
        promoLoading={promoLoading}
        promoError={promoError}
        promoResult={promoResult}
        onApply={handleApplyPromo}
        onRemove={handleRemovePromo}
      />

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
