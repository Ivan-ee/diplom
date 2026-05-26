'use client';

import { useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useConstructorStore } from '@/stores/constructor-store';
import { StepProgressBar } from './StepProgressBar';
import { StepShape } from './StepShape';
import { StepBase } from './StepBase';
import { StepFilling } from './StepFilling';
import { StepCoating } from './StepCoating';
import { StepDecor } from './StepDecor';
import { PriceCalculator } from './PriceCalculator';
import { StepNavigation } from './StepNavigation';

const STEP_COMPONENTS = {
  1: StepShape,
  2: StepBase,
  3: StepFilling,
  4: StepCoating,
  5: StepDecor,
} as const;

const slideVariants = {
  enter: (direction: number) => ({
    x: direction >= 0 ? 40 : -40,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction >= 0 ? -40 : 40,
    opacity: 0,
  }),
};

export function SettingsPanel({ showFooter = true }: { showFooter?: boolean }) {
  const currentStep = useConstructorStore((s) => s.currentStep);
  const isLoading = useConstructorStore((s) => s.isLoading);
  const prevStepRef = useRef(currentStep);

  // Direction: +1 = moving forward, -1 = moving back
  const direction = currentStep >= prevStepRef.current ? 1 : -1;
  prevStepRef.current = currentStep;

  const StepComponent = STEP_COMPONENTS[currentStep];

  return (
    <div className="flex flex-col h-full bg-[var(--color-warm-ivory)]">
      <StepProgressBar />

      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="p-4">
          {isLoading ? (
            <SettingsSkeleton />
          ) : (
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  duration: 0.22,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              >
                <StepComponent />
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {showFooter && (
        <div className="flex-shrink-0">
          <CompactSpecSummary />
          <PriceCalculator />
          <StepNavigation />
        </div>
      )}
    </div>
  );
}

function CompactSpecSummary() {
  const shape = useConstructorStore((s) => s.shape);
  const tierCount = useConstructorStore((s) => s.tierCount);
  const layers = useConstructorStore((s) => s.layers);
  const coating = useConstructorStore((s) => s.coating);
  const decorationInstances = useConstructorStore((s) => s.decorationInstances);
  const ingredients = useConstructorStore((s) => s.ingredients);
  const safeLayers = Array.isArray(layers) ? layers : [];
  const safeDecorationInstances = Array.isArray(decorationInstances) ? decorationInstances : [];

  const totalWeight = safeLayers.reduce((sum, layer) => sum + layer.weight, 0);
  const shapeName = ingredients?.shapes.find((item) => item.id === shape)?.name ?? shape;
  const coatingName = ingredients?.coatings.find((item) => item.id === coating.coatingId)?.name ?? 'не выбрано';

  return (
    <div className="border-t border-[var(--border-default)] bg-[var(--surface-elevated)] px-4 py-3">
      <div className="grid grid-cols-4 gap-2 text-xs">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-[var(--color-graphite-light)]">Форма</p>
          <p className="truncate font-semibold text-[var(--color-graphite)]">{shapeName}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-[var(--color-graphite-light)]">Ярусы</p>
          <p className="font-semibold text-[var(--color-graphite)]">{tierCount}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-[var(--color-graphite-light)]">Вес</p>
          <p className="font-semibold text-[var(--color-graphite)]">
            {totalWeight >= 1000 ? `${totalWeight / 1000} кг` : `${totalWeight} г`}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-[var(--color-graphite-light)]">Декор</p>
          <p className="font-semibold text-[var(--color-graphite)]">{safeDecorationInstances.length}</p>
        </div>
      </div>
      <p className="mt-2 truncate text-xs text-[var(--color-graphite-light)]">
        Покрытие: <span className="text-[var(--color-graphite)]">{coatingName}</span>
      </p>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="h-4 w-24 bg-[var(--color-champagne)] rounded-full" />
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-[var(--color-champagne)]" />
        ))}
      </div>
      <div className="h-4 w-32 bg-[var(--color-champagne)] rounded-full mt-2" />
      <div className="h-12 rounded-xl bg-[var(--color-champagne)]" />
      <div className="h-4 w-20 bg-[var(--color-champagne)] rounded-full mt-2" />
      <div className="flex flex-col gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-[var(--color-champagne)]" />
        ))}
      </div>
    </div>
  );
}
