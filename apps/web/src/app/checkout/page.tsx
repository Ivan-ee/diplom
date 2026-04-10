'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
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
      <div className="max-w-7xl mx-auto px-4 py-24 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-dusty-rose)] border-t-transparent animate-spin" />
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
          className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-[var(--color-dusty-rose)] transition-colors duration-150 mb-4"
        >
          <ArrowLeft size={14} />
          Корзина
        </Link>

        <h1 className="font-heading font-bold text-4xl lg:text-5xl tracking-tight text-[var(--color-dark)]">
          Оформление заказа
        </h1>
        <p className="text-sm text-neutral-400 mt-2">
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
