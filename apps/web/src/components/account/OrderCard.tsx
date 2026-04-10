'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Package, Cake } from 'lucide-react';
import { Chip } from '@heroui/react';
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

type ChipColor = 'accent' | 'danger' | 'default' | 'success' | 'warning';

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: ChipColor }
> = {
  created:   { label: 'Новый',     color: 'accent' },
  accepted:  { label: 'Принят',    color: 'accent' },
  preparing: { label: 'Готовится', color: 'warning' },
  ready:     { label: 'Готов',     color: 'success' },
  picked_up: { label: 'Забран',    color: 'default' },
  completed: { label: 'Завершён',  color: 'success' },
  cancelled: { label: 'Отменён',   color: 'danger' },
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
      <Chip size="sm" color="default" variant="secondary" className="mt-0.5 shrink-0">Товар</Chip>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[var(--color-dark)] leading-snug">{item.name}</p>
        <p className="text-xs text-neutral-400 mt-0.5">
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
      <Chip size="sm" color="accent" variant="secondary" className="mt-0.5 shrink-0">Конструктор</Chip>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <Cake size={13} className="text-[var(--color-dusty-rose)] shrink-0" />
          <p className="text-sm font-medium text-[var(--color-dark)]">Собранный торт</p>
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
    <div className="bg-white rounded-2xl border border-neutral-100 p-5 mb-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="font-semibold text-[var(--color-dark)]">
            Заказ #{displayNumber}
          </span>
          <p className="text-sm text-neutral-500 mt-1">{formatDate(order.createdAt)}</p>
          <p className="text-lg font-semibold text-[var(--color-dusty-rose)] mt-2">
            {formatPrice(order.totalPrice)}
          </p>
        </div>
        <Chip size="sm" color={statusCfg.color} variant="soft">
          {statusCfg.label}
        </Chip>
      </div>

      {/* Expand toggle */}
      {order.items.length > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-4 flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 transition-colors focus:outline-none"
          aria-expanded={expanded}
        >
          Подробнее
          <ChevronDown
            size={15}
            className={cn('transition-transform duration-200', expanded && 'rotate-180')}
          />
        </button>
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
              <div className="mt-3 flex justify-end border-t border-neutral-100 pt-3">
                <span className="text-sm text-neutral-500">
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
