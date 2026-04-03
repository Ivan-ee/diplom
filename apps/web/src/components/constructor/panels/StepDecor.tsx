'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus } from 'lucide-react';
import { useConstructorStore } from '@/stores/constructor-store';
import { formatPrice, cn } from '@/lib/utils';

const CATEGORIES = ['Ягоды', 'Шоколад', 'Топперы', 'Цветы', 'Фигурки'];

const CATEGORY_COLORS: Record<string, string> = {
  'Ягоды': '#e05c6e',
  'Шоколад': '#5c3d2e',
  'Топперы': '#c4a08a',
  'Цветы': '#f4b8c8',
  'Фигурки': '#a8d8ea',
};

const CATEGORY_ICONS: Record<string, string> = {
  'Ягоды': '🍓',
  'Шоколад': '🍫',
  'Топперы': '✨',
  'Цветы': '🌸',
  'Фигурки': '🎂',
};

// Generate a predictable surface position for a decoration added to the cake
function generateDecorPosition(index: number): [number, number, number] {
  const angle = (index * 137.5 * Math.PI) / 180; // golden angle
  const radius = 0.8 + (index % 3) * 0.2;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  const y = 1.0 + (index % 4) * 0.3;
  return [x, y, z];
}

export function StepDecor() {
  const decorations = useConstructorStore((s) => s.decorations);
  const ingredients = useConstructorStore((s) => s.ingredients);
  const inscription = useConstructorStore((s) => s.inscription);
  const addDecoration = useConstructorStore((s) => s.addDecoration);
  const removeDecoration = useConstructorStore((s) => s.removeDecoration);
  const setInscription = useConstructorStore((s) => s.setInscription);
  const config = useConstructorStore((s) => s.getConfig)();

  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);

  const allDecorations = ingredients?.decorations.filter((d) => d.available) ?? [];
  const filtered = allDecorations.filter((d) => d.category === activeCategory);
  const maxDecorations = config?.maxDecorations ?? 20;
  const maxInscription = config?.maxInscriptionLength ?? 50;
  const canAddMore = decorations.length < maxDecorations;

  // Count per decorationId
  const countMap: Record<string, number> = {};
  for (const d of decorations) {
    countMap[d.decorationId] = (countMap[d.decorationId] ?? 0) + 1;
  }

  const handleAdd = (decorationId: string) => {
    if (!canAddMore) return;
    const idx = decorations.length;
    const position = generateDecorPosition(idx);
    const normal: [number, number, number] = [0, 1, 0];
    addDecoration(decorationId, position, normal);
  };

  const handleRemoveLast = (decorationId: string) => {
    // Remove the last placed decoration with this id
    const last = decorations.findLast((d) => d.decorationId === decorationId);
    if (last) removeDecoration(last.id);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-[var(--color-dark)] text-sm uppercase tracking-wide">
          Декорации
        </h3>
        <span className={cn(
          'text-xs font-semibold px-2.5 py-1 rounded-full',
          decorations.length >= maxDecorations
            ? 'bg-red-100 text-red-600'
            : 'bg-[var(--color-soft-peach)] text-[var(--color-dusty-rose-hover)]'
        )}>
          {decorations.length}/{maxDecorations}
        </span>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat;
          const color = CATEGORY_COLORS[cat] ?? '#c4a08a';
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ease-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dusty-rose)] flex-shrink-0',
                isActive
                  ? 'text-white shadow-md'
                  : 'bg-gray-100 text-[var(--color-text-secondary)] hover:bg-gray-200'
              )}
              style={isActive ? { backgroundColor: color } : {}}
            >
              <span>{CATEGORY_ICONS[cat]}</span>
              <span>{cat}</span>
            </button>
          );
        })}
      </div>

      <motion.div
        key={activeCategory}
        className="grid grid-cols-2 gap-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {filtered.map((decor) => {
          const count = countMap[decor.id] ?? 0;
          const color = CATEGORY_COLORS[decor.category] ?? '#c4a08a';

          return (
            <div
              key={decor.id}
              className="flex flex-col gap-2 p-3 rounded-xl bg-white border border-gray-200 hover:border-[var(--color-soft-peach)] hover:shadow-sm transition-all duration-150"
            >
              {/* Color indicator */}
              <div
                className="w-full h-1.5 rounded-full opacity-60"
                style={{ backgroundColor: color }}
              />

              <div className="flex items-start justify-between gap-1">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[var(--color-dark)] leading-tight">
                    {decor.name}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-secondary)] mt-0.5">
                    {formatPrice(decor.pricePerUnit)} / шт.
                  </p>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {count > 0 && (
                    <button
                      onClick={() => handleRemoveLast(decor.id)}
                      className="w-6 h-6 rounded-md bg-gray-100 hover:bg-red-100 text-[var(--color-text-secondary)] hover:text-red-500 flex items-center justify-center transition-colors duration-150 cursor-pointer"
                    >
                      <X size={10} strokeWidth={2.5} />
                    </button>
                  )}
                  {count > 0 && (
                    <span className="text-xs font-bold text-[var(--color-dusty-rose)] w-4 text-center">
                      {count}
                    </span>
                  )}
                  <button
                    onClick={() => handleAdd(decor.id)}
                    disabled={!canAddMore}
                    className={cn(
                      'w-6 h-6 rounded-md flex items-center justify-center transition-all duration-150 cursor-pointer',
                      canAddMore
                        ? 'bg-[var(--color-dusty-rose)] hover:bg-[var(--color-dusty-rose-hover)] text-white'
                        : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                    )}
                  >
                    <Plus size={11} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </motion.div>

      <AnimatePresence>
        {decorations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-100 pt-4 flex flex-col gap-2">
              <h4 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                На торте
              </h4>
              <div className="flex flex-col gap-1.5">
                {Object.entries(countMap).map(([decorId, count]) => {
                  const decor = allDecorations.find((d) => d.id === decorId);
                  if (!decor) return null;
                  const color = CATEGORY_COLORS[decor.category] ?? '#c4a08a';

                  return (
                    <motion.div
                      key={decorId}
                      layout
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-[var(--color-cream)]"
                    >
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs text-[var(--color-dark)] flex-1">
                        {decor.name}
                      </span>
                      <span className="text-xs font-semibold text-[var(--color-dusty-rose)]">
                        × {count}
                      </span>
                      <button
                        onClick={() => handleRemoveLast(decorId)}
                        className="w-5 h-5 rounded-md hover:bg-red-100 text-[var(--color-text-secondary)] hover:text-red-500 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <X size={10} strokeWidth={2.5} />
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-semibold text-[var(--color-dark)] text-sm uppercase tracking-wide">
            Надпись на торте
          </h3>
          <span className={cn(
            'text-xs font-medium',
            inscription.length >= maxInscription
              ? 'text-red-500'
              : inscription.length > maxInscription * 0.8
              ? 'text-orange-500'
              : 'text-[var(--color-text-secondary)]'
          )}>
            {inscription.length}/{maxInscription}
          </span>
        </div>
        <div className="relative">
          <input
            type="text"
            value={inscription}
            onChange={(e) => setInscription(e.target.value)}
            placeholder="Например: «С Днём Рождения, Аня!»"
            maxLength={maxInscription}
            className={cn(
              'w-full px-4 py-3 rounded-xl border-2 text-sm text-[var(--color-dark)] placeholder:text-gray-300 bg-white transition-all duration-200 ease-out outline-none',
              'border-gray-200 focus:border-[var(--color-dusty-rose)] focus:shadow-sm focus:shadow-[var(--color-dusty-rose)]/15'
            )}
          />
          {inscription.length > 0 && (
            <button
              onClick={() => setInscription('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={10} className="text-gray-500" />
            </button>
          )}
        </div>
        <p className="text-xs text-[var(--color-text-secondary)]">
          Надпись наносится кремом или шоколадом по желанию
        </p>
      </div>
    </div>
  );
}
