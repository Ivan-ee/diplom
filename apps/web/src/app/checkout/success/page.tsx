'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, MapPin, Clock, CalendarDays, ShoppingBag, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { CHECKOUT_SUCCESS_PENDING_KEY } from '@/lib/constants';
import { cn } from '@/lib/utils';

// ── Time slot display ────────────────────────────────────────────────────────

const TIME_SLOT_LABELS: Record<string, string> = {
  morning: 'Утро (10:00 — 12:00)',
  day: 'День (12:00 — 16:00)',
  evening: 'Вечер (16:00 — 19:00)',
};

function formatPickupDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

// ── Detail row ───────────────────────────────────────────────────────────────

function DetailRow({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <div className="shrink-0 w-8 h-8 rounded-lg bg-neutral-50 border border-neutral-100 flex items-center justify-center mt-0.5">
        <Icon size={14} className="text-[var(--color-caramel)]" />
      </div>
      <div>
        <p className="text-xs text-neutral-400 leading-none mb-1">{label}</p>
        <p className="text-sm text-neutral-600 leading-snug">{value}</p>
      </div>
    </div>
  );
}

// ── Inner content (uses useSearchParams — must be wrapped in Suspense) ────────

function SuccessContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    window.sessionStorage.removeItem(CHECKOUT_SUCCESS_PENDING_KEY);
  }, []);

  const orderNumber = searchParams.get('orderNumber') ?? '—';
  const pickupDate = searchParams.get('pickupDate') ?? '';
  const timeSlot = searchParams.get('timeSlot') ?? '';

  const formattedDate = formatPickupDate(pickupDate);
  const formattedTime = TIME_SLOT_LABELS[timeSlot] ?? timeSlot;

  return (
    <>
      {/* Check icon */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22, delay: 0.1 }}
        className="mb-2 flex items-center justify-center"
      >
        <CheckCircle2
          className="text-emerald-500 w-16 h-16"
          strokeWidth={1.5}
        />
      </motion.div>

      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut', delay: 0.25 }}
        className="text-center mt-6 mb-8"
      >
        <h1 className="font-heading font-bold text-3xl text-[var(--color-graphite)] mb-2">
          Заказ оформлен!
        </h1>
        <p className="text-neutral-400 text-sm leading-relaxed max-w-xs mx-auto">
          Мы получили ваш заказ и уже начинаем его готовить. До встречи!
        </p>
      </motion.div>

      {/* Order details card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, type: 'spring', stiffness: 280, damping: 22 }}
        className="bg-white rounded-2xl border border-neutral-100 p-6 mt-8 max-w-md mx-auto w-full"
      >
        {/* Order number */}
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-neutral-100">
          <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
            Номер заказа
          </span>
          <span className="font-heading font-bold text-lg text-[var(--color-caramel)] tabular-nums">
            #{orderNumber}
          </span>
        </div>

        {/* Details */}
        <div className="flex flex-col gap-4">
          {formattedDate && (
            <DetailRow
              icon={CalendarDays}
              label="Дата получения"
              value={formattedDate}
            />
          )}
          {formattedTime && (
            <DetailRow
              icon={Clock}
              label="Время получения"
              value={formattedTime}
            />
          )}
          <DetailRow
            icon={MapPin}
            label="Адрес самовывоза"
            value="г. Арзамас, ул. Ленина, д. 15"
          />
        </div>
      </motion.div>

      {/* CTA buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut', delay: 0.52 }}
        className="flex flex-col sm:flex-row gap-3 w-full max-w-md mx-auto mt-6"
      >
        <Link
          href="/account/orders"
          className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-[var(--color-caramel)] hover:bg-[var(--color-caramel-hover)] text-white text-sm font-medium transition-colors duration-150"
        >
          <ShoppingBag size={16} />
          Мои заказы
        </Link>
        <Link
          href="/"
          className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-xl border border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50 text-sm font-medium transition-colors duration-150"
        >
          <Home size={16} />
          На главную
        </Link>
      </motion.div>

      {/* Small note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.7 }}
        className="mt-6 text-xs text-neutral-400 text-center max-w-xs mx-auto leading-relaxed"
      >
        При необходимости вы можете связаться с нами по телефону или через чат
      </motion.p>
    </>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CheckoutSuccessPage() {
  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex flex-col items-center">
          <Suspense
            fallback={
              <div className="w-8 h-8 rounded-full border-2 border-[var(--color-caramel)] border-t-transparent animate-spin" />
            }
          >
            <SuccessContent />
          </Suspense>
        </div>
      </div>
    </>
  );
}
