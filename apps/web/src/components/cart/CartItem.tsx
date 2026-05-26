'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore, type CartItem as CartItemType } from '@/stores/cart-store';
import { formatPrice, cn } from '@/lib/utils';

interface CartItemProps {
  item: CartItemType;
  isUnavailable?: boolean;
}

function ConstructorConfigSummary({ config }: { config: unknown }) {
  if (!config || typeof config !== 'object') return null;
  const c = config as Record<string, unknown>;

  const parts: string[] = [];
  if (typeof c.shape === 'string') {
    const shapeMap: Record<string, string> = {
      circle: 'Круглый',
      square: 'Квадратный',
      heart: 'Сердце',
    };
    parts.push(shapeMap[c.shape] ?? c.shape);
  }
  if (typeof c.tierCount === 'number') {
    parts.push(`${c.tierCount} ярус${c.tierCount > 1 ? (c.tierCount === 2 ? 'а' : 'ов') : ''}`);
  }
  if (Array.isArray(c.layers)) {
    const layerNames = c.layers
      .map((layer, index) => {
        if (!layer || typeof layer !== 'object') return null;
        const row = layer as Record<string, unknown>;
        const base = typeof row.baseName === 'string' ? row.baseName : undefined;
        const filling = typeof row.fillingName === 'string' ? row.fillingName : undefined;
        if (!base && !filling) return null;
        return `${index + 1}: ${[base, filling].filter(Boolean).join(' / ')}`;
      })
      .filter(Boolean);
    if (layerNames.length > 0) parts.push(layerNames.join('; '));
  }
  if (c.coating && typeof c.coating === 'object') {
    const coating = c.coating as Record<string, unknown>;
    if (typeof coating.coatingName === 'string') parts.push(coating.coatingName);
  } else if (typeof c.coating === 'string' && c.coating) {
    parts.push(c.coating);
  }
  if (Array.isArray(c.selectedDecorations) && c.selectedDecorations.length > 0) {
    const decor = c.selectedDecorations
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const row = item as Record<string, unknown>;
        const name = typeof row.name === 'string' ? row.name : undefined;
        const quantity = typeof row.quantity === 'number' ? row.quantity : 1;
        return name ? `${name} x${quantity}` : null;
      })
      .filter(Boolean);
    if (decor.length > 0) parts.push(decor.join(', '));
  }
  if (typeof c.inscription === 'string' && c.inscription) {
    parts.push(`"${c.inscription}"`);
  }

  if (parts.length === 0) return null;

  return (
    <p className="text-sm text-[var(--color-graphite-light)] mt-1 line-clamp-2">
      {parts.join(' · ')}
    </p>
  );
}

