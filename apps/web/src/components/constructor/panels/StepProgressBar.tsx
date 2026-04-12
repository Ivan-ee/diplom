'use client';

import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useConstructorStore, type ConstructorStep } from '@/stores/constructor-store';
import { cn } from '@/lib/utils';

const STEPS: { step: ConstructorStep; label: string }[] = [
  { step: 1, label: 'Форма' },
  { step: 2, label: 'Основа' },
  { step: 3, label: 'Начинка' },
  { step: 4, label: 'Покрытие' },
  { step: 5, label: 'Декор' },
];

export function StepProgressBar() {
  const currentStep = useConstructorStore((s) => s.currentStep);
  const setStep = useConstructorStore((s) => s.setStep);

  return (
    <div className="w-full px-4 py-4 bg-[var(--color-milk-white)] border-b border-[var(--color-champagne)]">
      <div className="flex items-center justify-between relative">
        {/* Connecting lines */}
        <div className="absolute top-4 left-0 right-0 flex items-center px-4 pointer-events-none">
          {STEPS.slice(0, -1).map((_, i) => {
            const isCompleted = currentStep > i + 1;
            return (
              <div key={i} className="flex-1 relative mx-1 h-0.5 bg-[var(--border-default)] overflow-hidden rounded-full">
                <motion.div
                  className="absolute inset-0 bg-[var(--color-caramel)] rounded-full origin-left"
                  initial={false}
                  animate={{ scaleX: isCompleted ? 1 : 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                />
              </div>
            );
          })}
        </div>

        {/* Step dots */}
        {STEPS.map(({ step, label }) => {
          const isCompleted = currentStep > step;
          const isActive = currentStep === step;
          const isFuture = currentStep < step;

          return (
            <div
              key={step}
              className="flex flex-col items-center gap-1.5 z-10"
            >
              <button
                onClick={() => {
                  // Only allow navigating to completed steps or current step
                  if (!isFuture) setStep(step);
                }}
                disabled={isFuture}
                className={cn(
                  'relative flex items-center justify-center rounded-full transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-caramel)] focus-visible:ring-offset-2',
                  isCompleted && 'w-7 h-7 bg-[var(--color-caramel)] cursor-pointer hover:bg-[var(--color-caramel-hover)]',
                  isActive && 'w-8 h-8 bg-[var(--color-caramel)] shadow-md shadow-[var(--color-caramel)]/20',
                  isFuture && 'w-7 h-7 bg-[var(--surface-secondary)] border border-[var(--border-default)] cursor-default'
                )}
              >
                {/* Active ring */}

                {isCompleted ? (
                  <Check size={14} className="text-white" strokeWidth={2.5} />
                ) : (
                  <span
                    className={cn(
                      'text-xs font-semibold',
                      isActive && 'text-white',
                      isFuture && 'text-[var(--color-graphite-light)]/60'
                    )}
                  >
                    {step}
                  </span>
                )}
              </button>

              <span
                className={cn(
                  'text-[length:var(--text-micro)] leading-none whitespace-nowrap transition-colors duration-200 text-[var(--color-graphite-light)]/60',
                  isActive && 'text-[var(--color-caramel)] font-medium',
                  isCompleted && 'text-[var(--color-caramel-hover)]',
                )}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
