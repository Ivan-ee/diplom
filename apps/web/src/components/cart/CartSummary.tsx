'use client';

import { useRouter } from 'next/navigation';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
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
      className="bg-[var(--color-cream)] rounded-2xl p-6 border border-[var(--color-soft-peach)]"
    >
      <h2 className="font-heading font-semibold text-[var(--color-dark)] text-lg mb-5">
        Итого
      </h2>

      {/* Line items summary */}
      <div className="flex flex-col gap-3 mb-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--color-text-secondary)]">
            Товары ({totalItems}&nbsp;{itemWord})
          </span>
          <span className="font-medium text-[var(--color-dark)] tabular-nums">
            {formatPrice(totalPrice)}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--color-text-secondary)]">Доставка</span>
          <span className="text-emerald-600 font-medium">Самовывоз</span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-[var(--color-soft-peach)] mb-5" />

      {/* Total */}
      <div className="flex items-baseline justify-between mb-6 gap-2">
        <span className="font-heading font-semibold text-[var(--color-dark)] text-base">
          К оплате
        </span>
        <motion.span
          key={totalPrice}
          initial={{ scale: 0.92, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="font-heading font-bold text-2xl text-[var(--color-dusty-rose)] tabular-nums"
        >
          {formatPrice(totalPrice)}
        </motion.span>
      </div>

      {/* CTA button */}
      <Button
        size="lg"
        variant="default"
        className="w-full"
        onClick={handleCheckout}
      >
        Оформить заказ
        <ArrowRight size={16} />
      </Button>

      {/* Auth hint */}
      {!isAuthenticated && (
        <p className="mt-3 text-center text-xs text-[var(--color-text-secondary)]">
          Для оформления необходимо{' '}
          <button
            onClick={() => openAuth('login')}
            className="text-[var(--color-dusty-rose)] underline underline-offset-2 cursor-pointer hover:no-underline transition-all duration-150"
          >
            войти
          </button>
        </p>
      )}

      {/* Pickup note */}
      <div className="mt-4 flex items-start gap-2 p-3 bg-white rounded-xl border border-[var(--color-soft-peach)]">
        <ShoppingBag size={14} className="shrink-0 mt-0.5 text-[var(--color-dusty-rose)]" />
        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
          Самовывоз по адресу: г.&nbsp;Арзамас, ул.&nbsp;Ленина, д.&nbsp;15.
          Оплата при получении.
        </p>
      </div>
    </motion.div>
  );
}
