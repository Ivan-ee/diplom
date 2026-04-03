'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCartStore, type CartItem as CartItemType } from '@/stores/cart-store';
import { formatPrice, cn } from '@/lib/utils';

interface CartItemProps {
  item: CartItemType;
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
  if (typeof c.filling === 'string' && c.filling) {
    parts.push(c.filling);
  }
  if (typeof c.coating === 'string' && c.coating) {
    parts.push(c.coating);
  }
  if (typeof c.inscription === 'string' && c.inscription) {
    parts.push(`"${c.inscription}"`);
  }

  if (parts.length === 0) return null;

  return (
    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mt-1 line-clamp-2">
      {parts.join(' · ')}
    </p>
  );
}

export function CartItem({ item }: CartItemProps) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isConstructor = item.type === 'constructor';
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
      // Auto-cancel confirmation after 3 s
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
      className="group"
    >
      <div className="flex items-start gap-4 py-5">
        {/* Image */}
        <div className="relative shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-[var(--color-cream)] border border-[var(--color-soft-peach)]">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              className="object-cover"
              sizes="80px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-3xl select-none" aria-hidden="true">🎂</span>
            </div>
          )}
        </div>

        {/* Info + controls */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {/* Top row: name + delete */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-heading font-semibold text-[var(--color-dark)] text-sm leading-tight line-clamp-2">
                  {item.name}
                </h3>
                {isConstructor && (
                  <Badge variant="default" className="shrink-0 text-[10px] px-2 py-0.5">
                    Собранный торт
                  </Badge>
                )}
              </div>

              {/* Weight */}
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
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
                      className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-dark)] px-2 py-1 rounded-md transition-colors duration-150 cursor-pointer"
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
                    className={cn(
                      'p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all duration-150 cursor-pointer',
                      'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300'
                    )}
                  >
                    <Trash2 size={15} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom row: quantity + price */}
          <div className="flex items-center justify-between gap-4">
            {/* Quantity controls */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={handleDecrement}
                aria-label="Уменьшить количество"
                className={cn(
                  'w-7 h-7 flex items-center justify-center rounded-md transition-all duration-150 cursor-pointer',
                  'text-[var(--color-dark)] hover:bg-white hover:shadow-sm active:scale-95',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dusty-rose)] focus-visible:ring-offset-1',
                  item.quantity <= 1 && 'text-gray-300 hover:text-gray-300 hover:bg-transparent hover:shadow-none'
                )}
              >
                <Minus size={13} />
              </button>

              <span className="w-7 text-center text-sm font-semibold text-[var(--color-dark)] select-none tabular-nums">
                {item.quantity}
              </span>

              <button
                onClick={handleIncrement}
                aria-label="Увеличить количество"
                className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--color-dark)] hover:bg-white hover:shadow-sm active:scale-95 transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dusty-rose)] focus-visible:ring-offset-1"
              >
                <Plus size={13} />
              </button>
            </div>

            {/* Price */}
            <div className="text-right">
              <p className="font-heading font-bold text-base text-[var(--color-dusty-rose)] tabular-nums">
                {formatPrice(itemTotal)}
              </p>
              {item.quantity > 1 && (
                <p className="text-[11px] text-[var(--color-text-secondary)] tabular-nums">
                  {formatPrice(item.price)} × {item.quantity}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Divider — rendered by parent via CSS sibling, but we include it here for self-containment */}
      <div className="h-px bg-gray-100" />
    </motion.div>
  );
}
