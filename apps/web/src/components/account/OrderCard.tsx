'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Cake, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { cn, formatPrice } from '@/lib/utils';
import { useCartStore } from '@/stores/cart-store';

// ---------- Types ----------

export type OrderStatus =
  | 'created'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'completed'
  | 'cancelled';

export interface OrderItemProduct {
  type: 'product';
  productId: string;
  name: string;
  imageUrl?: string;
  weight: number;
  price: number;
  quantity: number;
}

export interface OrderItemConstructor {
  type: 'constructor';
  name: string;
  price: number;
  quantity: number;
  cakeConfig?: {
    shape?: string;
    tierCount?: number;
    layers?: Array<{ baseName?: string; fillingName?: string; weight: number }>;
    coatingName?: string;
    inscription?: string;
    decorations?: Array<string | { decorationId: string; name?: string; quantity: number }>;
    decorVariant?: string | null;
    hasCandle?: boolean;
  };
}

export type OrderItem = OrderItemProduct | OrderItemConstructor;

export interface Order {
  id: string;
  orderNumber?: string | number;
  createdAt: string;
  totalPrice: number;
  status: OrderStatus;
  items: OrderItem[];
  customerName?: string;
  customerPhone?: string;
  pickupDate?: string;
  pickupTimeSlot?: string;
  comment?: string;
  phone?: string;
  promoCode?: string | null;
  discountAmount?: number | null;
  originalPrice?: number | null;
}

// ---------- Status config ----------

type BadgeTone = 'accent' | 'danger' | 'default' | 'success' | 'warning';

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: BadgeTone }
> = {
  created:   { label: 'Новый',     color: 'accent' },
  accepted:  { label: 'Принят',    color: 'accent' },
  preparing: { label: 'Готовится', color: 'warning' },
  ready:     { label: 'Готов',     color: 'success' },
  picked_up: { label: 'Забран',    color: 'default' },
  completed: { label: 'Завершён',  color: 'success' },
  cancelled: { label: 'Отменён',   color: 'danger' },
};

const STATUS_BADGE_CLASS: Record<BadgeTone, string> = {
  accent: 'border-[var(--color-caramel)]/20 bg-[var(--color-caramel)]/10 text-[var(--color-caramel)]',
  danger: 'border-red-500/20 bg-red-50 text-red-600',
  default: 'border-neutral-200 bg-neutral-50 text-neutral-500',
  success: 'border-emerald-500/20 bg-emerald-50 text-emerald-600',
  warning: 'border-amber-500/20 bg-amber-50 text-amber-600',
};

// ---------- Helpers ----------

function formatDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

const SHAPE_LABELS: Record<string, string> = {
  circle: 'Круглый',
  square: 'Квадратный',
  heart:  'Сердце',
};

function formatDecoration(value: string | { decorationId: string; name?: string; quantity: number }): string {
  if (typeof value === 'string') return value;

  const label = value.name ?? `#${value.decorationId.slice(0, 8)}`;
  return value.quantity > 1 ? `${label} × ${value.quantity}` : label;
}

// ---------- Sub-components ----------

function ProductItemRow({ item }: { item: OrderItemProduct }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="relative shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-[var(--surface-secondary)] border border-[var(--border-default)]">
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="48px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[var(--color-soft-oat)] text-lg" aria-hidden="true">~</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[var(--color-graphite)] leading-snug">{item.name}</p>
        <p className="text-xs text-neutral-400 mt-0.5">
          {parseFloat(String(item.weight)) > 0
            ? `${parseFloat(String(item.weight)).toLocaleString('ru-RU')} кг${item.quantity > 1 ? ` × ${item.quantity}` : ''}`
            : `${item.quantity} шт.`}
        </p>
      </div>
      <span className="shrink-0 text-sm font-semibold text-[var(--color-caramel)]">
        {formatPrice(item.price * item.quantity)}
      </span>
    </div>
  );
}

