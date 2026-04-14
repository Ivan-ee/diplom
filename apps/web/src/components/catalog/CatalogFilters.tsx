'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useTransition, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { PriceRangeFilter } from './PriceRangeFilter';
import { ActiveFilterChips } from './ActiveFilterChips';
import { SortDropdown } from './SortDropdown';
import { FilterDrawer } from './FilterDrawer';

const categories = [
  { value: '', label: 'Все' },
  { value: 'classic', label: 'Классические' },
  { value: 'wedding', label: 'Свадебные' },
  { value: 'kids', label: 'Детские' },
  { value: 'bento', label: 'Бенто' },
  { value: 'cupcakes', label: 'Капкейки' },
  { value: 'trifles', label: 'Трайфлы' },
];

const sortOptions = [
  { value: 'pricePerKg:asc', label: 'По цене ↑' },
  { value: 'pricePerKg:desc', label: 'По цене ↓' },
  { value: 'name:asc', label: 'По названию А–Я' },
];

export function CatalogFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const currentCategorySlug = searchParams.get('categorySlug') ?? '';
  const currentSort = `${searchParams.get('sort') ?? 'createdAt'}:${searchParams.get('order') ?? 'desc'}`;
  const currentPriceMin = searchParams.get('priceMin') ?? '';
  const currentPriceMax = searchParams.get('priceMax') ?? '';

  const updateParam = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('page');
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [router, pathname, searchParams],
  );

  function handleCategory(value: string) {
    updateParam({ categorySlug: value || null });
    setTimeout(() => {
      document.getElementById('product-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  function handleSort(value: string) {
    const [sort, order] = value.split(':');
    updateParam({ sort, order });
  }

  function handleResetAll() {
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  }

  const hasActiveFilters =
    currentCategorySlug !== '' ||
    currentSort !== 'createdAt:desc' ||
    currentPriceMin !== '' ||
    currentPriceMax !== '';

  function kopecksToRubles(kopecks: string): string {
    const n = parseInt(kopecks, 10);
    if (isNaN(n)) return kopecks;
    return String(Math.round(n / 100));
  }

  const activeFilterCount = [
    currentCategorySlug !== '',
    currentSort !== 'createdAt:desc',
    currentPriceMin !== '',
    currentPriceMax !== '',
  ].filter(Boolean).length;

  function buildActiveFilters() {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];

    if (currentCategorySlug !== '') {
      const cat = categories.find((c) => c.value === currentCategorySlug);
      chips.push({
        key: 'category',
        label: cat?.label ?? currentCategorySlug,
        onRemove: () => updateParam({ categorySlug: null }),
      });
    }

    if (currentPriceMin !== '') {
      chips.push({
        key: 'priceMin',
        label: `от ${kopecksToRubles(currentPriceMin)} ₽`,
        onRemove: () => updateParam({ priceMin: null }),
      });
    }

    if (currentPriceMax !== '') {
      chips.push({
        key: 'priceMax',
        label: `до ${kopecksToRubles(currentPriceMax)} ₽`,
        onRemove: () => updateParam({ priceMax: null }),
      });
    }

    if (currentSort !== 'createdAt:desc') {
      const sortOpt = sortOptions.find((o) => o.value === currentSort);
      chips.push({
        key: 'sort',
        label: sortOpt?.label ?? 'Сортировка',
        onRemove: () => updateParam({ sort: null, order: null }),
      });
    }

    return chips;
  }

  return (
    <div
      className={`flex flex-col gap-3 max-w-7xl mx-auto px-4 transition-opacity duration-200 ${isPending ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}
    >
      {/* ===== DESKTOP FILTERS (hidden on mobile) ===== */}
      <div className="hidden sm:flex items-center gap-3 flex-wrap">
        {/* Category buttons */}
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => handleCategory(cat.value)}
              aria-pressed={currentCategorySlug === cat.value}
              className={`px-4 py-2.5 rounded-[var(--radius-control)] border-[1.5px] text-sm font-medium transition-all duration-150 cursor-pointer ${
                currentCategorySlug === cat.value
                  ? 'bg-[var(--color-caramel)] text-white border-[var(--color-caramel)] shadow-sm'
                  : 'bg-[var(--surface-elevated)] text-[var(--color-graphite)] border-[var(--border-default)] hover:border-[var(--color-caramel)] hover:text-[var(--color-caramel)]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-7 bg-[var(--border-default)] shrink-0" />

        {/* Price filter */}
        <PriceRangeFilter
          variant="inline"
          priceMin={currentPriceMin || undefined}
          priceMax={currentPriceMax || undefined}
          onUpdate={(params) => {
            updateParam({
              priceMin: params.priceMin ?? null,
              priceMax: params.priceMax ?? null,
            });
          }}
        />

        {/* Divider */}
        <div className="w-px h-7 bg-[var(--border-default)] shrink-0" />

        {/* Sort dropdown */}
        <SortDropdown
          options={sortOptions}
          currentValue={currentSort}
          defaultValue="createdAt:desc"
          onSelect={handleSort}
        />

        {/* Reset button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetAll}
            className="text-sm text-[var(--color-graphite-light)]/60 hover:text-[var(--color-graphite)] transition-colors duration-150 whitespace-nowrap cursor-pointer"
            aria-label="Сбросить фильтры"
          >
            Сбросить
          </button>
        )}
      </div>

      {/* ===== MOBILE FILTERS (hidden on desktop) ===== */}
      <div className="sm:hidden flex flex-col gap-3">
        {/* Filter trigger button */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex items-center justify-center gap-2 h-[42px] rounded-[var(--radius-control)] border-[1.5px] border-[var(--border-default)] bg-[var(--surface-elevated)] text-sm font-medium text-[var(--color-graphite)] cursor-pointer transition-colors duration-150 hover:border-[var(--color-caramel)]"
        >
          <SlidersHorizontal size={16} className="text-[var(--color-graphite-light)]" />
          Фильтры и сортировка
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-[var(--color-caramel)] text-white text-[11px] font-semibold leading-none">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Filter drawer */}
        <FilterDrawer
          isOpen={drawerOpen}
          onOpenChange={setDrawerOpen}
          currentCategorySlug={currentCategorySlug}
          currentSort={currentSort}
          currentPriceMin={currentPriceMin}
          currentPriceMax={currentPriceMax}
          onCategoryChange={(value) => handleCategory(value)}
          onSortChange={handleSort}
          onPriceChange={(params) => {
            updateParam({
              priceMin: params.priceMin ?? null,
              priceMax: params.priceMax ?? null,
            });
          }}
          onResetAll={handleResetAll}
          categories={categories}
          sortOptions={sortOptions}
          defaultSort="createdAt:desc"
        />
      </div>

      {/* Active filter chips (both desktop and mobile) */}
      <ActiveFilterChips
        filters={buildActiveFilters()}
        onResetAll={handleResetAll}
      />
    </div>
  );
}
