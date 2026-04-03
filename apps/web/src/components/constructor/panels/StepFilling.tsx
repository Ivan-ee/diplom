'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useConstructorStore } from '@/stores/constructor-store';
import { TierTabs } from './TierTabs';
import { formatPrice, cn } from '@/lib/utils';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' as const } },
};

// Visual accent colors per filling index
const FILLING_ACCENTS = ['#e05c6e', '#5c3d2e', '#c4a08a'];

export function StepFilling() {
  const tierCount = useConstructorStore((s) => s.tierCount);
  const layers = useConstructorStore((s) => s.layers);
  const ingredients = useConstructorStore((s) => s.ingredients);
  const setLayerFilling = useConstructorStore((s) => s.setLayerFilling);

  const [activeTier, setActiveTier] = useState(0);

  const fillings = ingredients?.fillings.filter((f) => f.available) ?? [];
  const layer = layers[activeTier];

  return (
    <div className="flex flex-col gap-5">
      <TierTabs
        tierCount={tierCount}
        activeTier={activeTier}
        onSelect={setActiveTier}
        layoutId="tier-tab-filling"
      />

      {/* Filling cards */}
      <div>
        <h3 className="font-heading font-semibold text-[var(--color-dark)] text-sm mb-3 uppercase tracking-wide">
          Выберите начинку
        </h3>
        <motion.div
          key={activeTier}
          className="flex flex-col gap-2"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {fillings.map((filling, idx) => {
            const isSelected = layer?.fillingId === filling.id;
            const accentColor = FILLING_ACCENTS[idx % FILLING_ACCENTS.length] ?? '#c4a08a';

            return (
              <motion.button
                key={filling.id}
                variants={itemVariants}
                onClick={() => setLayerFilling(activeTier, filling.id)}
                className={cn(
                  'relative flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all duration-200 ease-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dusty-rose)] focus-visible:ring-offset-2',
                  isSelected
                    ? 'border-[var(--color-dusty-rose)] bg-[var(--color-dusty-rose)]/5 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-[var(--color-soft-peach)] hover:bg-[var(--color-cream)]'
                )}
                whileTap={{ scale: 0.985 }}
              >
                {/* Color accent stripe */}
                <div
                  className="w-1 self-stretch rounded-full flex-shrink-0"
                  style={{ backgroundColor: accentColor }}
                />

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-semibold leading-tight',
                    isSelected ? 'text-[var(--color-dusty-rose)]' : 'text-[var(--color-dark)]'
                  )}>
                    {filling.name}
                  </p>
                  {filling.description && (
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 leading-snug">
                      {filling.description}
                    </p>
                  )}
                </div>

                {/* Price */}
                <div className="flex-shrink-0 text-right">
                  <p className="text-sm font-semibold text-[var(--color-dark)]">
                    {formatPrice(filling.pricePerKg)}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-secondary)]">за кг</p>
                </div>

                {/* Check */}
                {isSelected && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[var(--color-dusty-rose)] flex items-center justify-center shadow-sm">
                    <Check size={11} className="text-white" strokeWidth={3} />
                  </div>
                )}
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/* Tip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="flex items-start gap-2.5 p-3 bg-[var(--color-cream)] rounded-lg border border-[var(--color-soft-peach)]"
      >
        <span className="text-base leading-none mt-0.5">🍓</span>
        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
          Начинка располагается между слоями бисквита. Можно выбрать разные начинки для каждого яруса.
        </p>
      </motion.div>
    </div>
  );
}
