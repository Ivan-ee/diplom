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
      setGradient({ enabled: true, gradientEndColor: '#F4C2C2', direction: 'vertical' });
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
          Цвет покрытия
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {PRESET_COLORS.map(({ hex, label }) => {
            const isSelected = coating.color === hex;
            return (
              <button
                key={hex}
                onClick={() => setCoatingColor(hex)}
                title={label}
                className={cn(
                  'w-full aspect-square rounded-xl border-2 cursor-pointer transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-caramel)] focus-visible:ring-offset-2',
                  isSelected
                    ? 'border-[var(--color-caramel)] scale-105 shadow-sm'
                    : 'border-transparent hover:border-[var(--border-default)] hover:scale-105'
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
        <div className="mt-3 flex items-center gap-3">
          <label className="relative flex-1 group cursor-pointer">
            <input
              type="color"
              value={coating.color}
              onChange={(e) => setCoatingColor(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-[var(--color-champagne)] group-hover:border-[var(--color-caramel)] transition-colors duration-150">
              <div
                className="w-6 h-6 rounded-lg border border-[var(--color-champagne)] shadow-sm flex-shrink-0"
                style={{ backgroundColor: coating.color }}
              />
              <span className="text-xs font-medium text-[var(--color-graphite-light)] group-hover:text-[var(--color-graphite)] transition-colors">
                Свой цвет
              </span>
            </div>
          </label>
        </div>
      </div>

      <div className="p-3 bg-[var(--surface-elevated)] rounded-[var(--radius-control)] border border-[var(--border-default)] flex flex-col gap-3">
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
                <div>
                  <p className="text-xs font-medium text-[var(--color-graphite-light)] mb-2">
                    Второй цвет
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {PRESET_COLORS.map(({ hex, label }) => {
                      const isSelected = coating.gradient?.gradientEndColor === hex;
                      return (
                        <button
                          key={hex}
                          title={label}
                          onClick={() =>
                            setGradient({ ...coating.gradient!, gradientEndColor: hex })
                          }
                          className={cn(
                            'w-8 h-8 rounded-lg border-2 transition-all duration-150 cursor-pointer hover:scale-110',
                            isSelected ? 'border-[var(--color-caramel)] scale-110 shadow-md' : 'border-transparent'
                          )}
                          style={{ backgroundColor: hex }}
                        />
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-[var(--color-graphite-light)] mb-2">
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
                              ? 'border-[var(--color-caramel)] bg-[var(--color-caramel)]/5 text-[var(--color-caramel)]'
                              : 'border-[var(--color-champagne)] text-[var(--color-graphite-light)] hover:border-[var(--color-champagne)]'
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

      <div className="p-3 bg-[var(--surface-elevated)] rounded-[var(--radius-control)] border border-[var(--border-default)] flex flex-col gap-3">
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
                <div>
                  <p className="text-xs font-medium text-[var(--color-graphite-light)] mb-2">
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
                            isSelected ? 'border-[var(--color-caramel)] scale-110 shadow-md' : 'border-[var(--color-champagne)]'
                          )}
                          style={{ backgroundColor: hex }}
                        />
                      );
                    })}
                  </div>
                </div>

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
