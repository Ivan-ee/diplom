'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronDown, Loader2, TriangleAlert } from 'lucide-react';
import { useConstructorStore } from '@/stores/constructor-store';
import { formatPrice, cn } from '@/lib/utils';

function useAnimatedPrice(target: number) {
  const [displayed, setDisplayed] = useState(target);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(target);

  useEffect(() => {
    const from = fromRef.current;
    const to = target;
    if (from === to) return;

    const duration = 400;

    const animate = (now: number) => {
      if (!startRef.current) startRef.current = now;
      const elapsed = now - startRef.current;
      const t = Math.min(elapsed / duration, 1);
      // ease-out quad
      const eased = 1 - (1 - t) * (1 - t);
      const value = Math.round(from + (to - from) * eased);
      setDisplayed(value);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        fromRef.current = to;
        startRef.current = null;
      }
    };

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    startRef.current = null;
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target]);

  return displayed;
}

interface PriceBreakdownRow {
  label: string;
  value: number;
}

export function PriceCalculator() {
  const [expanded, setExpanded] = useState(false);

  const totalPrice = useConstructorStore((s) => s.totalPrice);
  const pricingStatus = useConstructorStore((s) => s.pricingStatus);
  const priceBreakdown = useConstructorStore((s) => s.priceBreakdown);
  const priceError = useConstructorStore((s) => s.priceError);

  const animatedTotal = useAnimatedPrice(totalPrice);

  const breakdown: PriceBreakdownRow[] = [];

  if (priceBreakdown) {
    const baseCost = priceBreakdown.tiers?.reduce((sum, tier) => sum + tier.baseCost, 0) ?? 0;
    const fillingCost = priceBreakdown.tiers?.reduce((sum, tier) => sum + tier.fillingCost, 0) ?? 0;
    const decorCost = priceBreakdown.decorations?.reduce((sum, item) => sum + item.cost, 0) ?? 0;
    const decorCount = priceBreakdown.decorations?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

    if (baseCost > 0) breakdown.push({ label: 'Основа торта', value: baseCost });
    if (fillingCost > 0) breakdown.push({ label: 'Начинка', value: fillingCost });
    if ((priceBreakdown.coating?.cost ?? 0) > 0) {
      breakdown.push({ label: 'Покрытие', value: priceBreakdown.coating!.cost });
    }
    if (decorCost > 0) breakdown.push({ label: `Декор (${decorCount} шт.)`, value: decorCost });
    if (priceBreakdown.shapeSurcharge > 0) breakdown.push({ label: 'Наценка за форму', value: priceBreakdown.shapeSurcharge });
    if (priceBreakdown.tierSurcharge > 0) breakdown.push({ label: 'Многоярусность', value: priceBreakdown.tierSurcharge });
  }

  const statusLabel =
    pricingStatus === 'verified'
      ? 'Цена подтверждена'
      : pricingStatus === 'updating'
        ? 'Обновляем цену'
        : pricingStatus === 'error'
          ? 'Ошибка расчета'
          : 'Цена требует проверки';

  return (
    <div className="border-t border-[var(--border-default)] bg-[var(--surface-elevated)]">
      {/* Expandable breakdown */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pt-3 pb-1 flex flex-col gap-1.5">
              {breakdown.length === 0 ? (
                <p className="text-xs text-[var(--color-graphite-light)] text-center py-2">
                  Заполните все шаги для подробного расчёта
                </p>
              ) : (
                breakdown.map((row) => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-xs text-[var(--color-graphite-light)]">{row.label}</span>
                    <span className="text-xs font-semibold text-[var(--color-graphite)]">
                      {formatPrice(row.value)}
                    </span>
                  </div>
                ))
              )}
              <div className="h-px bg-[var(--border-subtle)] my-1" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main price row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[var(--color-warm-ivory)] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-caramel)] focus-visible:ring-inset"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--color-graphite-light)]">Итого</span>
          {pricingStatus === 'verified' && <CheckCircle2 size={14} className="text-emerald-600" />}
          {pricingStatus === 'updating' && <Loader2 size={14} className="animate-spin text-[var(--color-caramel)]" />}
          {pricingStatus === 'error' && <TriangleAlert size={14} className="text-red-500" />}
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={15} className="text-[var(--color-graphite-light)]" />
          </motion.div>
        </div>

        <div className="flex items-baseline gap-1">
          <div className="text-right">
            <span className="font-heading font-bold text-2xl text-[var(--color-caramel)]">
              {formatPrice(animatedTotal)}
            </span>
            <p className={cn(
              'text-[10px] leading-none',
              pricingStatus === 'error' ? 'text-red-500' : 'text-[var(--color-graphite-light)]',
            )}>
              {pricingStatus === 'error' && priceError ? priceError : statusLabel}
            </p>
          </div>
        </div>
      </button>
    </div>
  );
}
