'use client';

import Link from 'next/link';
import { CakeSlice, ArrowLeft } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { buttonVariants } from '@/components/ui/button';
import { CartItem } from '@/components/cart/CartItem';
import { CartSummary } from '@/components/cart/CartSummary';
import { useCartStore } from '@/stores/cart-store';
import { cn } from '@/lib/utils';

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const isEmpty = items.length === 0;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Page header */}
      <div className="mb-8 flex flex-col gap-1">
        <div className="flex items-center gap-3 mb-1">
          <Link
            href="/catalog"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-dusty-rose)] transition-colors duration-150"
          >
            <ArrowLeft size={14} />
            Каталог
          </Link>
        </div>
        <h1 className="font-heading font-bold text-4xl text-[var(--color-dark)]">Корзина</h1>
        {!isEmpty && (
          <p className="text-[var(--color-text-secondary)] text-sm">
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
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="mb-6 flex items-center justify-center w-24 h-24 rounded-full bg-[var(--color-cream)] border-2 border-[var(--color-soft-peach)]">
              <CakeSlice
                size={44}
                className="text-[var(--color-dusty-rose)] opacity-60"
                strokeWidth={1.5}
              />
            </div>
            <h2 className="font-heading font-semibold text-2xl text-[var(--color-dark)] mb-2">
              Корзина пуста
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm max-w-xs mb-8 leading-relaxed">
              Добавьте торты или соберите свой уникальный торт в конструкторе
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/catalog" className={cn(buttonVariants({ size: 'lg', variant: 'default' }))}>
                Перейти в каталог
              </Link>
              <Link href="/constructor" className={cn(buttonVariants({ size: 'lg', variant: 'outline' }))}>
                Создать торт
              </Link>
            </div>
          </motion.div>
        ) : (
          /* ── Items + summary ── */
          <motion.div
            key="cart"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start"
          >
            {/* Left column: item list */}
            <div>
              {/* Items card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <AnimatePresence initial={false}>
                  {items.map((item) => (
                    <div key={item.id} className="px-4 sm:px-6 last:[&>div.h-px]:hidden">
                      <CartItem item={item} />
                    </div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Clear cart */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearCart}
                  className="text-xs text-[var(--color-text-secondary)] hover:text-red-400 transition-colors duration-150 underline underline-offset-2 hover:no-underline cursor-pointer"
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
