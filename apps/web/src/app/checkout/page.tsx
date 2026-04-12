'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { useAuth } from '@/hooks/useAuth';
import { useCartStore } from '@/stores/cart-store';

const ProgressIndicator = () => (
  <div className="flex items-center justify-center gap-2 text-xs font-medium mb-6">
    <span className="flex items-center gap-1.5 text-[var(--color-caramel)]">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-caramel)] text-[10px] text-white">✓</span>
      Корзина
    </span>
    <span className="h-px w-6 bg-[var(--color-caramel)]" />
    <span className="flex items-center gap-1.5 text-[var(--color-graphite)]">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-caramel)] text-[10px] text-white">2</span>
      Оформление
    </span>
    <span className="h-px w-6 bg-[var(--color-champagne)]" />
    <span className="flex items-center gap-1.5 text-[var(--color-graphite-light)]">
      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[var(--color-champagne)] text-[10px] text-[var(--color-graphite-light)]">3</span>
      Готово
    </span>
  </div>
);

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, openAuth } = useAuth();
  const items = useCartStore((s) => s.items);

  // Open auth modal for unauthenticated users — stay on this page
  useEffect(() => {
    if (!isAuthenticated) {
      openAuth('login');
    }
  }, [isAuthenticated, openAuth]);

  // Redirect if cart is empty (only after confirmed authenticated)
  useEffect(() => {
    if (isAuthenticated && items.length === 0) {
      router.replace('/cart');
    }
  }, [isAuthenticated, items.length, router]);

  // Inline auth prompt for unauthenticated users
  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <ProgressIndicator />
        <h1 className="font-heading text-3xl font-bold text-[var(--color-graphite)] mb-4">
          Оформление заказа
        </h1>
        <p className="text-[var(--color-graphite-light)] mb-6">
          Для оформления заказа необходимо войти в аккаунт
        </p>
        <button
          onClick={() => openAuth('login')}
          className="inline-flex items-center justify-center rounded-full bg-[var(--color-caramel)] px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--color-caramel-hover)]"
        >
          Войти
        </button>
      </div>
    );
  }

  // Spinner while cart redirect is in flight
  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-caramel)] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="mb-8"
      >
        <Link
          href="/cart"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-graphite-light)]/60 hover:text-[var(--color-caramel)] transition-colors duration-150 mb-4"
        >
          <ArrowLeft size={14} />
          Корзина
        </Link>

        {/* Progress indicator */}
        <ProgressIndicator />

        <h1 className="font-heading font-bold text-[length:var(--text-h1)] leading-[var(--leading-heading)] tracking-tight text-[var(--color-graphite)]">
          Оформление заказа
        </h1>
        <p className="text-sm text-[var(--color-graphite-light)]/60 mt-2">
          Оплата при получении · Самовывоз
        </p>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut', delay: 0.08 }}
      >
        <CheckoutForm />
      </motion.div>
    </div>
  );
}
