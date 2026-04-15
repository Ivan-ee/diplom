'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useConstructorStore, type CoatingType, type ColorMode } from '@/stores/constructor-store';
import { getAvailableGlazes, type CakeShape } from '@/lib/constructor/model-registry';
import { cn } from '@/lib/utils';

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between cursor-pointer select-none group">
      <span className="text-sm font-medium text-[var(--color-graphite)] group-hover:text-[var(--color-caramel)] transition-colors">
        {label}
      </span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-caramel)] focus-visible:ring-offset-2 cursor-pointer',
          checked ? 'bg-[var(--color-caramel)]' : 'bg-[var(--color-champagne)]'
        )}
      >
        <motion.div
          className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm"
          animate={{ x: checked ? 20 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </label>
  );
}

function GlazePalette({
  glazeOptions,
  activeId,
  onSelect,
}: {
  glazeOptions: ReturnType<typeof getAvailableGlazes>;
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {glazeOptions.map((option) => {
        const isActive = activeId === option.id;
        return (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className="flex flex-col items-center gap-1.5 group cursor-pointer focus-visible:outline-none"
          >
            <div
              className={cn(
                'w-10 h-10 rounded-full border-2 shadow-sm transition-all duration-200 flex items-center justify-center',
                isActive
                  ? 'border-[var(--color-caramel)] scale-110 ring-2 ring-[var(--color-caramel)]/20'
                  : 'border-[var(--color-champagne)] group-hover:border-[var(--color-caramel)]/40 group-hover:scale-105'
              )}
              style={{ backgroundColor: option.color }}
            >
              {isActive && (
                <Check size={14} className="text-[var(--color-graphite)]" strokeWidth={2.5} />
              )}
            </div>
            <span
              className={cn(
                'text-[10px] font-medium transition-colors',
                isActive ? 'text-[var(--color-caramel)]' : 'text-[var(--color-graphite-light)]'
              )}
            >
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function StepCoating() {
  const shape = useConstructorStore((s) => s.shape);
  const coating = useConstructorStore((s) => s.coating);
  const ingredients = useConstructorStore((s) => s.ingredients);
  const setCoatingType = useConstructorStore((s) => s.setCoatingType);
  const setCoatingId = useConstructorStore((s) => s.setCoatingId);
  const setGlazeVariant = useConstructorStore((s) => s.setGlazeVariant);
  const setColorMode = useConstructorStore((s) => s.setColorMode);
  const setSecondaryGlazeVariant = useConstructorStore((s) => s.setSecondaryGlazeVariant);

  const coatings = ingredients?.coatings ?? [];
  const glazeOptions = getAvailableGlazes(shape as CakeShape);

  const coatingTypes: { id: CoatingType; label: string }[] = [
    { id: 'cream', label: 'Крем-чиз' },
    { id: 'fondant', label: 'Мастика' },
  ];

  const colorModes: { id: ColorMode; label: string }[] = [
    { id: 'solid', label: 'Однотон' },
    { id: 'gradient', label: 'Градиент' },
    { id: 'splashes', label: 'Брызги' },
  ];

  const handleTypeSelect = (type: CoatingType) => {
    setCoatingType(type);
    const match = coatings.find((c) => c.type === type);
    if (match) setCoatingId(match.id);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Секция 1 — Вид покрытия */}
      <div>
        <h3 className="font-heading font-semibold text-[var(--color-graphite)] text-sm mb-3 uppercase tracking-wide">
          Вид покрытия
        </h3>
        <div className="flex gap-1 p-1 bg-[var(--color-champagne)]/40 rounded-xl">
          {coatingTypes.map(({ id, label }) => {
            const isActive = coating.type === id;
            return (
              <button
                key={id}
                onClick={() => handleTypeSelect(id)}
                className={cn(
                  'relative flex-1 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-caramel)]',
                  isActive
                    ? 'text-[var(--color-graphite)]'
                    : 'text-[var(--color-graphite-light)] hover:text-[var(--color-graphite)]'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="coating-type"
                    className="absolute inset-0 bg-[var(--color-milk-white)] rounded-lg shadow-sm"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Секция 2 — Цветовая палитра */}
      <div>
        <h3 className="font-heading font-semibold text-[var(--color-graphite)] text-sm mb-3 uppercase tracking-wide">
          Цвет покрытия
        </h3>
        <GlazePalette
          glazeOptions={glazeOptions}
          activeId={coating.glazeVariant}
          onSelect={setGlazeVariant}
        />
      </div>

      {/* Секция 3 — Режим покрытия */}
      <div>
        <h3 className="font-heading font-semibold text-[var(--color-graphite)] text-sm mb-3 uppercase tracking-wide">
          Режим покрытия
        </h3>
        <div className="flex gap-1 p-1 bg-[var(--color-champagne)]/40 rounded-xl">
          {colorModes.map(({ id, label }) => {
            const isActive = coating.colorMode === id;
            return (
              <button
                key={id}
                onClick={() => setColorMode(id)}
                className={cn(
                  'relative flex-1 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-caramel)]',
                  isActive
                    ? 'text-[var(--color-graphite)]'
                    : 'text-[var(--color-graphite-light)] hover:text-[var(--color-graphite)]'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="color-mode"
                    className="absolute inset-0 bg-white rounded-lg shadow-sm"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Секция 4 — Второй цвет (только для градиента) */}
      <AnimatePresence>
        {coating.colorMode === 'gradient' && (
          <motion.div
            key="secondary-color"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 pt-1">
              <h3 className="font-heading font-semibold text-[var(--color-graphite)] text-sm uppercase tracking-wide">
                Цвет 2 (градиент)
              </h3>
              <GlazePalette
                glazeOptions={glazeOptions}
                activeId={coating.secondaryGlazeVariant ?? ''}
                onSelect={setSecondaryGlazeVariant}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Подсказка */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="flex items-start gap-2.5 p-3 bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-control)]"
      >
        <span className="text-base leading-none mt-0.5">🎨</span>
        <p className="text-xs text-[var(--color-graphite-light)] leading-relaxed">
          Градиент создаёт плавный переход между двумя цветами. Брызги добавляют шоколадные подтёки.
        </p>
      </motion.div>
    </div>
  );
}