export function CartItem({ item, isUnavailable = false }: CartItemProps) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const updateWeight = useCartStore((s) => s.updateWeight);
  const removeItem = useCartStore((s) => s.removeItem);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isConstructor = item.type === 'constructor';
  const isPerKg = item.type === 'product' && (item.priceType === 'per_kg' || (!item.priceType && !item.pricePerUnit));
  const itemTotal = item.price * item.quantity;

  function handleDecrement() {
    updateQuantity(item.id, item.quantity - 1);
  }

  function handleIncrement() {
    updateQuantity(item.id, item.quantity + 1);
  }

  function handleDeleteClick() {
    if (isConstructor && !confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    removeItem(item.id);
  }

  function handleCancelDelete() {
    setConfirmDelete(false);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -24, transition: { duration: 0.2 } }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn(
        'bg-white rounded-2xl border border-[var(--color-champagne)] p-4 lg:p-6 transition-opacity duration-200',
        isUnavailable && 'opacity-50',
      )}
    >
      <div className="flex items-start gap-4">
        {/* Image */}
        <div className="relative shrink-0 w-24 h-24 lg:w-28 lg:h-28 rounded-[var(--radius-control)] overflow-hidden bg-[var(--color-warm-ivory)] flex-shrink-0">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 112px, 96px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-3xl select-none text-[var(--color-soft-oat)]" aria-hidden="true">
                &#9728;
              </span>
            </div>
          )}
          {isUnavailable && (
            <div className="absolute inset-0 flex items-center justify-center rounded-[var(--radius-control)] bg-white/70">
              <span className="rounded-full bg-[var(--color-error,#ef4444)] px-2 py-0.5 text-[10px] font-medium text-white">
                Нет в наличии
              </span>
            </div>
          )}
        </div>

        {/* Info + controls */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          {/* Top: name + badge + delete */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-medium text-[var(--color-graphite)] leading-tight line-clamp-2">
                  {item.name}
                </h3>
                {isConstructor && (
                  <span className="inline-flex h-5 shrink-0 items-center rounded-full border border-[var(--color-caramel)]/20 bg-[var(--color-caramel)]/10 px-2 text-[10px] font-medium text-[var(--color-caramel)]">
                    Собранный торт
                  </span>
                )}
              </div>

              {/* Weight */}
              <p className="text-sm text-[var(--color-graphite-light)] mt-1">
                {item.weight >= 1000
                  ? `${(item.weight / 1000).toLocaleString('ru-RU')} кг`
                  : `${item.weight} г`}
              </p>

              {/* Constructor config summary */}
              {isConstructor && item.cakeConfig && (
                <ConstructorConfigSummary config={item.cakeConfig} />
              )}
            </div>

            {/* Delete button */}
            <div className="shrink-0">
              <AnimatePresence mode="wait">
                {confirmDelete ? (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center gap-1"
                  >
                    <button
                      onClick={handleCancelDelete}
                      className="text-xs text-[var(--color-graphite-light)]/60 hover:text-[var(--color-graphite-light)] px-2 py-1 rounded-md transition-colors duration-150 cursor-pointer"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleDeleteClick}
                      className="text-xs font-semibold text-red-500 hover:text-red-600 px-2 py-1 rounded-md transition-colors duration-150 cursor-pointer"
                    >
                      Удалить
                    </button>
                  </motion.div>
                ) : (
                  <motion.button
                    key="trash"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleDeleteClick}
                    aria-label="Удалить из корзины"
                    className="p-1.5 rounded-lg text-[var(--color-soft-oat)] hover:text-red-400 transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                  >
                    <Trash2 size={15} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom: stepper + price */}
          <div className="flex items-center justify-between gap-4">
            {isPerKg ? (
              /* Weight stepper for per_kg products */
              (() => {
                const step = item.weightStep ?? 500;
                const minW = item.minWeight ?? 0;
                const maxW = item.maxWeight;
                const atMax = maxW !== undefined && item.weight + step > maxW;

                return (
                  <div className="flex items-center gap-3 bg-[var(--color-champagne)]/40 rounded-full p-1">
                    <button
                      onClick={() => {
                        if (item.weight - step >= minW) {
                          updateWeight(item.productId!, item.weight - step);
                        } else {
                          removeItem(item.id);
                        }
                      }}
                      disabled={isUnavailable}
                      aria-label="Уменьшить вес"
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-150',
                        isUnavailable
                          ? 'opacity-30 cursor-not-allowed text-[var(--color-graphite-light)]'
                          : 'cursor-pointer text-[var(--color-graphite-light)] hover:bg-[var(--color-champagne)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-caramel)] focus-visible:ring-offset-1'
                      )}
                    >
                      <Minus size={13} />
                    </button>

                    <span className="text-sm font-medium min-w-[4rem] text-center select-none tabular-nums text-[var(--color-graphite)]">
                      {(item.weight / 1000).toLocaleString('ru-RU')} кг
                    </span>

                    <button
                      onClick={() => {
                        if (!atMax) updateWeight(item.productId!, item.weight + step);
                      }}
                      disabled={isUnavailable || atMax}
                      aria-label="Увеличить вес"
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-150',
                        isUnavailable || atMax
                          ? 'opacity-30 cursor-not-allowed text-[var(--color-graphite-light)]'
                          : 'cursor-pointer text-[var(--color-graphite-light)] hover:bg-[var(--color-champagne)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-caramel)] focus-visible:ring-offset-1'
                      )}
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                );
              })()
            ) : (
              /* Quantity stepper for per_unit and constructor */
              <div className="flex items-center gap-3 bg-[var(--color-champagne)]/40 rounded-full p-1">
                <button
                  onClick={handleDecrement}
                  disabled={item.quantity <= 1 || isUnavailable}
                  aria-label="Уменьшить количество"
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-150',
                    item.quantity <= 1 || isUnavailable
                      ? 'opacity-30 cursor-not-allowed text-[var(--color-graphite-light)]'
                      : 'cursor-pointer text-[var(--color-graphite-light)] hover:bg-[var(--color-champagne)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-caramel)] focus-visible:ring-offset-1'
                  )}
                >
                  <Minus size={13} />
                </button>

                <span className="text-sm font-medium w-6 text-center select-none tabular-nums text-[var(--color-graphite)]">
                  {item.quantity}
                </span>

                <button
                  onClick={handleIncrement}
                  disabled={isUnavailable}
                  aria-label="Увеличить количество"
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-150',
                    isUnavailable
                      ? 'opacity-30 cursor-not-allowed text-[var(--color-graphite-light)]'
                      : 'cursor-pointer text-[var(--color-graphite-light)] hover:bg-[var(--color-champagne)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-caramel)] focus-visible:ring-offset-1'
                  )}
                >
                  <Plus size={13} />
                </button>
              </div>
            )}

            {/* Price */}
            <div className="text-right">
              <p className="text-lg font-semibold text-[var(--color-caramel)] tabular-nums">
                {formatPrice(itemTotal)}
              </p>
              {isPerKg ? (
                <p className="text-xs tabular-nums text-[var(--color-graphite-light)]/60">
                  {formatPrice(item.pricePerKg ?? 0)} / кг
                </p>
              ) : (
                <p className={cn(
                  "text-xs tabular-nums",
                  item.quantity > 1 ? "text-[var(--color-graphite-light)]/60" : "invisible"
                )}>
                  {formatPrice(item.price)} × {item.quantity}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
