'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/stores/cart-store';
import { showCartToast } from '@/lib/cart-toast';
import { cn, formatPrice } from '@/lib/utils';
import { type Product } from '@/components/catalog/ProductCard';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface AddToCartControlProps {
  product: Product;
  variant?: 'compact' | 'full';
  inscription?: string;
  initialWeight?: number; // граммы
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deriveWeightParams(product: Product) {
  const minWeightG =
    product.weightMin ??
    product.weightOptions?.[0] ??
    (product.minWeight ? Math.round(parseFloat(product.minWeight) * 1000) : 1000);

  const maxWeightG =
    product.weightMax ??
    (product.maxWeight ? Math.round(parseFloat(product.maxWeight) * 1000) : minWeightG);

  const stepG = product.weightStep
    ? Math.round(parseFloat(product.weightStep) * 1000)
    : 500;

  return { minWeightG, maxWeightG, stepG };
}

function calcPrice(
  product: Product,
  weightG: number,
  isPerUnit: boolean,
): number {
  if (isPerUnit) return product.pricePerUnit ?? 0;
  if (product.pricePerKg) return Math.round(product.pricePerKg * (weightG / 1000));
  return 0;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AddToCartControl({
  product,
  variant = 'compact',
  inscription,
  initialWeight,
  className,
}: AddToCartControlProps) {
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const updateWeight = useCartStore((s) => s.updateWeight);
  const cartItem = useCartStore((s) => s.getItemByProductId(product.id));

  const isDisabled = product.isAvailable === false;
  const isPerUnit = product.priceType === 'per_unit';
  const { minWeightG, maxWeightG, stepG } = deriveWeightParams(product);
  const imageUrl = product.imageUrl ?? product.images?.[0];

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleAdd(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (isDisabled) return;

    const weight = initialWeight ?? minWeightG;
    const price = calcPrice(product, weight, isPerUnit);

    addItem({
      type: 'product',
      productId: product.id,
      name: product.name,
      imageUrl: imageUrl ?? '',
      weight,
      price,
      pricePerKg: product.pricePerKg ?? undefined,
      pricePerUnit: product.pricePerUnit ?? undefined,
      priceType: product.priceType ?? 'per_kg',
      weightStep: stepG,
      minWeight: minWeightG,
      maxWeight: maxWeightG,
      inscription: inscription?.trim() || undefined,
    });

    showCartToast({
      name: product.name,
      image: imageUrl,
      weight: isPerUnit
        ? undefined
        : `${((initialWeight ?? minWeightG) / 1000).toLocaleString('ru-RU')} кг`,
    });
  }

  function handleIncrease(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (!cartItem || isDisabled) return;

    if (isPerUnit) {
      updateQuantity(cartItem.id, cartItem.quantity + 1);
    } else {
      const next = cartItem.weight + stepG;
      if (next <= maxWeightG) {
        updateWeight(product.id, next);
      }
    }
  }

  function handleDecrease(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (!cartItem || isDisabled) return;

    if (isPerUnit) {
      updateQuantity(cartItem.id, cartItem.quantity - 1);
    } else {
      const next = cartItem.weight - stepG;
      if (next < minWeightG) {
        removeItem(cartItem.id);
      } else {
        updateWeight(product.id, next);
      }
    }
  }

  // ── Display value ────────────────────────────────────────────────────────────

  const displayValue = cartItem
    ? isPerUnit
      ? String(cartItem.quantity)
      : `${(cartItem.weight / 1000).toLocaleString('ru-RU')} кг`
    : null;

  const increaseDisabled =
    isDisabled ||
    !cartItem ||
    (!isPerUnit && cartItem.weight >= maxWeightG);

  // ── Variant-specific class sets ─────────────────────────────────────────────

  const isCompact = variant === 'compact';

  const addButtonCls = isCompact
    ? 'w-full rounded-[var(--radius-control)] text-xs sm:text-sm font-medium py-1.5 sm:py-2 bg-[var(--color-caramel)] hover:bg-[var(--color-caramel-hover)] text-white transition-colors duration-200'
    : 'w-full rounded-[var(--radius-control)] h-14 text-base font-semibold text-white bg-[var(--color-caramel)] hover:bg-[var(--color-caramel-hover)] transition-colors duration-200 flex items-center justify-center gap-2';

  const controlWrapCls = isCompact
    ? 'w-full flex items-center justify-between bg-[var(--color-champagne)]/40 rounded-[var(--radius-control)] px-1 py-1'
    : 'w-full flex items-center justify-between bg-[var(--color-champagne)]/40 rounded-[var(--radius-control)] h-14 px-2';

  const stepBtnCls = isCompact
    ? 'w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[var(--color-graphite-light)] hover:bg-[var(--color-champagne)] transition-colors duration-150'
    : 'w-10 h-10 rounded-full flex items-center justify-center text-[var(--color-graphite-light)] hover:bg-[var(--color-champagne)] transition-colors duration-150';

  const valueCls = isCompact
    ? 'text-xs sm:text-sm font-medium tabular-nums text-[var(--color-graphite)] select-none'
    : 'text-sm font-semibold tabular-nums text-[var(--color-graphite)] select-none';

  const iconSize = isCompact ? 13 : 16;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className={cn('relative', className)}>
      <AnimatePresence mode="wait" initial={false}>
        {cartItem ? (
          /* ── In-cart controller ─────────────────────────────────────────── */
          <motion.div
            key="controller"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={controlWrapCls}
          >
            {/* Decrease / Remove */}
            <button
              type="button"
              onClick={handleDecrease}
              disabled={isDisabled}
              aria-label="Уменьшить количество"
              className={cn(stepBtnCls, isDisabled && 'opacity-30 cursor-not-allowed')}
            >
              <Minus size={iconSize} strokeWidth={2.5} />
            </button>

            {/* Current value */}
            <span className={valueCls}>{displayValue}</span>

            {/* Increase */}
            <button
              type="button"
              onClick={handleIncrease}
              disabled={increaseDisabled}
              aria-label="Увеличить количество"
              className={cn(
                stepBtnCls,
                increaseDisabled && 'opacity-30 cursor-not-allowed',
              )}
            >
              <Plus size={iconSize} strokeWidth={2.5} />
            </button>
          </motion.div>
        ) : (
          /* ── Add-to-cart button ──────────────────────────────────────────── */
          <motion.button
            key="add-button"
            type="button"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            whileTap={{ scale: isDisabled ? 1 : 0.97 }}
            onClick={handleAdd}
            disabled={isDisabled}
            aria-label={`Добавить ${product.name} в корзину`}
            className={cn(addButtonCls, isDisabled && 'opacity-40 cursor-not-allowed')}
          >
            {variant === 'full' ? (
              <>
                <ShoppingCart size={18} strokeWidth={2} />
                <span>
                  В корзину —{' '}
                  {formatPrice(
                    calcPrice(product, initialWeight ?? minWeightG, isPerUnit),
                  )}
                </span>
              </>
            ) : (
              'В корзину'
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
