'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Minus, Plus } from 'lucide-react';
import { useConstructorStore } from '@/stores/constructor-store';
import { TierTabs } from './TierTabs';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
  getFullTierVariantMeta,
  isFullTierVisualKeyAvailable,
  type CakeShape,
} from '@/lib/constructor/model-registry';

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
  const shape = useConstructorStore((s) => s.shape);
  const layers = useConstructorStore((s) => s.layers);
  const ingredients = useConstructorStore((s) => s.ingredients);
  const setLayerBase = useConstructorStore((s) => s.setLayerBase);
  const setLayerWeight = useConstructorStore((s) => s.setLayerWeight);
  const config = useConstructorStore((s) => s.getConfig());

  const [activeTier, setActiveTier] = useState(0);

  const bases = ingredients?.bases.filter((b) =>
    b.available && isFullTierVisualKeyAvailable(shape as CakeShape, b.visualKey),
  ) ?? [];
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
        <h3 className="font-heading font-semibold text-[var(--color-graphite)] text-sm mb-3 uppercase tracking-wide">
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
            const variantMeta = getFullTierVariantMeta(shape as CakeShape, base.visualKey);
            return (
              <motion.button
                key={base.id}
                variants={itemVariants}
                onClick={() => setLayerBase(activeTier, base.id)}
                className={cn(
                  'relative flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 ease-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-caramel)] focus-visible:ring-offset-2',
                  isSelected
                    ? 'border-[var(--color-caramel)] bg-[var(--color-caramel)]/5'
                    : 'border-[var(--border-default)] bg-[var(--surface-elevated)] hover:border-[var(--color-caramel)]/40 hover:shadow-sm'
                )}
                whileTap={{ scale: 0.985 }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex-shrink-0 border border-black/10 shadow-sm"
                  style={{ backgroundColor: variantMeta?.color ?? base.color ?? '#FFF8E7' }}
                />

                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-semibold leading-tight',
                    isSelected ? 'text-[var(--color-caramel)]' : 'text-[var(--color-graphite)]'
                  )}>
                    {base.name}
                  </p>
                  {base.description && (
                    <p className="text-xs text-[var(--color-graphite-light)] mt-0.5 leading-snug line-clamp-1">
                      {base.description}
                    </p>
                  )}
                </div>

                <div className="flex-shrink-0 text-right">
                  <p className="text-sm font-semibold text-[var(--color-graphite)]">
                    {formatPrice(base.pricePerKg)}
                  </p>
                  <p className="text-[10px] text-[var(--color-graphite-light)]">за кг</p>
                </div>

                {isSelected && (
                  <div className="absolute right-3 top-3 w-5 h-5 rounded-full bg-[var(--color-caramel)] flex items-center justify-center shadow-sm">
                    <Check size={11} className="text-white" strokeWidth={3} />
                  </div>
                )}
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      <div>
        <h3 className="font-heading font-semibold text-[var(--color-graphite)] text-sm mb-3 uppercase tracking-wide">
          Вес {tierCount > 1 ? `яруса ${activeTier + 1}` : 'торта'}
        </h3>
        <div className="flex items-center gap-4 p-3 bg-[var(--surface-secondary)] rounded-[var(--radius-control)] border border-[var(--border-subtle)]">
          <button
            onClick={() => handleWeightChange(-weightStep)}
            disabled={!layer || layer.weight <= minWeight}
            className="w-10 h-10 rounded-full bg-[var(--color-champagne)]/40 hover:bg-[var(--color-champagne)] flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <Minus size={16} strokeWidth={2.5} />
          </button>

          <div className="flex-1 text-center">
            <p className="text-lg font-semibold text-[var(--color-graphite)] min-w-[80px] text-center">
              {layer ? (layer.weight >= 1000 ? `${layer.weight / 1000} кг` : `${layer.weight} г`) : '—'}
            </p>
            <p className="text-xs text-[var(--color-graphite-light)] mt-0.5">
              {minWeight / 1000}–{maxWeight / 1000} кг, шаг {weightStep} г
            </p>
          </div>

          <button
            onClick={() => handleWeightChange(weightStep)}
            disabled={!layer || layer.weight >= maxWeight}
            className="w-10 h-10 rounded-full bg-[var(--color-champagne)]/40 hover:bg-[var(--color-champagne)] flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <Plus size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
