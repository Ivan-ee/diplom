'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { useConstructorStore, type FillingCategory } from '@/stores/constructor-store';
import { TierTabs } from './TierTabs';
import { formatPrice, cn } from '@/lib/utils';
import { isFillVisualKeyAvailable, type CakeShape } from '@/lib/constructor/model-registry';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' as const } },
};

// Visual accent colors per filling index (fallback when no category)
const FILLING_ACCENTS = ['#e05c6e', '#5c3d2e', '#c4a08a'];

/** Russian labels for each filling category. */
const CATEGORY_LABELS: Record<FillingCategory, string> = {
  white: 'Белый бисквит',
  chocolate: 'Шоколадный',
  honey: 'Медовик',
  sour_cream: 'Сметанный',
  shortcrust: 'Песочный',
  specialty: 'Авторские',
};

/** Display order for categories. */
const CATEGORY_ORDER: FillingCategory[] = [
  'white',
  'chocolate',
  'honey',
  'sour_cream',
  'shortcrust',
  'specialty',
];

export function StepFilling() {
  const tierCount = useConstructorStore((s) => s.tierCount);
  const shape = useConstructorStore((s) => s.shape);
  const layers = useConstructorStore((s) => s.layers);
  const ingredients = useConstructorStore((s) => s.ingredients);
  const setLayerFilling = useConstructorStore((s) => s.setLayerFilling);

  const [activeTier, setActiveTier] = useState(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const fillings = ingredients?.fillings.filter(
    (f) => f.available && isFillVisualKeyAvailable(shape as CakeShape, f.visualKey),
  ) ?? [];
  const layer = layers[activeTier];

  // Group by category when the API provides it; fall back to a flat list.
  const hasCategoryData = fillings.some((f) => f.category != null);

  const grouped: Array<{ label: string; items: typeof fillings }> = hasCategoryData
    ? CATEGORY_ORDER
        .map((cat) => ({
          label: CATEGORY_LABELS[cat],
          items: fillings.filter((f) => f.category === cat),
        }))
        .filter((g) => g.items.length > 0)
    : [{ label: '', items: fillings }];

  function renderFillingButton(filling: (typeof fillings)[number], idx: number) {
    const isSelected = layer?.fillingId === filling.id;
    const accentColor = FILLING_ACCENTS[idx % FILLING_ACCENTS.length] ?? '#c4a08a';

    return (
      <div
        key={filling.id}
        className="relative"
        onMouseEnter={() => setHoveredId(filling.id)}
        onMouseLeave={() => setHoveredId(null)}
      >
        <motion.button
          variants={itemVariants}
          onClick={() => setLayerFilling(activeTier, filling.id)}
          className={cn(
            'relative flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 ease-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-caramel)] focus-visible:ring-offset-2 w-full',
            isSelected
              ? 'border-[var(--color-caramel)] bg-[var(--color-caramel)]/5'
              : 'border-[var(--border-default)] bg-[var(--surface-elevated)] hover:border-[var(--color-caramel)]/40 hover:shadow-sm'
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
              isSelected ? 'text-[var(--color-caramel)]' : 'text-[var(--color-graphite)]'
            )}>
              {filling.name}
            </p>
            {filling.description && (
              <p className="text-xs text-[var(--color-graphite-light)] mt-0.5 leading-snug lg:hidden">
                {filling.description}
              </p>
            )}
          </div>

          {/* Price */}
          <div className="flex-shrink-0 text-right">
            <p className="text-sm font-semibold text-[var(--color-graphite)]">
              {formatPrice(filling.pricePerKg)}
            </p>
            <p className="text-[10px] text-[var(--color-graphite-light)]">за кг</p>
          </div>

          {/* Check */}
          {isSelected && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[var(--color-caramel)] flex items-center justify-center shadow-sm">
              <Check size={11} className="text-white" strokeWidth={3} />
            </div>
          )}
        </motion.button>

        {/* Hover popover — desktop only, positioned to the left of the panel */}
        <AnimatePresence>
          {hoveredId === filling.id && filling.description && (
            <motion.div
              initial={{ opacity: 0, x: 8, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 8, scale: 0.96 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="absolute right-full top-0 mr-3 w-56 p-3 bg-[var(--surface-elevated)] border border-[var(--border-default)] rounded-[var(--radius-card)] shadow-[var(--shadow-elevated)] pointer-events-none z-50 hidden lg:block"
            >
              {/* Color gradient placeholder */}
              <div
                className="w-full h-24 rounded-xl mb-2.5"
                style={{
                  background: `linear-gradient(135deg, ${accentColor}33, ${accentColor}66)`,
                }}
              />
              {/* Real photo on top when available */}
              {filling.imageUrl && (
                <div className="absolute left-3 right-3 top-3 h-24 overflow-hidden rounded-xl">
                  <Image
                    src={filling.imageUrl}
                    alt={filling.name}
                    fill
                    sizes="224px"
                    className="object-cover"
                  />
                </div>
              )}
              <p className="text-xs font-semibold text-[var(--color-graphite)] mb-1">
                {filling.name}
              </p>
              <p className="text-xs text-[var(--color-graphite-light)] leading-relaxed">
                {filling.description}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <TierTabs
        tierCount={tierCount}
        activeTier={activeTier}
        onSelect={setActiveTier}
        layoutId="tier-tab-filling"
      />

      {/* Filling cards, grouped by category */}
      <div className="flex flex-col gap-4">
        <h3 className="font-heading font-semibold text-[var(--color-graphite)] text-sm uppercase tracking-wide">
          Выберите начинку
        </h3>

        <motion.div
          key={activeTier}
          className="flex flex-col gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {grouped.map(({ label, items }) => (
            <div key={label || 'all'}>
              {label && (
                <p className="text-xs font-semibold text-[var(--color-graphite-light)] uppercase tracking-wider mb-2">
                  {label}
                </p>
              )}
              <div className="flex flex-col gap-2">
                {items.map((filling, idx) => renderFillingButton(filling, idx))}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
