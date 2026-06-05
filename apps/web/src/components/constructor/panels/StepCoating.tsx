'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useConstructorStore } from '@/stores/constructor-store';
import {
  getAvailableGlazes,
  isGlazeVisualKeyAvailable,
  type CakeShape,
} from '@/lib/constructor/model-registry';
import { cn, formatPrice } from '@/lib/utils';

export function StepCoating() {
  const shape = useConstructorStore((s) => s.shape);
  const coating = useConstructorStore((s) => s.coating);
  const ingredients = useConstructorStore((s) => s.ingredients);
  const setCoatingId = useConstructorStore((s) => s.setCoatingId);

  const coatings = ingredients?.coatings ?? [];
  const shapeGlazeOptions = useMemo(() => getAvailableGlazes(shape as CakeShape), [shape]);
  const visibleCoatings = useMemo(
    () =>
      coatings.filter((coating) =>
        coating.available && isGlazeVisualKeyAvailable(shape as CakeShape, coating.visualKey),
      ),
    [coatings, shape],
  );
  const glazeMetaById = useMemo(
    () => new Map(shapeGlazeOptions.map((option) => [option.id, option])),
    [shapeGlazeOptions],
  );

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="font-heading font-semibold text-[var(--color-graphite)] text-sm mb-3 uppercase tracking-wide">
          Вид покрытия
        </h3>
        <div className="flex flex-col gap-2">
          <motion.button
            onClick={() => setCoatingId('')}
            className={cn(
              'relative flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 ease-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-caramel)] focus-visible:ring-offset-2',
              !coating.coatingId
                ? 'border-[var(--color-caramel)] bg-[var(--color-caramel)]/5'
                : 'border-[var(--border-default)] bg-[var(--surface-elevated)] hover:border-[var(--color-caramel)]/40 hover:shadow-sm'
            )}
            whileTap={{ scale: 0.985 }}
          >
            <div className="w-10 h-10 rounded-lg flex-shrink-0 border border-dashed border-[var(--border-default)] bg-[var(--surface-elevated)]" />

            <div className="flex-1 min-w-0">
              <p className={cn(
                'text-sm font-semibold leading-tight',
                !coating.coatingId ? 'text-[var(--color-caramel)]' : 'text-[var(--color-graphite)]'
              )}>
                Без покрытия
              </p>
              <p className="text-xs text-[var(--color-graphite-light)] mt-0.5 leading-snug">
                Только выбранный вид бисквита
              </p>
            </div>

            <div className="flex-shrink-0 text-right pr-7">
              <p className="text-sm font-semibold text-[var(--color-graphite)]">0 ₽</p>
              <p className="text-[10px] text-[var(--color-graphite-light)]">без доплаты</p>
            </div>

            {!coating.coatingId && (
              <div className="absolute right-3 top-3 w-5 h-5 rounded-full bg-[var(--color-caramel)] flex items-center justify-center shadow-sm">
                <Check size={11} className="text-white" strokeWidth={3} />
              </div>
            )}
          </motion.button>

          {visibleCoatings.map((coatingOption) => {
            const meta = glazeMetaById.get(coatingOption.visualKey);
            const isActive = coating.coatingId === coatingOption.id;
            return (
              <motion.button
                key={coatingOption.id}
                onClick={() => setCoatingId(coatingOption.id)}
                className={cn(
                  'relative flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 ease-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-caramel)] focus-visible:ring-offset-2',
                  isActive
                    ? 'border-[var(--color-caramel)] bg-[var(--color-caramel)]/5'
                    : 'border-[var(--border-default)] bg-[var(--surface-elevated)] hover:border-[var(--color-caramel)]/40 hover:shadow-sm'
                )}
                whileTap={{ scale: 0.985 }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex-shrink-0 border border-black/10 shadow-sm"
                  style={{ backgroundColor: meta?.color ?? '#FFF5E0' }}
                />

                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-semibold leading-tight',
                    isActive ? 'text-[var(--color-caramel)]' : 'text-[var(--color-graphite)]'
                  )}>
                    {coatingOption.name}
                  </p>
                  {meta?.label && (
                    <p className="text-xs text-[var(--color-graphite-light)] mt-0.5 leading-snug">
                      {meta.label}
                    </p>
                  )}
                </div>

                <div className="flex-shrink-0 text-right pr-7">
                  <p className="text-sm font-semibold text-[var(--color-graphite)]">
                    {formatPrice(coatingOption.pricePerKg)}
                  </p>
                  <p className="text-[10px] text-[var(--color-graphite-light)]">за кг</p>
                </div>

                {isActive && (
                  <div className="absolute right-3 top-3 w-5 h-5 rounded-full bg-[var(--color-caramel)] flex items-center justify-center shadow-sm">
                    <Check size={11} className="text-white" strokeWidth={3} />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
