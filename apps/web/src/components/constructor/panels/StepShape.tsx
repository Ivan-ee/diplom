'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useConstructorStore, type CakeShape, type TierCount } from '@/stores/constructor-store';
import { cn } from '@/lib/utils';

const SHAPE_ICONS: Record<CakeShape, React.ReactNode> = {
  circle: (
    <svg viewBox="0 0 40 40" className="w-8 h-8"><circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
  ),
  square: (
    <svg viewBox="0 0 40 40" className="w-8 h-8"><rect x="6" y="6" width="28" height="28" rx="3" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
  ),
  heart: (
    <svg viewBox="0 0 40 40" className="w-8 h-8"><path d="M20 35s-14-8.35-14-17.5C6 11.46 10.46 7 16.5 7c3.58 0 5.36 2.01 3.5 3.5C22.14 9.01 23.93 7 27.5 7 31.54 7 34 11.46 34 17.5 34 26.65 20 35 20 35z" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
  ),
};

const SHAPES: { id: CakeShape; label: string; description: string }[] = [
  { id: 'circle', label: 'Круглый', description: 'Классическая форма' },
  { id: 'square', label: 'Квадратный', description: '+10% к цене' },
  { id: 'heart', label: 'Сердце', description: '+15% к цене' },
];

const TIERS: TierCount[] = [1, 2, 3];
const TIER_LABELS: Record<TierCount, string> = {
  1: '1 ярус',
  2: '2 яруса',
  3: '3 яруса',
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
};

export function StepShape() {
  const shape = useConstructorStore((s) => s.shape);
  const tierCount = useConstructorStore((s) => s.tierCount);
  const setShape = useConstructorStore((s) => s.setShape);
  const setTierCount = useConstructorStore((s) => s.setTierCount);
  const ingredients = useConstructorStore((s) => s.ingredients);

  const getTierSurcharge = (tiers: number): number => {
    const found = ingredients?.tierSurcharges?.find((s) => s.tierCount === tiers);
    return found ? Math.round(found.surcharge / 100) : tiers === 2 ? 300 : 600;
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="font-heading font-semibold text-[var(--color-graphite)] text-sm mb-3 uppercase tracking-wide">
          Форма торта
        </h3>
        <motion.div
          className="grid grid-cols-3 gap-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {SHAPES.map(({ id, label, description }) => {
            const isSelected = shape === id;
            return (
              <motion.button
                key={id}
                variants={itemVariants}
                onClick={() => setShape(id)}
                className={cn(
                  'relative flex flex-col items-center gap-2 p-4 rounded-[var(--radius-control)] border cursor-pointer transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-caramel)] focus-visible:ring-offset-2',
                  isSelected
                    ? 'border-[var(--color-caramel)] bg-[var(--color-caramel)]/5 shadow-sm'
                    : 'border-[var(--border-default)] bg-[var(--surface-elevated)] hover:border-[var(--color-caramel)]/40 hover:shadow-sm'
                )}
                whileTap={{ scale: 0.97 }}
              >
                {isSelected && (
                  <motion.div
                    layoutId="shape-selection"
                    className="absolute inset-0 rounded-[var(--radius-control)] border-2 border-[var(--color-caramel)]"
                    transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                  />
                )}
                <span className={cn('leading-none', isSelected ? 'text-[var(--color-caramel)]' : 'text-[var(--color-graphite-light)]')}>
                  {SHAPE_ICONS[id]}
                </span>
                <div className="text-center">
                  <p className={cn(
                    'text-sm font-semibold leading-tight',
                    isSelected ? 'text-[var(--color-caramel)]' : 'text-[var(--color-graphite)]'
                  )}>
                    {label}
                  </p>
                  <p className="text-[10px] text-[var(--color-graphite-light)] mt-0.5 leading-tight">
                    {description}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      <div>
        <h3 className="font-heading font-semibold text-[var(--color-graphite)] text-sm mb-3 uppercase tracking-wide">
          Количество ярусов
        </h3>
        <div className="flex gap-1 p-1 bg-[var(--color-champagne)]/40 rounded-xl">
          {TIERS.map((t) => {
            const isActive = tierCount === t;
            return (
              <button
                key={t}
                onClick={() => setTierCount(t)}
                className={cn(
                  'relative flex-1 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-caramel)] focus-visible:ring-offset-1 cursor-pointer',
                  isActive
                    ? 'bg-[var(--color-milk-white)] shadow-sm text-[var(--color-graphite)]'
                    : 'text-[var(--color-graphite-light)] hover:text-[var(--color-graphite)]'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="tier-selection"
                    className="absolute inset-0 bg-[var(--color-milk-white)] rounded-lg shadow-sm"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{TIER_LABELS[t]}</span>
              </button>
            );
          })}
        </div>

        {tierCount > 1 && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-xs text-[var(--color-graphite-light)] text-center"
          >
            {`+ ${getTierSurcharge(tierCount)} ₽ за многоярусность`}
          </motion.p>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-start gap-2.5 p-3 bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-control)]"
      >
        <span className="text-base leading-none mt-0.5 select-none" aria-hidden="true">💡</span>
        <p className="text-xs text-[var(--color-graphite-light)] leading-relaxed">
          Форма торта влияет на сложность приготовления. Круглая — классика, сердце и квадрат требуют дополнительной обработки.
        </p>
      </motion.div>
    </div>
  );
}
