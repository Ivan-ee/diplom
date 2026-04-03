'use client';

import { useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, MapPin, Clock, CalendarDays, ShoppingBag, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ── Confetti particle ────────────────────────────────────────────────────────

interface Particle {
  id: number;
  x: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotate: number;
}

const CONFETTI_COLORS = [
  '#C4A08A', // dusty-rose
  '#F9D5C4', // soft-peach
  '#A8C5A0', // sage
  '#F5C5A3', // warm-peach
  '#D4B896', // tan
  '#E8D5C4', // light-rose
];

function useConfettiParticles(count: number): Particle[] {
  const ref = useRef<Particle[]>([]);
  if (ref.current.length === 0) {
    ref.current = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 1.8,
      duration: 2.4 + Math.random() * 2,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)] as string,
      size: 6 + Math.random() * 8,
      rotate: Math.random() * 360,
    }));
  }
  return ref.current;
}

function ConfettiPiece({ p }: { p: Particle }) {
  return (
    <motion.div
      className="absolute top-0 rounded-sm pointer-events-none"
      style={{
        left: `${p.x}%`,
        width: p.size,
        height: p.size * 0.6,
        backgroundColor: p.color,
        rotate: p.rotate,
      }}
      initial={{ y: -20, opacity: 1 }}
      animate={{
        y: ['0%', '120vh'],
        opacity: [1, 1, 0],
        rotate: [p.rotate, p.rotate + 360 * (Math.random() > 0.5 ? 1 : -1)],
        x: [0, (Math.random() - 0.5) * 120],
      }}
      transition={{
        delay: p.delay,
        duration: p.duration,
        ease: 'easeIn',
        times: [0, 0.8, 1],
      }}
    />
  );
}

function Confetti() {
  const particles = useConfettiParticles(36);
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-50" aria-hidden="true">
      {particles.map((p) => (
        <ConfettiPiece key={p.id} p={p} />
      ))}
    </div>
  );
}

// ── Time slot display ────────────────────────────────────────────────────────

const TIME_SLOT_LABELS: Record<string, string> = {
  morning: 'Утро (10:00 — 12:00)',
  afternoon: 'День (12:00 — 16:00)',
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
  icon: React.ElementType;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <div className="shrink-0 w-8 h-8 rounded-lg bg-[var(--color-cream)] border border-[var(--color-soft-peach)] flex items-center justify-center mt-0.5">
        <Icon size={14} className="text-[var(--color-dusty-rose)]" />
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-secondary)] leading-none mb-1">{label}</p>
        <p className="text-sm font-semibold text-[var(--color-dark)] leading-snug">{value}</p>
      </div>
    </div>
  );
}

// ── Inner content (uses useSearchParams — must be wrapped in Suspense) ────────

function SuccessContent() {
  const searchParams = useSearchParams();

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
        className="mb-6 flex items-center justify-center"
      >
        <div className="relative">
          {/* Glow ring */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1.35, opacity: 0 }}
            transition={{ duration: 1.2, delay: 0.3, repeat: Infinity, repeatDelay: 2 }}
            className="absolute inset-0 rounded-full bg-emerald-400/30"
          />
          <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
            <CheckCircle2 size={44} className="text-emerald-500" strokeWidth={1.75} />
          </div>
        </div>
      </motion.div>

      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut', delay: 0.25 }}
        className="text-center mb-8"
      >
        <h1 className="font-heading font-bold text-3xl text-[var(--color-dark)] mb-2">
          Заказ оформлен!
        </h1>
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed max-w-xs mx-auto">
          Мы получили ваш заказ и уже начинаем его готовить. До встречи!
        </p>
      </motion.div>

      {/* Order details card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut', delay: 0.38 }}
        className="w-full max-w-sm mx-auto mb-8"
      >
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          {/* Order number banner */}
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
            <span className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
              Номер заказа
            </span>
            <span className="font-heading font-bold text-lg text-[var(--color-dusty-rose)] tabular-nums">
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
        </div>
      </motion.div>

      {/* CTA buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut', delay: 0.52 }}
        className="flex flex-col sm:flex-row gap-3 w-full max-w-sm mx-auto"
      >
        <Link
          href="/account/orders"
          className={cn(buttonVariants({ size: 'lg', variant: 'default' }), 'flex-1')}
        >
          <ShoppingBag size={16} />
          Мои заказы
        </Link>
        <Link
          href="/"
          className={cn(buttonVariants({ size: 'lg', variant: 'outline' }), 'flex-1')}
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
        className="mt-6 text-xs text-[var(--color-text-secondary)] text-center max-w-xs mx-auto leading-relaxed"
      >
        При необходимости вы можете связаться с нами по телефону или через чат
      </motion.p>
    </>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CheckoutSuccessPage() {
  // useRef + useEffect are kept so the import is used; confetti mounts once on render.
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
  }, []);

  return (
    <>
      <Confetti />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col items-center">
          <Suspense
            fallback={
              <div className="w-8 h-8 rounded-full border-2 border-[var(--color-dusty-rose)] border-t-transparent animate-spin" />
            }
          >
            <SuccessContent />
          </Suspense>
        </div>
      </div>
    </>
  );
}
