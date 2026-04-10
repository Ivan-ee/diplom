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
    <div className="w-full px-4 py-4 bg-white border-b border-neutral-100">
      <div className="flex items-center justify-between relative">
        {/* Connecting lines */}
        <div className="absolute top-4 left-0 right-0 flex items-center px-4 pointer-events-none">
          {STEPS.slice(0, -1).map((_, i) => {
            const isCompleted = currentStep > i + 1;
            return (
              <div key={i} className="flex-1 relative mx-1 h-0.5 bg-neutral-200 overflow-hidden rounded-full">
                <motion.div
                  className="absolute inset-0 bg-[var(--color-dusty-rose)] rounded-full origin-left"
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
                  'relative flex items-center justify-center rounded-full transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dusty-rose)] focus-visible:ring-offset-2',
                  isCompleted && 'w-8 h-8 bg-[var(--color-dusty-rose)] cursor-pointer hover:bg-[var(--color-dusty-rose-hover)]',
                  isActive && 'w-9 h-9 bg-[var(--color-dusty-rose)] shadow-lg shadow-[var(--color-dusty-rose)]/30',
                  isFuture && 'w-8 h-8 bg-white border-2 border-neutral-200 cursor-default'
                )}
              >
                {/* Active ring */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-[var(--color-dusty-rose)]"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1.35, opacity: 0 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'easeOut' }}
                  />
                )}

                {isCompleted ? (
                  <Check size={14} className="text-white" strokeWidth={2.5} />
                ) : (
                  <span
                    className={cn(
                      'text-xs font-semibold',
                      isActive && 'text-white',
                      isFuture && 'text-neutral-400'
                    )}
                  >
                    {step}
                  </span>
                )}
              </button>

              <span
                className={cn(
                  'text-[10px] leading-none whitespace-nowrap transition-colors duration-200 text-neutral-400',
                  isActive && 'text-[var(--color-dusty-rose)] font-medium',
                  isCompleted && 'text-[var(--color-dusty-rose-hover)]',
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
