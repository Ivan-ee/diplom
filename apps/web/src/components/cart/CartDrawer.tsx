'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Chip, DrawerRoot, DrawerBackdrop, DrawerContent, DrawerDialog, DrawerBody } from '@heroui/react';
import { useCartStore, type CartItem } from '@/stores/cart-store';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice, cn } from '@/lib/utils';
import { usePromoCode } from '@/hooks/usePromoCode';
import { PromoCodeInput } from '@/components/cart/PromoCodeInput';

/* ------------------------------------------------------------------ */
/* Props                                                                */
/* ------------------------------------------------------------------ */

interface CartDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

/* ------------------------------------------------------------------ */
/* CartDrawer                                                           */
/* ------------------------------------------------------------------ */

export function CartDrawer({ isOpen, onOpenChange }: CartDrawerProps) {
  const items = useCartStore((s) => s.items);
  const getTotalPrice = useCartStore((s) => s.getTotalPrice);
  const { isAuthenticated, openAuth } = useAuth();
  const router = useRouter();

  const totalPrice = getTotalPrice();
  const isEmpty = items.length === 0;

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 640px)');
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const {
    promoCode,
    setPromoCode,
    promoLoading,
    promoError,
    promoResult,
    finalPrice,
    handleApplyPromo,
    handleRemovePromo,
  } = usePromoCode(totalPrice);

  function handleCheckout() {
    if (!isAuthenticated) {
      openAuth('login');
      return;
    }
    onOpenChange(false);
    router.push('/checkout');
  }

  return (
    <DrawerRoot isOpen={isOpen} onOpenChange={onOpenChange}>
      <DrawerBackdrop
        isDismissable
        className="bg-black/30 backdrop-blur-sm"
      >
        <DrawerContent placement={isMobile ? 'bottom' : 'right'}>
          <DrawerDialog className={cn(
            "bg-[var(--surface-elevated)] outline-none flex flex-col shadow-[var(--shadow-elevated)] !p-0",
            isMobile
              ? "w-full max-h-[85vh] rounded-t-2xl"
              : "w-[380px] max-w-full"
          )}>
            <DrawerBody className="flex flex-col h-full p-0 mx-0 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-default)] shrink-0">
            <div className="flex items-center gap-2.5">
              <ShoppingBag size={18} className="text-[var(--color-caramel)]" />
              <h2 className="font-semibold text-base text-[var(--color-graphite)] leading-none">
                Корзина
              </h2>
              {!isEmpty && (
                <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-[var(--color-caramel)] text-white text-[11px] font-semibold leading-none tabular-nums">
                  {items.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Закрыть корзину"
              className="flex h-8 w-8 items-center justify-center rounded-xl text-[var(--color-graphite-light)] hover:bg-[var(--surface-secondary)] hover:text-[var(--color-graphite)] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-caramel)] cursor-pointer"
            >
              <X size={17} />
            </button>
          </div>

          {/* Body */}
          {isEmpty ? (
            <EmptyState onClose={() => onOpenChange(false)} />
          ) : (
            <>
              {/* Scrollable item list */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                <AnimatePresence initial={false}>
                  {items.map((item) => (
                    <DrawerCartItem key={item.id} item={item} />
                  ))}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="shrink-0 border-t border-[var(--border-default)] px-5 py-4 flex flex-col gap-3 bg-[var(--surface-elevated)]">
                {/* Promo code input */}
                <PromoCodeInput
                  compact
                  promoCode={promoCode}
                  onPromoCodeChange={setPromoCode}
                  promoLoading={promoLoading}
                  promoError={promoError}
                  promoResult={promoResult}
                  onApply={handleApplyPromo}
                  onRemove={handleRemovePromo}
                />

                {/* Discount line */}
                {promoResult && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--color-graphite-light)]">
                      Скидка ({promoResult.code})
                    </span>
                    <span className="text-sm font-semibold text-green-600 tabular-nums">
                      −{formatPrice(promoResult.discountAmount)}
                    </span>
                  </div>
                )}

                {/* Total */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--color-graphite-light)]">
                    {promoResult ? 'К оплате' : 'Итого'}
                  </span>
                  <span className="text-base font-bold text-[var(--color-graphite)] tabular-nums">
                    {formatPrice(finalPrice)}
                  </span>
                </div>

                {/* Checkout button */}
                <button
                  type="button"
                  onClick={handleCheckout}
                  className="w-full h-12 rounded-[var(--radius-control,12px)] bg-[var(--color-caramel)] hover:bg-[var(--color-caramel-hover)] text-white text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-caramel)] focus-visible:ring-offset-2 cursor-pointer"
                >
                  Оформить заказ
                </button>

                {/* Cart link */}
                <Link
                  href="/cart"
                  onClick={() => onOpenChange(false)}
                  className="text-center text-sm text-[var(--color-graphite-light)] underline underline-offset-2 hover:text-[var(--color-graphite)] transition-colors duration-150"
                >
                  Перейти в корзину
                </Link>
              </div>
            </>
          )}

            </DrawerBody>
          </DrawerDialog>
        </DrawerContent>
      </DrawerBackdrop>
    </DrawerRoot>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state                                                          */
/* ------------------------------------------------------------------ */

function EmptyState({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface-secondary)]">
        <ShoppingBag size={28} className="text-[var(--color-graphite-light)]" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-base font-medium text-[var(--color-graphite)]">
          Корзина пуста
        </p>
        <p className="text-sm text-[var(--color-graphite-light)]">
          Добавьте что-нибудь из каталога
        </p>
      </div>
      <Link
        href="/catalog"
        onClick={onClose}
        className="inline-flex h-10 items-center rounded-[var(--radius-control,12px)] bg-[var(--color-caramel)] px-5 text-sm font-semibold text-white hover:bg-[var(--color-caramel-hover)] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-caramel)] focus-visible:ring-offset-2"
      >
        В каталог
      </Link>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* DrawerCartItem — compact version for the drawer panel               */
/* ------------------------------------------------------------------ */

function DrawerCartItem({ item }: { item: CartItem }) {
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const updateWeight = useCartStore((s) => s.updateWeight);

  const isConstructor = item.type === 'constructor';
  const isPerKg =
    item.type === 'product' &&
    (item.priceType === 'per_kg' || (!item.priceType && !item.pricePerUnit));

  const step = item.weightStep ?? 500;
  const minW = item.minWeight ?? 0;
  const maxW = item.maxWeight;
  const atMax = maxW !== undefined && item.weight + step > maxW;

  function handleDecrementWeight() {
    if (item.weight - step >= minW) {
      updateWeight(item.productId!, item.weight - step);
    } else {
      removeItem(item.id);
    }
  }

  function handleIncrementWeight() {
    if (!atMax) updateWeight(item.productId!, item.weight + step);
  }

  function handleDecrementQty() {
    updateQuantity(item.id, item.quantity - 1);
  }

  function handleIncrementQty() {
    updateQuantity(item.id, item.quantity + 1);
  }

  const weightLabel =
    item.weight >= 1000
      ? `${(item.weight / 1000).toLocaleString('ru-RU')} кг`
      : `${item.weight} г`;

  const subLabel = isPerKg ? weightLabel : `${item.quantity} шт.`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20, transition: { duration: 0.2, ease: 'easeOut' } }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="relative flex items-start gap-3 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-secondary)] p-3"
    >
      {/* Delete button — top-right */}
      <button
        type="button"
        onClick={() => removeItem(item.id)}
        aria-label="Удалить из корзины"
        className="absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full text-[var(--color-graphite-light)] hover:text-red-500 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 cursor-pointer"
      >
        <X size={13} />
      </button>

      {/* Thumbnail */}
      <div className="shrink-0 h-[72px] w-[72px] rounded-xl overflow-hidden bg-[var(--color-champagne)]">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            width={72}
            height={72}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-2xl select-none" aria-hidden="true">~</span>
          </div>
        )}
      </div>

      {/* Info column */}
      <div className="flex-1 min-w-0 flex flex-col gap-2 pr-5">
        {/* Name + constructor badge */}
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="text-sm font-medium text-[var(--color-graphite)] line-clamp-1 leading-snug">
            {item.name}
          </p>
          {isConstructor && (
            <Chip
              size="sm"
              color="accent"
              variant="soft"
              className="text-[10px] font-medium shrink-0"
            >
              Собранный торт
            </Chip>
          )}
        </div>

        {/* Sub-label: weight or quantity text */}
        <p className="text-xs text-[var(--color-graphite-light)] leading-none">
          {subLabel}
        </p>

        {/* Bottom row: stepper + price */}
        <div className="flex items-center justify-between gap-2 mt-0.5">
          {/* Stepper */}
          {isPerKg ? (
            <div className="flex items-center gap-1.5 bg-[var(--surface-elevated)] rounded-full px-1 py-0.5">
              <StepperButton
                onClick={handleDecrementWeight}
                aria-label="Уменьшить вес"
              >
                <Minus size={11} />
              </StepperButton>
              <span className="text-xs font-medium tabular-nums text-[var(--color-graphite)] min-w-[3rem] text-center select-none">
                {(item.weight / 1000).toLocaleString('ru-RU')} кг
              </span>
              <StepperButton
                onClick={handleIncrementWeight}
                disabled={atMax}
                aria-label="Увеличить вес"
              >
                <Plus size={11} />
              </StepperButton>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-[var(--surface-elevated)] rounded-full px-1 py-0.5">
              <StepperButton
                onClick={handleDecrementQty}
                disabled={item.quantity <= 1}
                aria-label="Уменьшить количество"
              >
                <Minus size={11} />
              </StepperButton>
              <span className="text-xs font-medium tabular-nums text-[var(--color-graphite)] w-5 text-center select-none">
                {item.quantity}
              </span>
              <StepperButton
                onClick={handleIncrementQty}
                aria-label="Увеличить количество"
              >
                <Plus size={11} />
              </StepperButton>
            </div>
          )}

          {/* Price */}
          <p className="text-sm font-semibold text-[var(--color-caramel)] tabular-nums shrink-0">
            {formatPrice(item.price * item.quantity)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* StepperButton — reusable small round button                         */
/* ------------------------------------------------------------------ */

interface StepperButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

function StepperButton({ children, disabled, className, ...rest }: StepperButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        'w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-caramel)] focus-visible:ring-offset-1',
        disabled
          ? 'opacity-30 cursor-not-allowed text-[var(--color-graphite-light)]'
          : 'cursor-pointer text-[var(--color-graphite-light)] hover:bg-[var(--color-champagne)] hover:text-[var(--color-graphite)]',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
