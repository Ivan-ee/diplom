'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, Clock, MessageSquare, Phone, Loader2, AlertCircle, ShoppingBag, ChevronLeft, ChevronRight, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/stores/cart-store';
import { useAuthStore } from '@/stores/auth-store';
import { fetchClient } from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';
import type { CartItem } from '@/stores/cart-store';

// ── cakeConfig → API DTO adapter ─────────────────────────────────────────────

function cakeConfigToDto(cakeConfig: NonNullable<CartItem['cakeConfig']>) {
  const decorationCounts: Record<string, number> = {};
  for (const d of cakeConfig.decorations) {
    decorationCounts[d.decorationId] = (decorationCounts[d.decorationId] ?? 0) + 1;
  }
  const decorations = Object.entries(decorationCounts).map(([decorationId, quantity]) => ({
    decorationId,
    quantity,
  }));

  return {
    shape: cakeConfig.shape,
    tiers: cakeConfig.layers.map((l) => ({
      baseId: l.baseId,
      fillingId: l.fillingId,
      weight: Math.round(l.weight / 100),
    })),
    coatingId: cakeConfig.coating.coatingId,
    ...(decorations.length > 0 && { decorations }),
    ...(cakeConfig.inscription && { inscription: cakeConfig.inscription }),
  };
}

// ── Validation schema ────────────────────────────────────────────────────────

function getTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0] as string;
}

const checkoutSchema = z.object({
  phone: z
    .string()
    .min(11, 'Введите номер телефона')
    .regex(/^\+7\d{10}$/, 'Неверный формат номера'),
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
      return new Date(val).getDay() !== 0;
    }, 'Мы не работаем по воскресеньям'),
  timeSlot: z.enum(['morning', 'day', 'evening'], {
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
  { id: 'day', label: 'День', sub: '12:00 — 16:00' },
  { id: 'evening', label: 'Вечер', sub: '16:00 — 19:00' },
];

// ── Phone formatter ──────────────────────────────────────────────────────────

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  const d = digits.startsWith('7') ? digits : '7' + digits;
  let formatted = '+7';
  if (d.length > 1) formatted += ` (${d.slice(1, 4)}`;
  if (d.length > 4) formatted += `) ${d.slice(4, 7)}`;
  if (d.length > 7) formatted += `-${d.slice(7, 9)}`;
  if (d.length > 9) formatted += `-${d.slice(9, 11)}`;
  return formatted;
}

// ── Shared input className ───────────────────────────────────────────────────

const inputClass = (hasError: boolean) =>
  cn(
    'w-full border rounded-[var(--radius-control)] px-4 py-3 text-sm text-[var(--color-graphite)] bg-[var(--surface-elevated)] outline-none transition-colors duration-150',
    'focus:ring-1',
    hasError
      ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
      : 'border-[var(--border-default)] focus:border-[var(--color-caramel)] focus:ring-[var(--color-caramel)]/30'
  );

// ── CalendarPicker ───────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

interface CalendarPickerProps {
  value: string; // 'YYYY-MM-DD' or ''
  onChange: (date: string) => void;
  minDate: Date; // tomorrow
  isDateDisabled?: (date: Date) => boolean; // sundays
  error?: string;
}

