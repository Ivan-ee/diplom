'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { useAuth } from '@/hooks/useAuth';
import { useCartStore } from '@/stores/cart-store';

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, openAuth } = useAuth();
  const items = useCartStore((s) => s.items);

  // Redirect unauthenticated users — open auth modal and send them back to cart
  useEffect(() => {
    if (!isAuthenticated) {
      openAuth('login');
      router.replace('/cart');
    }
  }, [isAuthenticated, openAuth, router]);

  // Redirect if cart is empty
  useEffect(() => {
    if (isAuthenticated && items.length === 0) {
      router.replace('/cart');
    }
  }, [isAuthenticated, items.length, router]);

  // Render nothing while redirect is in flight
  if (!isAuthenticated || items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-dusty-rose)] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <Link
            href="/cart"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-dusty-rose)] transition-colors duration-150"
          >
            <ArrowLeft size={14} />
            Корзина
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="font-heading font-bold text-4xl text-[var(--color-dark)]">
              Оформление заказа
            </h1>
            <p className="text-[var(--color-text-secondary)] text-sm mt-1">
              Укажите дату и время самовывоза
            </p>
          </div>

          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
            <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
            <span className="text-xs font-medium text-emerald-700">Безопасная оплата при получении</span>
          </div>
        </div>
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
