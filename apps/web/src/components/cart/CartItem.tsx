'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Chip } from '@heroui/react';
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
    <p className="text-sm text-neutral-500 mt-1 line-clamp-2">
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
      className="bg-white rounded-2xl border border-neutral-100 p-4 lg:p-6"
    >
      <div className="flex items-start gap-4">
        {/* Image */}
        <div className="relative shrink-0 w-20 h-20 lg:w-24 lg:h-24 rounded-xl overflow-hidden bg-[var(--color-cream)] flex-shrink-0">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 96px, 80px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-3xl select-none text-neutral-300" aria-hidden="true">
                &#9728;
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
                <h3 className="text-base font-medium text-neutral-900 leading-tight line-clamp-2">
                  {item.name}
                </h3>
                {isConstructor && (
                  <Chip
                    size="sm"
                    color="accent"
                    variant="soft"
                    className="text-[10px] font-medium"
                  >
                    Собранный торт
                  </Chip>
                )}
              </div>

              {/* Weight */}
              <p className="text-sm text-neutral-500 mt-1">
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
                      className="text-xs text-neutral-400 hover:text-neutral-700 px-2 py-1 rounded-md transition-colors duration-150 cursor-pointer"
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
                    className="p-1.5 rounded-lg text-neutral-300 hover:text-red-400 transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                  >
                    <Trash2 size={15} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom: quantity stepper + price */}
          <div className="flex items-center justify-between gap-4">
            {/* Quantity stepper */}
            <div className="flex items-center gap-3 bg-neutral-100 rounded-full p-1">
              <button
                onClick={handleDecrement}
                aria-label="Уменьшить количество"
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-150 cursor-pointer',
                  'hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dusty-rose)] focus-visible:ring-offset-1',
                  item.quantity <= 1 ? 'text-neutral-300' : 'text-neutral-700'
                )}
              >
                <Minus size={13} />
              </button>

              <span className="text-sm font-medium w-6 text-center select-none tabular-nums text-neutral-900">
                {item.quantity}
              </span>

              <button
                onClick={handleIncrement}
                aria-label="Увеличить количество"
                className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-700 hover:bg-neutral-200 transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dusty-rose)] focus-visible:ring-offset-1"
              >
                <Plus size={13} />
              </button>
            </div>

            {/* Price */}
            <div className="text-right">
              <p className="text-lg font-semibold text-[var(--color-dusty-rose)] tabular-nums">
                {formatPrice(itemTotal)}
              </p>
              <p className={cn(
                "text-xs tabular-nums",
                item.quantity > 1 ? "text-neutral-400" : "invisible"
              )}>
                {formatPrice(item.price)} × {item.quantity}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
