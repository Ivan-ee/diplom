'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { CartItem } from '@/components/cart/CartItem';
import { CartSummary } from '@/components/cart/CartSummary';
import { CartCrossSell } from '@/components/cart/CartCrossSell';
import { useCartStore } from '@/stores/cart-store';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice } from '@/lib/utils';

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const totalPrice = useCartStore((s) => s.getTotalPrice());
  const totalItems = useCartStore((s) => s.getTotalItems());
  const isEmpty = items.length === 0;

  const router = useRouter();
  const { isAuthenticated, openAuth } = useAuth();

  const handleCheckout = () => {
    if (!isAuthenticated) {
      openAuth('login');
      return;
    }
    router.push('/checkout');
  };

  const [unavailableIds, setUnavailableIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function validateItems() {
      // Только товары из каталога (тип 'product') с productId
      const productIds = [
        ...new Set(
          items
            .filter((i) => i.type === 'product' && i.productId)
            .map((i) => i.productId as string),
        ),
      ];
      if (productIds.length === 0) return;

      try {
        // findAll на бэке фильтрует isAvailable=true и isDeleted=false,
        // поэтому id, отсутствующие в ответе — недоступны или удалены.
        const res = await fetch(`/api/products?limit=200&page=1`);
        if (!res.ok) return; // На ошибке не блокируем пользователя

        const json = await res.json();
        const availableData: Array<{ id: string }> = json?.data ?? [];
        const availableSet = new Set(availableData.map((p) => p.id));

        const unavailable = new Set(
          productIds.filter((id) => !availableSet.has(id)),
        );
        setUnavailableIds(unavailable);
      } catch {
        // Silent fail — не блокируем при сетевых ошибках
      }
    }

    validateItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  const hasUnavailable = unavailableIds.size > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 pb-24 lg:pb-0">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-heading font-bold text-[length:var(--text-h1)] leading-[var(--leading-heading)] tracking-tight text-[var(--color-graphite)]">
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
            <p className="font-heading text-6xl text-[var(--color-toffee)] mb-6 select-none" aria-hidden="true">∅</p>
            <h2 className="text-xl font-medium text-[var(--color-graphite-light)] mb-6">
              Корзина пуста
            </h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/catalog"
                className="inline-flex items-center justify-center rounded-full bg-[var(--color-caramel)] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--color-caramel-hover)]"
              >
                В каталог
              </Link>
              <Link
                href="/constructor"
                className="inline-flex items-center justify-center rounded-full border border-[var(--color-champagne)] px-6 py-3 text-sm font-medium text-[var(--color-graphite)] transition-colors hover:bg-[var(--color-champagne)]/40"
              >
                Собрать торт в 3D
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
            className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 lg:gap-12 items-start"
          >
            {/* Left column: item list */}
            <div>
              <AnimatePresence initial={false}>
                <div className="flex flex-col gap-4">
                  {items.map((item) => (
                    <CartItem
                      key={item.id}
                      item={item}
                      isUnavailable={
                        item.productId
                          ? unavailableIds.has(item.productId)
                          : false
                      }
                    />
                  ))}
                </div>
              </AnimatePresence>

              {/* Clear cart */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearCart}
                  className="text-xs text-[var(--color-graphite-light)] hover:text-red-400 transition-colors duration-150 underline underline-offset-2 hover:no-underline cursor-pointer"
                >
                  Очистить корзину
                </button>
              </div>

              <CartCrossSell />
            </div>

            {/* Right column: summary — sticky on desktop */}
            <div className="lg:sticky lg:top-24">
              <CartSummary hasUnavailable={hasUnavailable} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile sticky bottom bar — only when cart has items */}
      {!isEmpty && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border-default)] bg-[var(--surface-elevated)] px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] lg:hidden">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div>
              <p className="text-xs text-[var(--color-graphite-light)]">
                {totalItems} {totalItems === 1 ? 'товар' : totalItems < 5 ? 'товара' : 'товаров'}
              </p>
              <p className="text-lg font-bold text-[var(--color-graphite)]">
                {formatPrice(totalPrice)}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCheckout}
              className="rounded-[var(--radius-control)] bg-[var(--color-caramel)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--color-caramel-hover)] transition-colors"
            >
              Оформить заказ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
