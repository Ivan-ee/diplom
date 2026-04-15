'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useConstructorStore, type CoatingType } from '@/stores/constructor-store';
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

export function StepCoating() {
  const shape = useConstructorStore((s) => s.shape);
  const coating = useConstructorStore((s) => s.coating);
  const ingredients = useConstructorStore((s) => s.ingredients);
  const setCoatingType = useConstructorStore((s) => s.setCoatingType);
  const setCoatingId = useConstructorStore((s) => s.setCoatingId);
  const setGlazeVariant = useConstructorStore((s) => s.setGlazeVariant);
  const setWithDrips = useConstructorStore((s) => s.setWithDrips);

  const coatings = ingredients?.coatings ?? [];
  const glazeOptions = getAvailableGlazes(shape as CakeShape);
  const selectedGlaze = glazeOptions.find((g) => g.id === coating.glazeVariant);
  const canHaveDrips = selectedGlaze?.hasDripsVariant ?? false;

  const coatingTypes: { id: CoatingType; label: string }[] = [
    { id: 'cream', label: 'Крем-чиз' },
    { id: 'fondant', label: 'Мастика' },
  ];

  const handleTypeSelect = (type: CoatingType) => {
    setCoatingType(type);
    const match = coatings.find((c) => c.type === type);
    if (match) setCoatingId(match.id);
  };

  useEffect(() => {
    if (!canHaveDrips && coating.withDrips) {
      setWithDrips(false);
    }
  }, [coating.glazeVariant, canHaveDrips, coating.withDrips, setWithDrips]);

  return (
    <div className="flex flex-col gap-5">
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

      <div>
        <h3 className="font-heading font-semibold text-[var(--color-graphite)] text-sm mb-3 uppercase tracking-wide">
          Вариант глазури
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {glazeOptions.map((option) => {
            const isActive = coating.glazeVariant === option.id;
            return (
              <button
                key={option.id}
                onClick={() => setGlazeVariant(option.id)}
                className={cn(
                  'relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-150 ease-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-caramel)] focus-visible:ring-offset-2',
                  isActive
                    ? 'border-[var(--color-caramel)] bg-[var(--color-caramel)]/5 scale-105 shadow-sm'
                    : 'border-[var(--color-champagne)] hover:border-[var(--color-caramel)]/40 hover:scale-[1.02]'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="glaze-variant"
                    className="absolute inset-0 rounded-xl bg-[var(--color-caramel)]/5"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <div
                  className="relative z-10 w-8 h-8 rounded-full border border-[var(--color-champagne)] shadow-sm flex-shrink-0"
                  style={{ backgroundColor: option.color }}
                />
                <span className="relative z-10 text-xs font-medium text-[var(--color-graphite)] text-center leading-tight">
                  {option.label}
                </span>
                {isActive && (
                  <div className="absolute top-1.5 right-1.5 z-10 w-4 h-4 rounded-full bg-[var(--color-caramel)] flex items-center justify-center">
                    <Check size={9} className="text-white" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {canHaveDrips && (
        <div className="p-3 bg-[var(--surface-elevated)] rounded-[var(--radius-control)] border border-[var(--border-default)]">
          <Toggle
            checked={coating.withDrips}
            onChange={setWithDrips}
            label="С подтёками"
          />
        </div>
      )}
    </div>
  );
}
