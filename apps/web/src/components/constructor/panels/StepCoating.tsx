'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { useConstructorStore, type CoatingType } from '@/stores/constructor-store';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

const PRESET_COLORS = [
  { hex: '#FFFFFF', label: 'Белый' },
  { hex: '#F4C2C2', label: 'Розовый' },
  { hex: '#A8D8EA', label: 'Голубой' },
  { hex: '#B5EAD7', label: 'Мятный' },
  { hex: '#C3B1E1', label: 'Лавандовый' },
  { hex: '#FFDAB9', label: 'Персиковый' },
  { hex: '#FFF8E7', label: 'Кремовый' },
  { hex: '#2D2D2D', label: 'Чёрный' },
];

const DRIP_COLORS = [
  { hex: '#5C3D2E', label: 'Шоколадный' },
  { hex: '#C4A08A', label: 'Карамельный' },
  { hex: '#FFFFFF', label: 'Белый' },
  { hex: '#2D2D2D', label: 'Тёмный' },
];

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between cursor-pointer select-none group">
      <span className="text-sm font-medium text-[var(--color-dark)] group-hover:text-[var(--color-dusty-rose)] transition-colors">
        {label}
      </span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dusty-rose)] focus-visible:ring-offset-2 cursor-pointer',
          checked ? 'bg-[var(--color-dusty-rose)]' : 'bg-gray-200'
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
  const coating = useConstructorStore((s) => s.coating);
  const ingredients = useConstructorStore((s) => s.ingredients);
  const setCoatingType = useConstructorStore((s) => s.setCoatingType);
  const setCoatingColor = useConstructorStore((s) => s.setCoatingColor);
  const setCoatingId = useConstructorStore((s) => s.setCoatingId);
  const setGradient = useConstructorStore((s) => s.setGradient);
  const setDrips = useConstructorStore((s) => s.setDrips);

  const coatings = ingredients?.coatings ?? [];
  const coatingTypes: { id: CoatingType; label: string }[] = [
    { id: 'cream', label: 'Крем-чиз' },
    { id: 'fondant', label: 'Мастика' },
  ];

  const handleTypeSelect = (type: CoatingType) => {
    setCoatingType(type);
    const match = coatings.find((c) => c.type === type);
    if (match) setCoatingId(match.id);
  };

  const handleGradientToggle = (enabled: boolean) => {
    if (enabled) {
      setGradient({ enabled: true, color2: '#F4C2C2', direction: 'vertical' });
    } else {
      setGradient(null);
    }
  };

  const handleDripsToggle = (enabled: boolean) => {
    if (enabled) {
      setDrips({ enabled: true, color: '#5C3D2E', intensity: 50 });
    } else {
      setDrips(null);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Coating type toggle */}
      <div>
        <h3 className="font-heading font-semibold text-[var(--color-dark)] text-sm mb-3 uppercase tracking-wide">
          Вид покрытия
        </h3>
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
          {coatingTypes.map(({ id, label }) => {
            const isActive = coating.type === id;
            return (
              <button
                key={id}
                onClick={() => handleTypeSelect(id)}
                className={cn(
                  'relative flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ease-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dusty-rose)]',
                  isActive
                    ? 'text-[var(--color-dusty-rose)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-dark)]'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="coating-type"
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

      {/* Color palette */}
      <div>
        <h3 className="font-heading font-semibold text-[var(--color-dark)] text-sm mb-3 uppercase tracking-wide">
          Цвет покрытия
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {PRESET_COLORS.map(({ hex, label }) => {
            const isSelected = coating.color === hex;
            return (
              <button
                key={hex}
                onClick={() => setCoatingColor(hex)}
                title={label}
                className={cn(
                  'relative aspect-square rounded-xl border-2 transition-all duration-150 ease-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dusty-rose)] focus-visible:ring-offset-2 shadow-sm hover:scale-105',
                  isSelected
                    ? 'border-[var(--color-dusty-rose)] scale-105 shadow-md'
                    : 'border-transparent hover:border-[var(--color-soft-peach)]'
                )}
                style={{ backgroundColor: hex }}
              >
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full bg-black/25 flex items-center justify-center">
                      <Check size={11} className="text-white" strokeWidth={3} />
                    </div>
                  </div>
                )}
                <span className="sr-only">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Gradient option */}
      <div className="p-3 bg-white rounded-xl border border-gray-200 flex flex-col gap-3">
        <Toggle
          checked={!!coating.gradient?.enabled}
          onChange={handleGradientToggle}
          label="Градиент"
        />

        <AnimatePresence>
          {coating.gradient?.enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="pt-2 flex flex-col gap-3">
                {/* Second color */}
                <div>
                  <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-2">
                    Второй цвет
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {PRESET_COLORS.map(({ hex, label }) => {
                      const isSelected = coating.gradient?.color2 === hex;
                      return (
                        <button
                          key={hex}
                          title={label}
                          onClick={() =>
                            setGradient({ ...coating.gradient!, color2: hex })
                          }
                          className={cn(
                            'w-8 h-8 rounded-lg border-2 transition-all duration-150 cursor-pointer hover:scale-110',
                            isSelected ? 'border-[var(--color-dusty-rose)] scale-110 shadow-md' : 'border-transparent'
                          )}
                          style={{ backgroundColor: hex }}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Direction */}
                <div>
                  <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-2">
                    Направление
                  </p>
                  <div className="flex gap-2">
                    {(['vertical', 'horizontal'] as const).map((dir) => {
                      const isActive = coating.gradient?.direction === dir;
                      return (
                        <button
                          key={dir}
                          onClick={() =>
                            setGradient({ ...coating.gradient!, direction: dir })
                          }
                          className={cn(
                            'flex-1 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all duration-150 cursor-pointer',
                            isActive
                              ? 'border-[var(--color-dusty-rose)] bg-[var(--color-dusty-rose)]/5 text-[var(--color-dusty-rose)]'
                              : 'border-gray-200 text-[var(--color-text-secondary)] hover:border-[var(--color-soft-peach)]'
                          )}
                        >
                          {dir === 'vertical' ? 'Вертикально' : 'Горизонтально'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Drips option */}
      <div className="p-3 bg-white rounded-xl border border-gray-200 flex flex-col gap-3">
        <Toggle
          checked={!!coating.drips?.enabled}
          onChange={handleDripsToggle}
          label="Подтёки"
        />

        <AnimatePresence>
          {coating.drips?.enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="pt-2 flex flex-col gap-3">
                {/* Drip color */}
                <div>
                  <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-2">
                    Цвет подтёков
                  </p>
                  <div className="flex gap-2">
                    {DRIP_COLORS.map(({ hex, label }) => {
                      const isSelected = coating.drips?.color === hex;
                      return (
                        <button
                          key={hex}
                          title={label}
                          onClick={() =>
                            setDrips({ ...coating.drips!, color: hex })
                          }
                          className={cn(
                            'w-9 h-9 rounded-lg border-2 transition-all duration-150 cursor-pointer hover:scale-110',
                            isSelected ? 'border-[var(--color-dusty-rose)] scale-110 shadow-md' : 'border-gray-200'
                          )}
                          style={{ backgroundColor: hex }}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Intensity */}
                <Slider
                  label="Интенсивность"
                  value={coating.drips?.intensity ?? 50}
                  min={10}
                  max={100}
                  step={5}
                  onChange={(v) => setDrips({ ...coating.drips!, intensity: v })}
                  showValue
                  formatValue={(v) => `${v}%`}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
