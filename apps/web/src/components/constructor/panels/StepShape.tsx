'use client';

import { motion } from 'framer-motion';
import { useConstructorStore, type CakeShape, type TierCount } from '@/stores/constructor-store';
import { cn } from '@/lib/utils';

const SHAPES: { id: CakeShape; label: string; icon: string; description: string }[] = [
  { id: 'circle', label: 'Круглый', icon: '⭕', description: 'Классическая форма' },
  { id: 'square', label: 'Квадратный', icon: '⬜', description: '+10% к цене' },
  { id: 'heart', label: 'Сердце', icon: '❤️', description: '+15% к цене' },
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

  return (
    <div className="flex flex-col gap-6">
      {/* Section: Shape */}
      <div>
        <h3 className="font-heading font-semibold text-[var(--color-dark)] text-sm mb-3 uppercase tracking-wide">
          Форма торта
        </h3>
        <motion.div
          className="grid grid-cols-3 gap-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {SHAPES.map(({ id, label, icon, description }) => {
            const isSelected = shape === id;
            return (
              <motion.button
                key={id}
                variants={itemVariants}
                onClick={() => setShape(id)}
                className={cn(
                  'relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ease-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dusty-rose)] focus-visible:ring-offset-2',
                  isSelected
                    ? 'border-[var(--color-dusty-rose)] bg-[var(--color-dusty-rose)]/5 shadow-md shadow-[var(--color-dusty-rose)]/15'
                    : 'border-gray-200 bg-white hover:border-[var(--color-soft-peach)] hover:bg-[var(--color-cream)] hover:shadow-sm'
                )}
                whileTap={{ scale: 0.97 }}
              >
                {isSelected && (
                  <motion.div
                    layoutId="shape-selection"
                    className="absolute inset-0 rounded-[10px] border-2 border-[var(--color-dusty-rose)]"
                    transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                  />
                )}
                <span className="text-2xl leading-none">{icon}</span>
                <div className="text-center">
                  <p className={cn(
                    'text-sm font-semibold leading-tight',
                    isSelected ? 'text-[var(--color-dusty-rose)]' : 'text-[var(--color-dark)]'
                  )}>
                    {label}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-secondary)] mt-0.5 leading-tight">
                    {description}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/* Section: Tiers */}
      <div>
        <h3 className="font-heading font-semibold text-[var(--color-dark)] text-sm mb-3 uppercase tracking-wide">
          Количество ярусов
        </h3>
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
          {TIERS.map((t) => {
            const isActive = tierCount === t;
            return (
              <button
                key={t}
                onClick={() => setTierCount(t)}
                className={cn(
                  'relative flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dusty-rose)] focus-visible:ring-offset-1 cursor-pointer',
                  isActive
                    ? 'bg-white text-[var(--color-dusty-rose)] shadow-sm'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-dark)]'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="tier-selection"
                    className="absolute inset-0 bg-white rounded-lg shadow-sm"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{TIER_LABELS[t]}</span>
              </button>
            );
          })}
        </div>

        {/* Tier surcharge info */}
        {tierCount > 1 && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-xs text-[var(--color-text-secondary)] text-center"
          >
            {tierCount === 2 ? '+ 300 ₽ за многоярусность' : '+ 600 ₽ за многоярусность'}
          </motion.p>
        )}
      </div>

      {/* Hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-start gap-2.5 p-3 bg-[var(--color-cream)] rounded-lg border border-[var(--color-soft-peach)]"
      >
        <span className="text-base leading-none mt-0.5">💡</span>
        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
          Форма торта влияет на сложность приготовления. Круглая — классика, сердце и квадрат требуют дополнительной обработки.
        </p>
      </motion.div>
    </div>
  );
}
