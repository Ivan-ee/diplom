'use client';

import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { useConstructorStore } from '@/stores/constructor-store';
import { getAvailableDecos, type CakeShape } from '@/lib/constructor/model-registry';
import { Toggle } from '@/components/constructor/panels/StepCoating';
import { cn } from '@/lib/utils';

export function StepDecor() {
  const shape = useConstructorStore((s) => s.shape);
  const decorVariant = useConstructorStore((s) => s.decorVariant);
  const hasCandle = useConstructorStore((s) => s.hasCandle);
  const inscription = useConstructorStore((s) => s.inscription);
  const setDecorVariant = useConstructorStore((s) => s.setDecorVariant);
  const setHasCandle = useConstructorStore((s) => s.setHasCandle);
  const setInscription = useConstructorStore((s) => s.setInscription);
  const getConfig = useConstructorStore((s) => s.getConfig);

  const decoOptions = getAvailableDecos(shape as CakeShape);
  const maxLength = getConfig()?.maxInscriptionLength ?? 50;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="font-heading font-semibold text-[var(--color-graphite)] text-sm mb-3 uppercase tracking-wide">
          Стиль украшения
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {decoOptions.map((option) => {
            const isActive = decorVariant === option.id;
            return (
              <button
                key={option.id}
                onClick={() => setDecorVariant(option.id)}
                className={cn(
                  'relative flex flex-col items-start gap-1 p-3 rounded-xl border-2 text-left transition-all duration-150 ease-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-caramel)] focus-visible:ring-offset-2',
                  isActive
                    ? 'border-[var(--color-caramel)] bg-[var(--color-caramel)]/5 shadow-sm'
                    : 'border-[var(--color-champagne)] hover:border-[var(--color-caramel)]/40'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="deco-variant"
                    className="absolute inset-0 rounded-xl bg-[var(--color-caramel)]/5"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <div className="relative z-10 flex items-start justify-between w-full gap-1">
                  <span className="text-xs font-semibold text-[var(--color-graphite)] leading-tight">
                    {option.label}
                  </span>
                  {isActive && (
                    <div className="w-4 h-4 rounded-full bg-[var(--color-caramel)] flex items-center justify-center flex-shrink-0">
                      <Check size={9} className="text-white" strokeWidth={3} />
                    </div>
                  )}
                </div>
                <span className="relative z-10 text-[10px] text-[var(--color-graphite-light)] leading-tight">
                  {option.description}
                </span>
              </button>
            );
          })}

          <button
            onClick={() => setDecorVariant(null)}
            className={cn(
              'relative col-span-2 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all duration-150 ease-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-caramel)] focus-visible:ring-offset-2',
              decorVariant === null
                ? 'border-[var(--color-caramel)] bg-[var(--color-caramel)]/5 shadow-sm'
                : 'border-[var(--color-champagne)] hover:border-[var(--color-caramel)]/40'
            )}
          >
            {decorVariant === null && (
              <motion.div
                layoutId="deco-variant"
                className="absolute inset-0 rounded-xl bg-[var(--color-caramel)]/5"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 text-xs font-semibold text-[var(--color-graphite)]">
              Без украшений
            </span>
            {decorVariant === null && (
              <div className="relative z-10 w-4 h-4 rounded-full bg-[var(--color-caramel)] flex items-center justify-center">
                <Check size={9} className="text-white" strokeWidth={3} />
              </div>
            )}
          </button>
        </div>
      </div>

      <div className="p-3 bg-[var(--surface-elevated)] rounded-[var(--radius-control)] border border-[var(--border-default)]">
        <Toggle
          checked={hasCandle}
          onChange={setHasCandle}
          label="Добавить свечу"
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-semibold text-[var(--color-graphite)] text-sm uppercase tracking-wide">
            Надпись на торте
          </h3>
          <span
            className={cn(
              'text-xs font-medium',
              inscription.length >= maxLength
                ? 'text-red-500'
                : inscription.length > maxLength * 0.8
                ? 'text-orange-500'
                : 'text-[var(--color-graphite-light)]'
            )}
          >
            {inscription.length}/{maxLength}
          </span>
        </div>
        <div className="relative">
          <input
            type="text"
            value={inscription}
            onChange={(e) => setInscription(e.target.value)}
            placeholder="Например: «С Днём Рождения, Аня!»"
            maxLength={maxLength}
            className={cn(
              'w-full px-4 py-3 rounded-xl border text-sm text-[var(--color-graphite)] placeholder:text-[var(--color-graphite-light)]/40 bg-[var(--color-milk-white)] transition-colors outline-none',
              'border-[var(--color-champagne)] focus:border-[var(--color-caramel)] focus:ring-1 focus:ring-[var(--color-caramel)]/30'
            )}
          />
          {inscription.length > 0 && (
            <button
              onClick={() => setInscription('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[var(--surface-secondary)] hover:bg-[var(--border-default)] flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={10} className="text-[var(--color-graphite-light)]" />
            </button>
          )}
        </div>
        <p className="text-xs text-[var(--color-graphite-light)]">
          Надпись наносится кремом или шоколадом по желанию
        </p>
      </div>
    </div>
  );
}
