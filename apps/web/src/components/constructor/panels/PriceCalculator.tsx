'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
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
  const layers = useConstructorStore((s) => s.layers);
  const coating = useConstructorStore((s) => s.coating);
  const decorations = useConstructorStore((s) => s.decorations);
  const shape = useConstructorStore((s) => s.shape);
  const tierCount = useConstructorStore((s) => s.tierCount);
  const ingredients = useConstructorStore((s) => s.ingredients);

  const animatedTotal = useAnimatedPrice(totalPrice);

  const breakdown: PriceBreakdownRow[] = [];

  if (ingredients) {
    let baseCost = 0;
    for (const layer of layers) {
      const base = ingredients.bases.find((b) => b.id === layer.baseId);
      if (base) baseCost += (layer.weight * base.pricePerKg) / 1000;
    }
    if (baseCost > 0) breakdown.push({ label: 'Бисквит', value: Math.round(baseCost) });

    let fillingCost = 0;
    for (const layer of layers) {
      const filling = ingredients.fillings.find((f) => f.id === layer.fillingId);
      if (filling) fillingCost += (layer.weight * filling.pricePerKg) / 1000;
    }
    if (fillingCost > 0) breakdown.push({ label: 'Начинка', value: Math.round(fillingCost) });

    const totalWeight = layers.reduce((sum, l) => sum + l.weight, 0);
    const coatingIngredient = ingredients.coatings.find((c) => c.id === coating.coatingId);
    if (coatingIngredient) {
      const coatingCost = (totalWeight * coatingIngredient.pricePerKg) / 1000;
      if (coatingCost > 0) breakdown.push({ label: 'Покрытие', value: Math.round(coatingCost) });
    }

    const countMap: Record<string, number> = {};
    for (const d of decorations) {
      countMap[d.decorationId] = (countMap[d.decorationId] ?? 0) + 1;
    }
    let decorCost = 0;
    for (const [decorId, count] of Object.entries(countMap)) {
      const decor = ingredients.decorations.find((d) => d.id === decorId);
      if (decor) decorCost += decor.pricePerUnit * count;
    }
    if (decorCost > 0) breakdown.push({ label: 'Декорации', value: Math.round(decorCost) });

    const shapeInfo = ingredients.shapes.find((s) => s.id === shape);
    if (shapeInfo && shapeInfo.surchargePercent > 0) {
      const subTotal = baseCost + fillingCost + (coatingIngredient ? (totalWeight * coatingIngredient.pricePerKg) / 1000 : 0) + decorCost;
      const surcharge = Math.round((subTotal * shapeInfo.surchargePercent) / 100);
      if (surcharge > 0) breakdown.push({ label: `Форма (+${shapeInfo.surchargePercent}%)`, value: surcharge });
    }

    const tierSurcharge = ingredients.tierSurcharges.find((t) => t.tierCount === tierCount);
    if (tierSurcharge && tierSurcharge.surcharge > 0) {
      breakdown.push({ label: 'Многоярусность', value: tierSurcharge.surcharge });
    }
  }

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
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={15} className="text-[var(--color-graphite-light)]" />
          </motion.div>
        </div>

        <div className="flex items-baseline gap-1">
          <span className="font-heading font-bold text-2xl text-[var(--color-caramel)]">
            {formatPrice(animatedTotal)}
          </span>
        </div>
      </button>
    </div>
  );
}
