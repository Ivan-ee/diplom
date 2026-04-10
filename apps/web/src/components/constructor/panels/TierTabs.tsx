'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { TierCount } from '@/stores/constructor-store';

interface TierTabsProps {
  tierCount: TierCount;
  activeTier: number;
  onSelect: (index: number) => void;
  layoutId: string;
}

export function TierTabs({ tierCount, activeTier, onSelect, layoutId }: TierTabsProps) {
  if (tierCount <= 1) return null;

  return (
    <div className="flex gap-1 p-1 bg-neutral-100 rounded-xl">
      {Array.from({ length: tierCount }, (_, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className={cn(
            'relative flex-1 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dusty-rose)]',
            activeTier === i
              ? 'bg-white shadow-sm text-neutral-900'
              : 'text-neutral-500 hover:text-neutral-700'
          )}
        >
          {activeTier === i && (
            <motion.div
              layoutId={layoutId}
              className="absolute inset-0 bg-white rounded-lg shadow-sm"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">Ярус {i + 1}</span>
        </button>
      ))}
    </div>
  );
}
