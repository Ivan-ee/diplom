'use client';

import { X, Check } from 'lucide-react';
import { DrawerRoot, DrawerBackdrop, DrawerContent, DrawerDialog, DrawerBody } from '@heroui/react';
import { PriceRangeFilter } from './PriceRangeFilter';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/* Props                                                                */
/* ------------------------------------------------------------------ */

interface FilterDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentCategorySlug: string;
  currentSort: string;
  currentPriceMin: string;
  currentPriceMax: string;
  onCategoryChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onPriceChange: (params: { priceMin?: string; priceMax?: string }) => void;
  onResetAll: () => void;
  categories: { value: string; label: string }[];
  sortOptions: { value: string; label: string }[];
  defaultSort: string;
}

/* ------------------------------------------------------------------ */
/* FilterDrawer                                                         */
/* ------------------------------------------------------------------ */

export function FilterDrawer({
  isOpen,
  onOpenChange,
  currentCategorySlug,
  currentSort,
  currentPriceMin,
  currentPriceMax,
  onCategoryChange,
  onSortChange,
  onPriceChange,
  onResetAll,
  categories,
  sortOptions,
  defaultSort: _defaultSort,
}: FilterDrawerProps) {
  return (
    <DrawerRoot isOpen={isOpen} onOpenChange={onOpenChange}>
      <DrawerBackdrop
        isDismissable
        className="bg-black/30 backdrop-blur-sm"
      >
        <DrawerContent placement="bottom">
          <DrawerDialog className="bg-[var(--surface-elevated)] outline-none rounded-t-[20px] max-h-[75vh] flex flex-col !p-0">
            <DrawerBody className="flex flex-col overflow-hidden p-0 mx-0">

              {/* Header */}
              <div className="shrink-0 px-4 pt-3 pb-0">
                {/* Handle bar */}
                <div className="w-9 h-1 bg-[var(--color-champagne)] rounded-full mx-auto mb-4" />
                {/* Title row */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-[var(--color-graphite)]">Фильтры</h3>
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    aria-label="Закрыть"
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-[var(--color-graphite-light)] hover:bg-[var(--surface-secondary)] transition-colors cursor-pointer"
                  >
                    <X size={17} />
                  </button>
                </div>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto px-4 pb-4">

                {/* Section 1: Categories */}
                <div className="mb-5">
                  <div className="text-xs font-semibold text-[var(--color-graphite-light)] uppercase tracking-wider mb-3">
                    Категория
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => onCategoryChange(cat.value)}
                        className={cn(
                          'px-4 py-2.5 rounded-[var(--radius-control)] border-[1.5px] text-sm font-medium transition-all duration-150 cursor-pointer',
                          currentCategorySlug === cat.value
                            ? 'bg-[var(--color-caramel)] text-white border-[var(--color-caramel)]'
                            : 'bg-[var(--surface-primary)] text-[var(--color-graphite)] border-[var(--border-default)]',
                        )}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section 2: Sort (radio list) */}
                <div className="mb-5">
                  <div className="text-xs font-semibold text-[var(--color-graphite-light)] uppercase tracking-wider mb-3">
                    Сортировка
                  </div>
                  <div className="rounded-[var(--radius-control)] border border-[var(--border-default)] overflow-hidden">
                    {sortOptions.map((opt, i) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => onSortChange(opt.value)}
                        className={cn(
                          'w-full flex items-center justify-between px-4 py-3.5 text-sm transition-colors duration-100 cursor-pointer',
                          i < sortOptions.length - 1 && 'border-b border-[var(--border-default)]',
                          currentSort === opt.value
                            ? 'text-[var(--color-caramel)] font-semibold'
                            : 'text-[var(--color-graphite)]',
                        )}
                      >
                        {opt.label}
                        {currentSort === opt.value && <Check size={16} />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section 3: Price */}
                <div className="mb-2">
                  <div className="text-xs font-semibold text-[var(--color-graphite-light)] uppercase tracking-wider mb-3">
                    Цена
                  </div>
                  <PriceRangeFilter
                    variant="stacked"
                    priceMin={currentPriceMin || undefined}
                    priceMax={currentPriceMax || undefined}
                    onUpdate={onPriceChange}
                  />
                </div>

              </div>

              {/* Sticky footer */}
              <div className="shrink-0 border-t border-[var(--border-default)] px-4 py-3 bg-[var(--surface-elevated)]">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="w-full h-12 rounded-[var(--radius-control)] bg-[var(--color-caramel)] hover:bg-[var(--color-caramel-hover)] text-white text-[15px] font-semibold transition-colors duration-150 cursor-pointer"
                >
                  Показать товары
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onResetAll();
                    onOpenChange(false);
                  }}
                  className="w-full text-center text-sm text-[var(--color-graphite-light)] py-2.5 mt-1 cursor-pointer bg-transparent border-none"
                >
                  Сбросить фильтры
                </button>
              </div>

            </DrawerBody>
          </DrawerDialog>
        </DrawerContent>
      </DrawerBackdrop>
    </DrawerRoot>
  );
}
