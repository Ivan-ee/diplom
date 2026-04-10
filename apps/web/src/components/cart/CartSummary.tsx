'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCartStore } from '@/stores/cart-store';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice } from '@/lib/utils';

export function CartSummary() {
  const router = useRouter();
  const { isAuthenticated, openAuth } = useAuth();
  const totalPrice = useCartStore((s) => s.getTotalPrice());
  const totalItems = useCartStore((s) => s.getTotalItems());

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
      className="sticky lg:top-24 bg-[var(--color-warm-ivory)] rounded-2xl p-6 lg:p-8 border border-[var(--color-champagne)]"
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

        <div className="flex justify-between py-3">
          <span className="text-sm font-semibold text-[var(--color-graphite)]">К оплате</span>
          <motion.span
            key={totalPrice}
            initial={{ scale: 0.92, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="font-heading font-bold text-2xl text-[var(--color-caramel)] tabular-nums"
          >
            {formatPrice(totalPrice)}
          </motion.span>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={handleCheckout}
        className="w-full flex items-center justify-center gap-2 bg-[var(--color-caramel)] hover:bg-[var(--color-caramel-hover)] text-white rounded-xl h-12 text-base font-medium mt-6 transition-colors duration-150 cursor-pointer"
      >
        Оформить заказ
        <ArrowRight size={16} />
      </button>

      {/* Auth hint */}
      {!isAuthenticated && (
        <p className="mt-3 text-center text-xs text-[var(--color-graphite-light)]/60">
          Для оформления необходимо{' '}
          <button
            onClick={() => openAuth('login')}
            className="text-[var(--color-caramel)] underline underline-offset-2 cursor-pointer hover:no-underline transition-all duration-150"
          >
            войти
          </button>
        </p>
      )}

      {/* Pickup address */}
      <p className="text-sm text-[var(--color-graphite-light)] mt-4 text-center">
        Самовывоз: г.&nbsp;Арзамас, ул.&nbsp;Ленина, д.&nbsp;15
      </p>
    </motion.div>
  );
}
