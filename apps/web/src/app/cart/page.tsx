'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { CartItem } from '@/components/cart/CartItem';
import { CartSummary } from '@/components/cart/CartSummary';
import { useCartStore } from '@/stores/cart-store';

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const isEmpty = items.length === 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-heading font-bold text-4xl lg:text-5xl tracking-tight text-[var(--color-graphite)]">
          Корзина
        </h1>
        {!isEmpty && (
          <p className="text-[var(--color-graphite-light)] text-sm mt-2">
            {items.length}&nbsp;{items.length === 1 ? 'позиция' : items.length >= 2 && items.length <= 4 ? 'позиции' : 'позиций'}
          </p>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isEmpty ? (
          /* ── Empty state ── */
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex flex-col items-center justify-center py-32 text-center"
          >
            <ShoppingBag
              size={64}
              className="text-neutral-300 mb-6"
              strokeWidth={1.25}
            />
            <h2 className="text-xl font-medium text-[var(--color-graphite-light)] mb-6">
              Корзина пуста
            </h2>
            <Link
              href="/catalog"
              className="inline-flex items-center justify-center px-6 h-11 rounded-full bg-[var(--color-caramel)] text-white text-sm font-medium hover:bg-[var(--color-caramel-hover)] transition-colors duration-150"
            >
              В каталог
            </Link>
          </motion.div>
        ) : (
          /* ── Items + summary ── */
          <motion.div
            key="cart"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 lg:gap-12 items-start"
          >
            {/* Left column: item list */}
            <div>
              <AnimatePresence initial={false}>
                <div className="flex flex-col gap-4">
                  {items.map((item) => (
                    <CartItem key={item.id} item={item} />
                  ))}
                </div>
              </AnimatePresence>

              {/* Clear cart */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearCart}
                  className="text-xs text-neutral-400 hover:text-red-400 transition-colors duration-150 underline underline-offset-2 hover:no-underline cursor-pointer"
                >
                  Очистить корзину
                </button>
              </div>
            </div>

            {/* Right column: summary — sticky on desktop */}
            <div className="lg:sticky lg:top-24">
              <CartSummary />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
