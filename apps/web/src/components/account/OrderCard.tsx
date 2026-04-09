'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Package, Cake } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn, formatPrice } from '@/lib/utils';

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
    decorations?: string[];
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
}

// ---------- Status config ----------

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; badgeVariant: 'default' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'outline'; dotColor: string }
> = {
  created:   { label: 'Новый',         badgeVariant: 'secondary', dotColor: 'bg-gray-400' },
  accepted:  { label: 'Принят',        badgeVariant: 'info',      dotColor: 'bg-blue-400' },
  preparing: { label: 'Готовится',     badgeVariant: 'warning',   dotColor: 'bg-orange-400' },
  ready:     { label: 'Готов',         badgeVariant: 'success',   dotColor: 'bg-emerald-400' },
  picked_up: { label: 'Забран',        badgeVariant: 'default',   dotColor: 'bg-[var(--color-dusty-rose)]' },
  completed: { label: 'Завершён',      badgeVariant: 'success',   dotColor: 'bg-emerald-400' },
  cancelled: { label: 'Отменён',       badgeVariant: 'error',     dotColor: 'bg-red-400' },
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

// ---------- Sub-components ----------

function ProductItemRow({ item }: { item: OrderItemProduct }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Badge variant="secondary" className="mt-0.5 shrink-0 text-xs">Товар</Badge>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[var(--color-dark)] leading-snug">{item.name}</p>
        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
          {`${parseFloat(String(item.weight)).toLocaleString('ru-RU')} кг`}
          {item.quantity > 1 && ` × ${item.quantity}`}
        </p>
      </div>
      <span className="shrink-0 text-sm font-semibold text-[var(--color-dusty-rose)]">
        {formatPrice(item.price * item.quantity)}
      </span>
    </div>
  );
}

function ConstructorItemRow({ item }: { item: OrderItemConstructor }) {
  const cfg = item.cakeConfig;
  return (
    <div className="flex items-start gap-3 py-2">
      <Badge variant="default" className="mt-0.5 shrink-0 text-xs">Конструктор</Badge>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <Cake size={13} className="text-[var(--color-dusty-rose)] shrink-0" />
          <p className="text-sm font-medium text-[var(--color-dark)]">Собранный торт</p>
        </div>
        {cfg && (
          <ul className="mt-1.5 space-y-0.5 text-xs text-[var(--color-text-secondary)]">
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
            {cfg.decorations && cfg.decorations.length > 0 && (
              <li>Декор: {cfg.decorations.join(', ')}</li>
            )}
          </ul>
        )}
      </div>
      <span className="shrink-0 text-sm font-semibold text-[var(--color-dusty-rose)]">
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

  const statusCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.created;
  const displayNumber = order.orderNumber ?? order.id.slice(0, 8).toUpperCase();

  return (
    <div className="rounded-xl border border-[var(--color-soft-peach)]/60 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
      {/* Collapsed header — always visible */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dusty-rose)] focus-visible:ring-inset rounded-xl"
        aria-expanded={expanded}
      >
        {/* Order icon */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-cream)]">
          <Package size={16} className="text-[var(--color-dusty-rose)]" />
        </div>

        {/* Order meta */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-heading text-sm font-semibold text-[var(--color-dark)]">
              Заказ #{displayNumber}
            </span>
            <span className="text-xs text-[var(--color-text-secondary)]">
              {formatDate(order.createdAt)}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-[var(--color-dusty-rose)]">
              {formatPrice(order.totalPrice)}
            </span>
            <span className="text-xs text-[var(--color-text-secondary)]">
              · {order.items.length} {order.items.length === 1 ? 'позиция' : order.items.length < 5 ? 'позиции' : 'позиций'}
            </span>
          </div>
        </div>

        {/* Status badge */}
        <div className="flex shrink-0 items-center gap-3">
          <Badge variant={statusCfg.badgeVariant} className="hidden sm:inline-flex">
            <span className={cn('h-1.5 w-1.5 rounded-full', statusCfg.dotColor)} />
            {statusCfg.label}
          </Badge>
          <ChevronDown
            size={16}
            className={cn(
              'text-[var(--color-text-secondary)] transition-transform duration-200',
              expanded && 'rotate-180'
            )}
          />
        </div>
      </button>

      {/* Mobile status badge */}
      <div className="px-5 pb-3 sm:hidden">
        <Badge variant={statusCfg.badgeVariant}>
          <span className={cn('h-1.5 w-1.5 rounded-full', statusCfg.dotColor)} />
          {statusCfg.label}
        </Badge>
      </div>

      {/* Expandable items list */}
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
            <div className="border-t border-[var(--color-soft-peach)]/60 px-5 pb-4">
              <div className="divide-y divide-[var(--color-cream)]">
                {order.items.map((item, idx) =>
                  item.type === 'product' ? (
                    <ProductItemRow key={idx} item={item as OrderItemProduct} />
                  ) : (
                    <ConstructorItemRow key={idx} item={item as OrderItemConstructor} />
                  )
                )}
              </div>
              <div className="mt-3 flex justify-end border-t border-[var(--color-soft-peach)]/60 pt-3">
                <span className="text-sm text-[var(--color-text-secondary)]">
                  Итого:&nbsp;
                  <span className="font-heading font-bold text-[var(--color-dark)]">
                    {formatPrice(order.totalPrice)}
                  </span>
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
