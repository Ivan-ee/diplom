'use client';

import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { useConstructorStore } from '@/stores/constructor-store';
import { getAvailableDecos, type CakeShape } from '@/lib/constructor/model-registry';
import { Toggle } from '@/components/constructor/panels/StepCoating';
import { cn } from '@/lib/utils';

export function StepDecor() {
  const shape = useConstructorStore((s) => s.shape);
  const activeDecorations = useConstructorStore((s) => s.activeDecorations);
  const hasCandle = useConstructorStore((s) => s.hasCandle);
  const inscription = useConstructorStore((s) => s.inscription);
  const addDecoration = useConstructorStore((s) => s.addDecoration);
  const removeDecoration = useConstructorStore((s) => s.removeDecoration);
  const clearDecorations = useConstructorStore((s) => s.clearDecorations);
  const setHasCandle = useConstructorStore((s) => s.setHasCandle);
  const setInscription = useConstructorStore((s) => s.setInscription);
  const getConfig = useConstructorStore((s) => s.getConfig);

  const decoOptions = getAvailableDecos(shape as CakeShape);
  const maxLength = getConfig()?.maxInscriptionLength ?? 50;
  const maxDecorations = getConfig()?.maxDecorations ?? 3;
  const isMaxReached = activeDecorations.length >= maxDecorations;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading font-semibold text-[var(--color-graphite)] text-sm uppercase tracking-wide">
            Украшения
          </h3>
          <span
            className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full transition-colors',
              isMaxReached
                ? 'bg-[var(--color-caramel)]/10 text-[var(--color-caramel)]'
                : 'text-[var(--color-graphite-light)]'
            )}
          >
            {activeDecorations.length}/{maxDecorations}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {decoOptions.map((option) => {
            const isActive = activeDecorations.includes(option.id);
            const handleClick = () => {
              if (isActive) {
                removeDecoration(option.id);
              } else {
                addDecoration(option.id);
              }
            };

            return (
              <motion.button
                key={option.id}
                onClick={handleClick}
                disabled={!isActive && isMaxReached}
                className={cn(
                  'relative flex flex-col items-start gap-1 p-3 rounded-xl border-2 text-left transition-all duration-150 ease-out cursor-pointer',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-caramel)] focus-visible:ring-offset-2',
                  isActive
                    ? 'border-[var(--color-caramel)] bg-[var(--color-caramel)]/5 shadow-sm'
                    : isMaxReached
                      ? 'border-[var(--color-champagne)] opacity-40 cursor-not-allowed'
                      : 'border-[var(--color-champagne)] hover:border-[var(--color-caramel)]/40'
                )}
                whileTap={!isMaxReached || isActive ? { scale: 0.985 } : undefined}
              >
                <div className="flex items-start justify-between w-full gap-1">
                  <span className="text-xs font-semibold text-[var(--color-graphite)] leading-tight">
                    {option.label}
                  </span>
                  <div
                    className={cn(
                      'w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors',
                      isActive
                        ? 'bg-[var(--color-caramel)] border-[var(--color-caramel)]'
                        : 'border-[var(--color-champagne)] bg-transparent'
                    )}
                  >
                    {isActive && <Check size={9} className="text-white" strokeWidth={3} />}
                  </div>
                </div>
                <span className="text-[10px] text-[var(--color-graphite-light)] leading-tight">
                  {option.description}
                </span>
              </motion.button>
            );
          })}

          <button
            onClick={clearDecorations}
            disabled={activeDecorations.length === 0}
            className={cn(
              'col-span-2 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all duration-150 ease-out cursor-pointer',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-caramel)] focus-visible:ring-offset-2',
              activeDecorations.length === 0
                ? 'border-[var(--color-caramel)] bg-[var(--color-caramel)]/5 shadow-sm opacity-40 cursor-not-allowed'
                : 'border-[var(--color-champagne)] hover:border-[var(--color-caramel)]/40'
            )}
          >
            <X size={12} className="text-[var(--color-graphite-light)]" />
            <span className="text-xs font-semibold text-[var(--color-graphite)]">
              Убрать все украшения
            </span>
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