function CalendarPicker({ value, onChange, minDate, isDateDisabled, error }: CalendarPickerProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const minDateNormalized = new Date(minDate);
  minDateNormalized.setHours(0, 0, 0, 0);

  const initialViewDate = value ? new Date(value + 'T00:00:00') : minDateNormalized;

  const [viewYear, setViewYear] = useState(initialViewDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialViewDate.getMonth());

  const minYear = minDateNormalized.getFullYear();
  const minMonth = minDateNormalized.getMonth();

  const isPrevDisabled = viewYear === minYear && viewMonth === minMonth;

  function handlePrev() {
    if (isPrevDisabled) return;
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function handleNext() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  // Build grid: weeks start on Monday (ISO)
  // First day of the month
  const firstDay = new Date(viewYear, viewMonth, 1);
  // getDay(): 0=Sun,1=Mon,...,6=Sat — convert to Mon-based index
  const firstDow = (firstDay.getDay() + 6) % 7; // 0=Mon … 6=Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // Build cell array: nulls for padding + day numbers
  const cells: (number | null)[] = [
    ...Array<null>(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function isDisabled(day: number): boolean {
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(0, 0, 0, 0);
    if (d < minDateNormalized) return true;
    if (isDateDisabled?.(d)) return true;
    return false;
  }

  function isToday(day: number): boolean {
    const d = new Date(viewYear, viewMonth, day);
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  }

  function isSelected(day: number): boolean {
    if (!value) return false;
    const [y, m, d] = value.split('-').map(Number);
    return y === viewYear && (m as number) - 1 === viewMonth && d === day;
  }

  function handleDayClick(day: number) {
    if (isDisabled(day)) return;
    const yyyy = viewYear;
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
  }

  return (
    <div className="bg-[var(--surface-elevated)] rounded-[var(--radius-card)] border border-[var(--border-default)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)]">
        <button
          type="button"
          onClick={handlePrev}
          disabled={isPrevDisabled}
          aria-label="Предыдущий месяц"
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-graphite-light)] transition-colors duration-150',
            isPrevDisabled
              ? 'opacity-30 cursor-not-allowed'
              : 'hover:bg-[var(--color-champagne)] cursor-pointer'
          )}
        >
          <ChevronLeft size={16} />
        </button>

        <span className="text-sm font-semibold text-[var(--color-graphite)] capitalize select-none">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>

        <button
          type="button"
          onClick={handleNext}
          aria-label="Следующий месяц"
          className="w-8 h-8 rounded-full hover:bg-[var(--color-champagne)] flex items-center justify-center text-[var(--color-graphite-light)] transition-colors duration-150 cursor-pointer"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 px-2 pt-2">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="text-center text-xs font-medium text-[var(--color-graphite-light)] py-2">
            {label}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 px-2 pb-2 gap-y-1">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} />;
          }

          const disabled = isDisabled(day);
          const selected = isSelected(day);
          const todayCell = isToday(day);

          return (
            <button
              key={day}
              type="button"
              onClick={() => handleDayClick(day)}
              disabled={disabled}
              aria-label={`${day} ${MONTH_NAMES[viewMonth]} ${viewYear}`}
              aria-pressed={selected}
              className={cn(
                'w-full aspect-square flex items-center justify-center text-sm rounded-lg transition-colors duration-150',
                selected
                  ? 'bg-[var(--color-caramel)] text-white font-semibold cursor-pointer'
                  : disabled
                    ? cn(
                        'cursor-not-allowed hover:bg-transparent',
                        todayCell ? 'text-[var(--color-graphite-light)] font-medium' : 'text-[var(--color-soft-oat)]'
                      )
                    : 'text-[var(--color-graphite)] hover:bg-[var(--color-caramel)]/10 cursor-pointer'
              )}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="px-4 pb-3 text-red-500 text-xs flex items-center gap-1"
          >
            <AlertCircle size={11} />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── OrderSummary component ───────────────────────────────────────────────────

interface PromoResult {
  valid: boolean;
  code: string;
  discountType?: string;
  discountValue?: number;
  discountAmount: number;
  message?: string;
}

interface OrderSummaryProps {
  items: CartItem[];
  totalPrice: number;
  isSubmitting: boolean;
  submitError: string | null;
  promoResult: PromoResult | null;
}

function OrderSummary({ items, totalPrice, isSubmitting, submitError, promoResult }: OrderSummaryProps) {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const itemWord =
    totalItems === 1
      ? 'товар'
      : totalItems >= 2 && totalItems <= 4
        ? 'товара'
        : 'товаров';

  return (
    <div className="sticky lg:top-24 bg-[var(--surface-secondary)] rounded-[var(--radius-card)] border border-[var(--border-default)] p-6">
      <h2 className="font-heading font-semibold text-[var(--color-graphite)] text-base mb-4 flex items-center gap-2">
        <ShoppingBag size={17} className="text-[var(--color-caramel)]" />
        Ваш заказ ({totalItems}&nbsp;{itemWord})
      </h2>

      <div className="flex flex-col gap-3 mb-5">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <div className="relative shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-[var(--surface-elevated)] border border-[var(--border-default)]">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[var(--color-soft-oat)] text-lg" aria-hidden="true">
                  &#9728;
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[var(--color-graphite)] line-clamp-1 leading-tight">
                {item.name}
              </p>
              <p className="text-[11px] text-[var(--color-graphite-light)]">
                × {item.quantity}
              </p>
            </div>

            <span className="shrink-0 text-xs font-semibold text-[var(--color-graphite)] tabular-nums">
              {formatPrice(item.price * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col">
        {promoResult ? (
          <>
            <div className="flex justify-between py-2">
              <span className="text-sm text-[var(--color-graphite-light)]">Подытог</span>
              <span className="text-sm font-medium text-[var(--color-graphite)] tabular-nums">
                {formatPrice(totalPrice)}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-[var(--color-graphite-light)]">
                Скидка ({promoResult.code})
              </span>
              <span className="text-sm font-medium text-emerald-600 tabular-nums">
                −{formatPrice(promoResult.discountAmount)}
              </span>
            </div>
            <div className="flex justify-between py-3 border-t border-[var(--border-default)]">
              <span className="text-sm text-[var(--color-graphite-light)]">Итого к оплате</span>
              <span className="font-heading font-bold text-2xl text-[var(--color-caramel)] tabular-nums">
                {formatPrice(totalPrice - promoResult.discountAmount)}
              </span>
            </div>
          </>
        ) : (
          <div className="flex justify-between py-3 border-b border-[var(--border-default)]">
            <span className="text-sm text-[var(--color-graphite-light)]">Итого</span>
            <span className="font-heading font-bold text-2xl text-[var(--color-caramel)] tabular-nums">
              {formatPrice(totalPrice)}
            </span>
          </div>
        )}
      </div>

      <AnimatePresence>
        {submitError && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600"
          >
            <AlertCircle size={13} className="shrink-0 mt-0.5" />
            <span>{submitError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 bg-[var(--color-caramel)] hover:bg-[var(--color-caramel-hover)] disabled:opacity-60 text-white rounded-[var(--radius-control)] h-14 text-base font-semibold mt-6 transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Оформляем...
          </>
        ) : (
          'Оформить заказ'
        )}
      </button>

      <p className="mt-3 text-center text-xs text-[var(--color-graphite-light)]">
        Оплата при получении
      </p>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export function CheckoutForm() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const totalPrice = useCartStore((s) => s.getTotalPrice());
  const clearCart = useCartStore((s) => s.clearCart);

  const [submitError, setSubmitError] = useState<string | null>(null);

  const [promoCode, setPromoCode] = useState('');
  const [promoResult, setPromoResult] = useState<PromoResult | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  const user = useAuthStore((s) => s.user);

  const {
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      phone: '',
      pickupDate: '',
      comment: '',
    },
  });

  const commentValue = watch('comment') ?? '';
  const pickupDateValue = watch('pickupDate') ?? '';

  useEffect(() => {
    if (user?.phone) {
      setValue('phone', user.phone, { shouldValidate: false });
    }
  }, [user?.phone, setValue]);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError(null);
    try {
      const res = await fetchClient<PromoResult>('/promo-codes/validate', {
        method: 'POST',
        body: JSON.stringify({
          code: promoCode.trim().toUpperCase(),
          cartTotal: totalPrice,
        }),
      });
      if (res.data?.valid) {
        setPromoResult(res.data);
        setPromoError(null);
      } else {
        setPromoResult(null);
        setPromoError(res.data?.message ?? 'Промокод недействителен');
      }
    } catch {
      setPromoError('Не удалось проверить промокод');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setPromoResult(null);
    setPromoCode('');
    setPromoError(null);
  };

  async function onSubmit(data: CheckoutFormData) {
    setSubmitError(null);
    try {
      const payload = {
        phone: data.phone,
        pickupDate: data.pickupDate,
        pickupTimeSlot: data.timeSlot,
        comment: data.comment ?? '',
        ...(promoResult?.valid ? { promoCode: promoResult.code } : {}),
        items: items.map((item) => ({
          type: item.type,
          ...(item.type === 'product' && item.productId ? { productId: item.productId } : {}),
          ...(item.type === 'constructor' && item.cakeConfig
            ? { cakeConfig: cakeConfigToDto(item.cakeConfig) }
            : {}),
          weight: Math.round(item.weight / 100),
          quantity: item.quantity,
          ...(item.inscription ? { inscription: item.inscription } : {}),
          ...(item.type === 'constructor' && item.imageUrl && item.imageUrl.startsWith('http')
            ? { screenshotUrl: item.imageUrl }
            : {}),
        })),
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
      console.error('Order creation failed:', err);
      setSubmitError('Не удалось оформить заказ. Попробуйте ещё раз.');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 lg:gap-12 items-start">

        {/* Left column: form sections */}
        <div className="flex flex-col">

          {/* Section: Contact */}
          <section className="bg-[var(--surface-elevated)] rounded-[var(--radius-card)] border border-[var(--border-default)] p-6 mb-6">
            <h2 className="text-lg font-semibold text-[var(--color-graphite)] mb-4 flex items-center gap-2">
              <Phone size={17} className="text-[var(--color-caramel)]" />
              Контактная информация
            </h2>
            <div>
              <label className="block text-sm font-medium text-[var(--color-graphite)] mb-1.5">
                Телефон <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                placeholder="+7 (___) ___-__-__"
                value={watch('phone') ? formatPhone(watch('phone')) : ''}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  const normalized = raw.startsWith('7')
                    ? `+${raw.slice(0, 11)}`
                    : `+7${raw.slice(0, 10)}`;
                  setValue('phone', normalized, { shouldValidate: true });
                }}
                className={inputClass(!!errors.phone)}
              />
              <AnimatePresence>
                {errors.phone && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="mt-1 text-red-500 text-xs flex items-center gap-1"
                  >
                    <AlertCircle size={11} />
                    {errors.phone.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* Section: Address */}
          <section className="bg-[var(--surface-elevated)] rounded-[var(--radius-card)] border border-[var(--border-default)] p-6 mb-6">
            <h2 className="text-lg font-semibold text-[var(--color-graphite)] mb-4 flex items-center gap-2">
              <MapPin size={17} className="text-[var(--color-caramel)]" />
              Адрес получения
            </h2>
            <div className="flex items-start gap-3 p-4 bg-[var(--surface-secondary)] rounded-[var(--radius-control)] border border-[var(--border-default)]">
              <MapPin size={16} className="shrink-0 mt-0.5 text-[var(--color-caramel)]" />
              <div>
                <p className="text-sm font-semibold text-[var(--color-graphite)]">
                  г. Арзамас, ул. Ленина, д. 15
                </p>
                <p className="text-xs text-[var(--color-graphite-light)] mt-0.5">
                  Пн — Сб: 10:00 — 19:00 · Вс: выходной
                </p>
              </div>
            </div>
          </section>

          {/* Section: Date & time */}
          <section className="bg-[var(--surface-elevated)] rounded-[var(--radius-card)] border border-[var(--border-default)] p-6 mb-6">
            <h2 className="text-lg font-semibold text-[var(--color-graphite)] mb-4 flex items-center gap-2">
              <Clock size={17} className="text-[var(--color-caramel)]" />
              Дата и время получения
            </h2>

            {/* Date — CalendarPicker */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-[var(--color-graphite)] mb-1.5">
                Дата <span className="text-red-400">*</span>
              </label>
              <Controller
                name="pickupDate"
                control={control}
                render={({ field }) => (
                  <CalendarPicker
                    value={field.value}
                    onChange={field.onChange}
                    minDate={new Date(getTomorrow() + 'T00:00:00')}
                    isDateDisabled={(d) => d.getDay() === 0}
                    error={errors.pickupDate?.message}
                  />
                )}
              />
            </div>

            {/* Time slots */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-sm font-medium text-[var(--color-graphite)]">
                  Время <span className="text-red-400">*</span>
                </p>
                {!pickupDateValue && (
                  <span className="text-xs text-[var(--color-graphite-light)]">Сначала выберите дату</span>
                )}
              </div>
              <Controller
                name="timeSlot"
                control={control}
                render={({ field }) => (
                  <div className={cn(
                    'grid grid-cols-3 gap-3',
                    !pickupDateValue && 'opacity-50 pointer-events-none'
                  )}>
                    {TIME_SLOTS.map(({ id, label, sub }) => {
                      const isSelected = field.value === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => field.onChange(id)}
                          className={cn(
                            'relative flex flex-col items-center gap-1 p-3 rounded-[var(--radius-control)] border text-center cursor-pointer transition-all duration-200 ease-out',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-caramel)] focus-visible:ring-offset-2',
                            isSelected
                              ? 'border-[var(--color-caramel)] bg-[var(--color-caramel)]/5'
                              : 'border-[var(--border-default)] bg-[var(--surface-elevated)] hover:border-[var(--color-toffee)]'
                          )}
                        >
                          {isSelected && (
                            <div className="absolute inset-0 rounded-[10px] border-2 border-[var(--color-caramel)]" />
                          )}
                          <span
                            className={cn(
                              'relative z-10 text-sm font-semibold leading-tight',
                              isSelected ? 'text-[var(--color-caramel)]' : 'text-[var(--color-graphite)]'
                            )}
                          >
                            {label}
                          </span>
                          <span className="relative z-10 text-[10px] text-[var(--color-graphite-light)] leading-tight">
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
                    className="mt-2 text-red-500 text-xs flex items-center gap-1"
                  >
                    <AlertCircle size={11} />
                    {errors.timeSlot.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* Section: Promo code */}
          <section className="bg-[var(--surface-elevated)] rounded-[var(--radius-card)] border border-[var(--border-default)] p-6 mb-6">
            <h2 className="text-lg font-semibold text-[var(--color-graphite)] mb-4 flex items-center gap-2">
              <Tag size={17} className="text-[var(--color-caramel)]" />
              Промокод
            </h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value.toUpperCase());
                  setPromoError(null);
                }}
                placeholder="Введите промокод"
                className={inputClass(!!promoError)}
                disabled={!!promoResult}
                maxLength={50}
              />
              {promoResult ? (
                <button
                  type="button"
                  onClick={handleRemovePromo}
                  className="shrink-0 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
                >
                  Убрать
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  disabled={promoLoading || !promoCode.trim()}
                  className="shrink-0 rounded-xl bg-[var(--color-caramel)] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--color-caramel-dark)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {promoLoading ? <Loader2 size={16} className="animate-spin" /> : 'Применить'}
                </button>
              )}
            </div>

            <AnimatePresence>
              {promoResult && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="mt-3 text-sm font-medium text-emerald-600"
                >
                  Скидка: −{formatPrice(promoResult.discountAmount)}
                  {promoResult.discountType === 'percentage' && ` (${promoResult.discountValue}%)`}
                </motion.p>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {promoError && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="mt-3 flex items-center gap-1.5 text-sm text-red-500"
                >
                  <AlertCircle size={14} />
                  {promoError}
                </motion.p>
              )}
            </AnimatePresence>
          </section>

          {/* Section: Comment */}
          <section className="bg-[var(--surface-elevated)] rounded-[var(--radius-card)] border border-[var(--border-default)] p-6">
            <h2 className="text-lg font-semibold text-[var(--color-graphite)] mb-4 flex items-center gap-2">
              <MessageSquare size={17} className="text-[var(--color-caramel)]" />
              Комментарий к заказу
            </h2>
            <div className="relative">
              <Controller
                name="comment"
                control={control}
                render={({ field }) => (
                  <textarea
                    id="comment"
                    rows={4}
                    placeholder="Пожелания по упаковке, аллергии, особые требования..."
                    {...field}
                    className={cn(
                      inputClass(!!errors.comment),
                      'resize-none min-h-[100px] leading-relaxed placeholder:text-[var(--color-soft-oat)]'
                    )}
                  />
                )}
              />
              <p
                className={cn(
                  'absolute bottom-3 right-3 text-[11px] tabular-nums pointer-events-none transition-colors duration-150',
                  commentValue.length > 450
                    ? commentValue.length > 490
                      ? 'text-red-400'
                      : 'text-orange-400'
                    : 'text-[var(--color-soft-oat)]'
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
                  className="mt-1 text-red-500 text-xs flex items-center gap-1"
                >
                  <AlertCircle size={11} />
                  {errors.comment.message}
                </motion.p>
              )}
            </AnimatePresence>
          </section>
        </div>

        {/* Right column: order summary */}
        <div>
          <OrderSummary
            items={items}
            totalPrice={totalPrice}
            isSubmitting={isSubmitting}
            submitError={submitError}
            promoResult={promoResult}
          />
        </div>
      </div>
    </form>
  );
}
