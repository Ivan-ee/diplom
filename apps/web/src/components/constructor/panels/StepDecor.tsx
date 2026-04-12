'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, MousePointerClick } from 'lucide-react';
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


export function StepDecor() {
  const decorations = useConstructorStore((s) => s.decorations);
  const ingredients = useConstructorStore((s) => s.ingredients);
  const inscription = useConstructorStore((s) => s.inscription);
  const removeDecoration = useConstructorStore((s) => s.removeDecoration);
  const setInscription = useConstructorStore((s) => s.setInscription);
  const config = useConstructorStore((s) => s.getConfig());

  const placingDecorationId = useConstructorStore((s) => s.placingDecorationId);
  const setPlacingDecorationId = useConstructorStore((s) => s.setPlacingDecorationId);

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

  /**
   * Enter click-to-place mode for the selected decoration type.
   * If this type is already being placed, toggle it off (second click cancels).
   * Falls back to algorithmic placement when already at max or when the user
   * explicitly triggers via the count button instead of the place button.
   */
  const handleEnterPlacementMode = (decorationId: string) => {
    if (!canAddMore) return;
    if (placingDecorationId === decorationId) {
      setPlacingDecorationId(null);
    } else {
      setPlacingDecorationId(decorationId);
    }
  };

  const handleRemoveLast = (decorationId: string) => {
    // Remove the last placed decoration with this id
    const last = decorations.findLast((d) => d.decorationId === decorationId);
    if (last) removeDecoration(last.id);
  };

  const placingDecorName = placingDecorationId
    ? allDecorations.find((d) => d.id === placingDecorationId)?.name
    : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-[var(--color-graphite)] text-sm uppercase tracking-wide">
          Декорации
        </h3>
        <span className={cn(
          'text-xs font-semibold px-2.5 py-1 rounded-full',
          decorations.length >= maxDecorations
            ? 'bg-red-100 text-red-600'
            : 'bg-[var(--color-toffee)]/30 text-[var(--color-caramel-hover)]'
        )}>
          {decorations.length}/{maxDecorations}
        </span>
      </div>

      {/* Placement-mode banner */}
      <AnimatePresence>
        {placingDecorationId && (
          <motion.div
            key="placement-banner"
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[var(--color-caramel)]/10 border border-[var(--color-caramel)]/30">
              <MousePointerClick
                size={14}
                className="text-[var(--color-caramel)] flex-shrink-0 animate-pulse"
              />
              <p className="text-xs text-[var(--color-caramel)] font-medium leading-tight flex-1">
                Нажмите на торт, чтобы разместить
                {placingDecorName ? <> «{placingDecorName}»</> : null}.
                {' '}Правая кнопка или <kbd className="font-mono bg-white/60 px-1 rounded text-[10px]">Esc</kbd> — отмена.
              </p>
              <button
                onClick={() => setPlacingDecorationId(null)}
                className="w-5 h-5 flex-shrink-0 rounded-md hover:bg-[var(--color-caramel)]/20 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Отменить размещение"
              >
                <X size={10} className="text-[var(--color-caramel)]" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat;
          const color = CATEGORY_COLORS[cat] ?? '#c4a08a';
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ease-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-caramel)] flex-shrink-0',
                isActive
                  ? 'text-white shadow-md'
                  : 'bg-[var(--color-champagne)]/40 text-[var(--color-graphite-light)] hover:bg-[var(--color-champagne)]'
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
          const isBeingPlaced = placingDecorationId === decor.id;

          return (
            <div
              key={decor.id}
              className={cn(
                'flex flex-col gap-2 p-3 rounded-[var(--radius-control)] bg-[var(--surface-elevated)] border transition-all duration-150',
                isBeingPlaced
                  ? 'border-[var(--color-caramel)] shadow-sm shadow-[var(--color-caramel)]/20 ring-1 ring-[var(--color-caramel)]/30'
                  : 'border-[var(--border-default)] hover:border-[var(--color-caramel)]/40 hover:shadow-sm'
              )}
            >
              {/* Color indicator */}
              <div
                className="w-full h-1.5 rounded-full opacity-60"
                style={{ backgroundColor: color }}
              />

              <div className="flex items-start justify-between gap-1">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[var(--color-graphite)] leading-tight">
                    {decor.name}
                  </p>
                  <p className="text-[10px] text-[var(--color-graphite-light)] mt-0.5">
                    {formatPrice(decor.pricePerUnit)} / шт.
                  </p>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {count > 0 && (
                    <button
                      onClick={() => handleRemoveLast(decor.id)}
                      className="w-6 h-6 rounded-md bg-[var(--surface-secondary)] hover:bg-red-100 text-[var(--color-graphite-light)] hover:text-red-500 flex items-center justify-center transition-colors duration-150 cursor-pointer"
                      title="Убрать последнюю"
                    >
                      <X size={10} strokeWidth={2.5} />
                    </button>
                  )}
                  {count > 0 && (
                    <span className="text-xs font-bold text-[var(--color-caramel)] w-4 text-center">
                      {count}
                    </span>
                  )}
                  {/* Place-on-cake button — enters click-to-place mode */}
                  <button
                    onClick={() => handleEnterPlacementMode(decor.id)}
                    disabled={!canAddMore && !isBeingPlaced}
                    title={isBeingPlaced ? 'Отменить размещение' : 'Нажмите, затем кликните на торт'}
                    className={cn(
                      'w-6 h-6 rounded-md flex items-center justify-center transition-all duration-150 cursor-pointer',
                      isBeingPlaced
                        ? 'bg-[var(--color-caramel)] text-white ring-2 ring-[var(--color-caramel)]/40 scale-110'
                        : canAddMore
                        ? 'bg-[var(--color-caramel)] hover:bg-[var(--color-caramel-hover)] text-white'
                        : 'bg-[var(--surface-secondary)] text-[var(--color-graphite-light)]/40 cursor-not-allowed'
                    )}
                  >
                    {isBeingPlaced
                      ? <MousePointerClick size={11} strokeWidth={2.5} />
                      : <Plus size={11} strokeWidth={2.5} />
                    }
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
            <div className="border-t border-[var(--color-champagne)] pt-4 flex flex-col gap-2">
              <h4 className="text-xs font-semibold text-[var(--color-graphite-light)] uppercase tracking-wide">
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
                      className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-[var(--color-warm-ivory)]"
                    >
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs text-[var(--color-graphite)] flex-1">
                        {decor.name}
                      </span>
                      <span className="text-xs font-semibold text-[var(--color-caramel)]">
                        × {count}
                      </span>
                      <button
                        onClick={() => handleRemoveLast(decorId)}
                        className="w-5 h-5 rounded-md hover:bg-red-100 text-[var(--color-graphite-light)] hover:text-red-500 flex items-center justify-center transition-colors cursor-pointer"
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
          <h3 className="font-heading font-semibold text-[var(--color-graphite)] text-sm uppercase tracking-wide">
            Надпись на торте
          </h3>
          <span className={cn(
            'text-xs font-medium',
            inscription.length >= maxInscription
              ? 'text-red-500'
              : inscription.length > maxInscription * 0.8
              ? 'text-orange-500'
              : 'text-[var(--color-graphite-light)]'
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