function ConstructorItemRow({ item }: { item: OrderItemConstructor }) {
  const cfg = item.cakeConfig;
  const decorationLabels = cfg?.decorations?.map(formatDecoration) ?? [];
  if (cfg?.hasCandle) decorationLabels.push('свеча');

  return (
    <div className="flex items-start gap-3 py-2">
      <span className="mt-0.5 inline-flex h-5 shrink-0 items-center rounded-full border border-[var(--color-caramel)]/20 bg-[var(--color-caramel)]/10 px-2 text-[10px] font-medium text-[var(--color-caramel)]">
        Конструктор
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <Cake size={13} className="text-[var(--color-caramel)] shrink-0" />
          <p className="text-sm font-medium text-[var(--color-graphite)]">Собранный торт</p>
        </div>
        {cfg && (
          <ul className="mt-1.5 space-y-0.5 text-xs text-neutral-400">
            {cfg.shape && (
              <li>Форма: {SHAPE_LABELS[cfg.shape] ?? cfg.shape}</li>
            )}
            {cfg.tierCount != null && cfg.tierCount > 1 && (
              <li>Ярусов: {cfg.tierCount}</li>
            )}
            {cfg.layers?.map((l, i) => (
              <li key={i}>
                Ярус {i + 1}: {l.baseName ?? '—'}
                {l.fillingName ? ` / ${l.fillingName}` : ''}
                {` (${parseFloat(String(l.weight)).toLocaleString('ru-RU')} кг)`}
              </li>
            ))}
            {cfg.coatingName && <li>Покрытие: {cfg.coatingName}</li>}
            {cfg.inscription && <li>Надпись: «{cfg.inscription}»</li>}
            {cfg.decorVariant ? (
              <li>Декор: {cfg.decorVariant}{cfg.hasCandle ? ', свеча' : ''}</li>
            ) : decorationLabels.length > 0 ? (
              <li>Декор: {decorationLabels.join(', ')}</li>
            ) : null}
          </ul>
        )}
      </div>
      <span className="shrink-0 text-sm font-semibold text-[var(--color-caramel)]">
        {formatPrice(item.price)}
      </span>
    </div>
  );
}

// ---------- Main Component ----------

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  const [expanded, setExpanded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const statusCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.created;
  const displayNumber = order.orderNumber ?? order.id.slice(0, 8).toUpperCase();

  function handleReorder() {
    const catalogItems = order.items.filter(
      (item): item is OrderItemProduct => item.type === 'product'
    );

    if (catalogItems.length === 0) {
      toast('Собранные торты нельзя повторить — соберите заново в конструкторе');
      return;
    }

    catalogItems.forEach((item) => {
      addItem({
        type: 'product',
        productId: item.productId,
        name: item.name,
        imageUrl: item.imageUrl ?? '',
        weight: item.weight,
        price: item.price,
        quantity: item.quantity ?? 1,
        priceType: 'per_kg',
        pricePerKg: item.weight > 0
          ? Math.round(item.price / (item.weight / 1000))
          : undefined,
      });
    });

    const count = catalogItems.length;
    toast(count === 1 ? 'Товар добавлен в корзину' : 'Товары добавлены в корзину');
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-5 mb-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="font-semibold text-[var(--color-graphite)]">
            Заказ #{displayNumber}
          </span>
          <p className="text-sm text-neutral-500 mt-1">{formatDate(order.createdAt)}</p>
          <p className="text-lg font-semibold text-[var(--color-caramel)] mt-2">
            {formatPrice(order.totalPrice)}
            {order.originalPrice != null && order.discountAmount != null && (
              <span className="ml-2 text-sm font-normal text-neutral-400 line-through">
                {formatPrice(order.originalPrice)}
              </span>
            )}
          </p>
        </div>
        <span
          className={cn(
            'inline-flex h-6 shrink-0 items-center rounded-full border px-2.5 text-xs font-medium',
            STATUS_BADGE_CLASS[statusCfg.color],
          )}
        >
          {statusCfg.label}
        </span>
      </div>

      {/* Expand toggle + Reorder */}
      {order.items.length > 0 && (
        <div className="mt-4 flex items-center gap-4">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 transition-colors focus:outline-none"
            aria-expanded={expanded}
          >
            Подробнее
            <ChevronDown
              size={15}
              className={cn('transition-transform duration-200', expanded && 'rotate-180')}
            />
          </button>

          <button
            type="button"
            onClick={handleReorder}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-caramel)] hover:text-[var(--color-caramel-hover)] transition-colors focus:outline-none"
          >
            <RefreshCw size={14} />
            Заказать снова
          </button>
        </div>
      )}

      {/* Expandable items */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="order-items"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-neutral-100 mt-4 pt-2">
              <div className="divide-y divide-neutral-50">
                {order.items.map((item, idx) =>
                  item.type === 'product' ? (
                    <ProductItemRow key={idx} item={item as OrderItemProduct} />
                  ) : (
                    <ConstructorItemRow key={idx} item={item as OrderItemConstructor} />
                  )
                )}
              </div>
              <div className="mt-3 flex flex-col gap-1.5 border-t border-neutral-100 pt-3">
                {order.originalPrice != null && order.discountAmount != null ? (
                  <>
                    <div className="flex justify-between text-sm text-neutral-500">
                      <span>Подытог</span>
                      <span>{formatPrice(order.originalPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-emerald-600">
                      <span>Промокод {order.promoCode && <span className="font-mono text-xs">({order.promoCode})</span>}</span>
                      <span>−{formatPrice(order.discountAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-500">Итого</span>
                      <span className="font-heading font-bold text-[var(--color-graphite)]">
                        {formatPrice(order.totalPrice)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-end">
                    <span className="text-sm text-neutral-500">
                      Итого:&nbsp;
                      <span className="font-heading font-bold text-[var(--color-graphite)]">
                        {formatPrice(order.totalPrice)}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
