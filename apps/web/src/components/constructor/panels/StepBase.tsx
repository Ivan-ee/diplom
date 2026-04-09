'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Minus, Plus } from 'lucide-react';
import { useConstructorStore } from '@/stores/constructor-store';
import { TierTabs } from './TierTabs';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' as const } },
};

export function StepBase() {
  const tierCount = useConstructorStore((s) => s.tierCount);
  const layers = useConstructorStore((s) => s.layers);
  const ingredients = useConstructorStore((s) => s.ingredients);
  const setLayerBase = useConstructorStore((s) => s.setLayerBase);
  const setLayerWeight = useConstructorStore((s) => s.setLayerWeight);
  const config = useConstructorStore((s) => s.getConfig());

  const [activeTier, setActiveTier] = useState(0);

  const bases = ingredients?.bases.filter((b) => b.available) ?? [];
  const layer = layers[activeTier];
  const minWeight = config?.minWeightPerTier ?? 500;
  const maxWeight = config?.maxWeightPerTier ?? 5000;
  const weightStep = config?.weightStep ?? 500;

  const handleWeightChange = (delta: number) => {
    if (!layer) return;
    const next = Math.max(minWeight, Math.min(maxWeight, layer.weight + delta));
    setLayerWeight(activeTier, next);
  };

  return (
    <div className="flex flex-col gap-5">
      <TierTabs
        tierCount={tierCount}
        activeTier={activeTier}
        onSelect={setActiveTier}
        layoutId="tier-tab-base"
      />

      <div>
        <h3 className="font-heading font-semibold text-[var(--color-dark)] text-sm mb-3 uppercase tracking-wide">
          Вид бисквита
        </h3>
        <motion.div
          key={activeTier}
          className="flex flex-col gap-2"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {bases.map((base) => {
            const isSelected = layer?.baseId === base.id;
            return (
              <motion.button
                key={base.id}
                variants={itemVariants}
                onClick={() => setLayerBase(activeTier, base.id)}
                className={cn(
                  'relative flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all duration-200 ease-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dusty-rose)] focus-visible:ring-offset-2',
                  isSelected
                    ? 'border-[var(--color-dusty-rose)] bg-[var(--color-dusty-rose)]/5 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-[var(--color-soft-peach)] hover:bg-[var(--color-cream)]'
                )}
                whileTap={{ scale: 0.985 }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex-shrink-0 border border-black/10 shadow-sm"
                  style={{ backgroundColor: base.color ?? '#FFF8E7' }}
                />

                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-semibold leading-tight',
                    isSelected ? 'text-[var(--color-dusty-rose)]' : 'text-[var(--color-dark)]'
                  )}>
                    {base.name}
                  </p>
                  {base.description && (
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 leading-snug line-clamp-1">
                      {base.description}
                    </p>
                  )}
                </div>

                <div className="flex-shrink-0 text-right">
                  <p className="text-sm font-semibold text-[var(--color-dark)]">
                    {formatPrice(base.pricePerKg)}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-secondary)]">за кг</p>
                </div>

                {isSelected && (
                  <div className="absolute right-3 top-3 w-5 h-5 rounded-full bg-[var(--color-dusty-rose)] flex items-center justify-center shadow-sm">
                    <Check size={11} className="text-white" strokeWidth={3} />
                  </div>
                )}
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      <div>
        <h3 className="font-heading font-semibold text-[var(--color-dark)] text-sm mb-3 uppercase tracking-wide">
          Вес {tierCount > 1 ? `яруса ${activeTier + 1}` : 'торта'}
        </h3>
        <div className="flex items-center gap-4 p-3 bg-[var(--color-cream)] rounded-xl border border-[var(--color-soft-peach)]">
          <button
            onClick={() => handleWeightChange(-weightStep)}
            disabled={!layer || layer.weight <= minWeight}
            className="w-9 h-9 rounded-lg border-2 border-[var(--color-dusty-rose)] text-[var(--color-dusty-rose)] flex items-center justify-center transition-all duration-150 hover:bg-[var(--color-dusty-rose)] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <Minus size={16} strokeWidth={2.5} />
          </button>

          <div className="flex-1 text-center">
            <p className="font-heading font-bold text-xl text-[var(--color-dark)]">
              {layer ? (layer.weight >= 1000 ? `${layer.weight / 1000} кг` : `${layer.weight} г`) : '—'}
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              {minWeight / 1000}–{maxWeight / 1000} кг, шаг {weightStep} г
            </p>
          </div>

          <button
            onClick={() => handleWeightChange(weightStep)}
            disabled={!layer || layer.weight >= maxWeight}
            className="w-9 h-9 rounded-lg border-2 border-[var(--color-dusty-rose)] text-[var(--color-dusty-rose)] flex items-center justify-center transition-all duration-150 hover:bg-[var(--color-dusty-rose)] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <Plus size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
