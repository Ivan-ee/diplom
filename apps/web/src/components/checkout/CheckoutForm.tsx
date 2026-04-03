'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, Clock, MessageSquare, Loader2, AlertCircle, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/stores/cart-store';
import { fetchClient } from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';

// ── Validation schema ────────────────────────────────────────────────────────

function getTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0] as string;
}

const checkoutSchema = z.object({
  pickupDate: z
    .string()
    .min(1, 'Выберите дату получения')
    .refine((val) => {
      const selected = new Date(val);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selected > today;
    }, 'Дата должна быть не раньше завтрашнего дня')
    .refine((val) => {
      // 0 = Sunday
      return new Date(val).getDay() !== 0;
    }, 'Мы не работаем по воскресеньям'),
  timeSlot: z.enum(['morning', 'afternoon', 'evening'], {
    required_error: 'Выберите время получения',
  }),
  comment: z
    .string()
    .max(500, 'Комментарий не должен превышать 500 символов')
    .optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

// ── API response shape ───────────────────────────────────────────────────────

interface OrderCreatedResponse {
  id: string;
  orderNumber: string;
  pickupDate: string;
  timeSlot: string;
  totalPrice: number;
}

// ── Time slot config ─────────────────────────────────────────────────────────

const TIME_SLOTS: { id: CheckoutFormData['timeSlot']; label: string; sub: string }[] = [
  { id: 'morning', label: 'Утро', sub: '10:00 — 12:00' },
  { id: 'afternoon', label: 'День', sub: '12:00 — 16:00' },
  { id: 'evening', label: 'Вечер', sub: '16:00 — 19:00' },
];

// ── Component ────────────────────────────────────────────────────────────────

export function CheckoutForm() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const totalPrice = useCartStore((s) => s.getTotalPrice());
  const totalItems = useCartStore((s) => s.getTotalItems());
  const clearCart = useCartStore((s) => s.clearCart);

  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      pickupDate: '',
      comment: '',
    },
  });

  const commentValue = watch('comment') ?? '';

  async function onSubmit(data: CheckoutFormData) {
    setSubmitError(null);
    try {
      const payload = {
        pickupDate: data.pickupDate,
        timeSlot: data.timeSlot,
        comment: data.comment ?? '',
        items: items.map((item) => ({
          type: item.type,
          productId: item.productId ?? null,
          name: item.name,
          imageUrl: item.imageUrl,
          weight: item.weight,
          price: item.price,
          quantity: item.quantity,
          inscription: item.inscription ?? null,
          cakeConfig: item.cakeConfig ?? null,
        })),
        totalPrice,
      };

      const res = await fetchClient<OrderCreatedResponse>('/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      clearCart();

      const order = res.data;
      const params = new URLSearchParams({
        orderNumber: order.orderNumber ?? order.id,
        pickupDate: order.pickupDate ?? data.pickupDate,
        timeSlot: order.timeSlot ?? data.timeSlot,
      });

      router.push(`/checkout/success?${params.toString()}`);
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Не удалось оформить заказ. Попробуйте ещё раз.'
      );
    }
  }

  const itemWord =
    totalItems === 1
      ? 'товар'
      : totalItems >= 2 && totalItems <= 4
        ? 'товара'
        : 'товаров';

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">

        {/* ── Left column: form fields ── */}
        <div className="flex flex-col gap-6">

          {/* Section: Pickup address */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-heading font-semibold text-[var(--color-dark)] text-base mb-4 flex items-center gap-2">
              <MapPin size={17} className="text-[var(--color-dusty-rose)]" />
              Адрес получения
            </h2>
            <div className="flex items-start gap-3 p-4 bg-[var(--color-cream)] rounded-xl border border-[var(--color-soft-peach)]">
              <MapPin size={16} className="shrink-0 mt-0.5 text-[var(--color-dusty-rose)]" />
              <div>
                <p className="text-sm font-semibold text-[var(--color-dark)]">
                  г. Арзамас, ул. Ленина, д. 15
                </p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  Пн — Сб: 10:00 — 19:00 · Вс: выходной
                </p>
              </div>
            </div>
          </section>

          {/* Section: Date & time */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-heading font-semibold text-[var(--color-dark)] text-base mb-5 flex items-center gap-2">
              <Clock size={17} className="text-[var(--color-dusty-rose)]" />
              Дата и время получения
            </h2>

            {/* Date picker */}
            <div className="mb-5">
              <label
                htmlFor="pickupDate"
                className="block text-sm font-medium text-[var(--color-dark)] mb-1.5"
              >
                Дата <span className="text-red-400">*</span>
              </label>
              <input
                id="pickupDate"
                type="date"
                min={getTomorrow()}
                {...register('pickupDate')}
                className={cn(
                  'w-full h-11 rounded-lg border px-3 text-sm text-[var(--color-dark)] bg-white',
                  'transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0',
                  errors.pickupDate
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                    : 'border-gray-300 focus:border-[var(--color-dusty-rose)] focus:ring-[var(--color-dusty-rose)]/20'
                )}
              />
              <AnimatePresence>
                {errors.pickupDate && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="mt-1.5 text-xs text-red-500 flex items-center gap-1"
                  >
                    <AlertCircle size={11} />
                    {errors.pickupDate.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Time slot pills */}
            <div>
              <p className="text-sm font-medium text-[var(--color-dark)] mb-2.5">
                Время <span className="text-red-400">*</span>
              </p>
              <Controller
                name="timeSlot"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-3 gap-3">
                    {TIME_SLOTS.map(({ id, label, sub }) => {
                      const isSelected = field.value === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => field.onChange(id)}
                          className={cn(
                            'relative flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 transition-all duration-200 ease-out cursor-pointer',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dusty-rose)] focus-visible:ring-offset-2',
                            isSelected
                              ? 'border-[var(--color-dusty-rose)] bg-[var(--color-dusty-rose)]/5 shadow-sm shadow-[var(--color-dusty-rose)]/15'
                              : 'border-gray-200 bg-white hover:border-[var(--color-soft-peach)] hover:bg-[var(--color-cream)] hover:shadow-sm'
                          )}
                        >
                          {isSelected && (
                            <motion.div
                              layoutId="timeslot-selection"
                              className="absolute inset-0 rounded-[10px] border-2 border-[var(--color-dusty-rose)]"
                              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                            />
                          )}
                          <span
                            className={cn(
                              'relative z-10 text-sm font-semibold leading-tight',
                              isSelected
                                ? 'text-[var(--color-dusty-rose)]'
                                : 'text-[var(--color-dark)]'
                            )}
                          >
                            {label}
                          </span>
                          <span className="relative z-10 text-[10px] text-[var(--color-text-secondary)] leading-tight">
                            {sub}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              />
              <AnimatePresence>
                {errors.timeSlot && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="mt-2 text-xs text-red-500 flex items-center gap-1"
                  >
                    <AlertCircle size={11} />
                    {errors.timeSlot.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* Section: Comment */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-heading font-semibold text-[var(--color-dark)] text-base mb-4 flex items-center gap-2">
              <MessageSquare size={17} className="text-[var(--color-dusty-rose)]" />
              Комментарий к заказу
            </h2>
            <div className="relative">
              <textarea
                id="comment"
                rows={4}
                placeholder="Пожелания по упаковке, аллергии, особые требования..."
                {...register('comment')}
                className={cn(
                  'w-full rounded-lg border px-3 py-2.5 text-sm text-[var(--color-dark)] bg-white resize-none leading-relaxed',
                  'placeholder:text-gray-400 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0',
                  errors.comment
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                    : 'border-gray-300 focus:border-[var(--color-dusty-rose)] focus:ring-[var(--color-dusty-rose)]/20'
                )}
              />
              <p
                className={cn(
                  'absolute bottom-2.5 right-3 text-[11px] tabular-nums pointer-events-none transition-colors duration-150',
                  commentValue.length > 450
                    ? commentValue.length > 490
                      ? 'text-red-400'
                      : 'text-orange-400'
                    : 'text-gray-300'
                )}
              >
                {commentValue.length}/500
              </p>
            </div>
            <AnimatePresence>
              {errors.comment && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="mt-1.5 text-xs text-red-500 flex items-center gap-1"
                >
                  <AlertCircle size={11} />
                  {errors.comment.message}
                </motion.p>
              )}
            </AnimatePresence>
          </section>
        </div>

        {/* ── Right column: order summary ── */}
        <div className="lg:sticky lg:top-24 flex flex-col gap-4">
          <div className="bg-[var(--color-cream)] rounded-2xl border border-[var(--color-soft-peach)] p-6">
            <h2 className="font-heading font-semibold text-[var(--color-dark)] text-base mb-4 flex items-center gap-2">
              <ShoppingBag size={17} className="text-[var(--color-dusty-rose)]" />
              Ваш заказ ({totalItems}&nbsp;{itemWord})
            </h2>

            {/* Item list */}
            <div className="flex flex-col gap-3 mb-5">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  {/* Thumbnail */}
                  <div className="relative shrink-0 w-11 h-11 rounded-lg overflow-hidden bg-white border border-[var(--color-soft-peach)]">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="44px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="text-lg select-none" aria-hidden="true">🎂</span>
                      </div>
                    )}
                  </div>

                  {/* Name + qty */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[var(--color-dark)] line-clamp-1 leading-tight">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-[var(--color-text-secondary)]">
                      × {item.quantity}
                    </p>
                  </div>

                  {/* Item total */}
                  <span className="shrink-0 text-xs font-semibold text-[var(--color-dark)] tabular-nums">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="h-px bg-[var(--color-soft-peach)] mb-4" />

            {/* Total */}
            <div className="flex items-baseline justify-between mb-6">
              <span className="font-heading font-semibold text-[var(--color-dark)] text-sm">
                Итого
              </span>
              <span className="font-heading font-bold text-2xl text-[var(--color-dusty-rose)] tabular-nums">
                {formatPrice(totalPrice)}
              </span>
            </div>

            {/* Submit error */}
            <AnimatePresence>
              {submitError && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600"
                >
                  <AlertCircle size={13} className="shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit button */}
            <Button
              type="submit"
              size="lg"
              variant="default"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Оформляем...
                </>
              ) : (
                'Оформить заказ'
              )}
            </Button>

            <p className="mt-3 text-center text-xs text-[var(--color-text-secondary)]">
              Оплата при получении
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}
