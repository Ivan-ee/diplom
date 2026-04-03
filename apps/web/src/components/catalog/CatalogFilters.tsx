'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const categories = [
  { value: '', label: 'Все' },
  { value: 'cake', label: 'Торты' },
  { value: 'cupcake', label: 'Капкейки' },
  { value: 'macaron', label: 'Макаронс' },
];

const sortOptions = [
  { value: 'priceMin:asc', label: 'По цене ↑' },
  { value: 'priceMin:desc', label: 'По цене ↓' },
  { value: 'createdAt:desc', label: 'Сначала новые' },
];

export function CatalogFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentType = searchParams.get('type') ?? '';
  const currentSort = `${searchParams.get('sort') ?? 'createdAt'}:${searchParams.get('order') ?? 'desc'}`;

  const updateParam = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      // Reset to page 1 on filter change
      params.delete('page');
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  function handleCategory(value: string) {
    updateParam({ type: value || null });
  }

  function handleSort(value: string) {
    const [sort, order] = value.split(':');
    updateParam({ sort, order });
  }

  function handleReset() {
    router.push(pathname, { scroll: false });
  }

  const hasActiveFilters = currentType !== '' || currentSort !== 'createdAt:desc';

  const filtersContent = (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Категория">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => handleCategory(cat.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border ${
              currentType === cat.value
                ? 'bg-[var(--color-dusty-rose)] text-white border-[var(--color-dusty-rose)] shadow-sm'
                : 'bg-white text-[var(--color-dark)] border-gray-200 hover:border-[var(--color-dusty-rose)] hover:text-[var(--color-dusty-rose)]'
            }`}
            aria-pressed={currentType === cat.value}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <span className="h-6 w-px bg-gray-200 hidden sm:block" aria-hidden="true" />

      <div className="flex items-center gap-2">
        <label htmlFor="sort-select" className="text-sm text-[var(--color-text-secondary)] whitespace-nowrap">
          Сортировка:
        </label>
        <select
          id="sort-select"
          value={currentSort}
          onChange={(e) => handleSort(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-[var(--color-dark)] bg-white focus:outline-none focus:border-[var(--color-dusty-rose)] focus:ring-1 focus:ring-[var(--color-dusty-rose)] cursor-pointer transition-colors duration-200"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {hasActiveFilters && (
        <button
          onClick={handleReset}
          className="flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-dusty-rose)] transition-colors duration-200"
          aria-label="Сбросить фильтры"
        >
          <X size={14} />
          Сбросить
        </button>
      )}
    </div>
  );

  return (
    <div className="w-full">
      <div className="hidden sm:block">{filtersContent}</div>

      <div className="sm:hidden flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMobileOpen((v) => !v)}
            className="flex items-center gap-2"
          >
            <SlidersHorizontal size={16} />
            Фильтры
            {hasActiveFilters && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-dusty-rose)] text-white text-[10px] font-bold">
                !
              </span>
            )}
          </Button>
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-dusty-rose)] transition-colors duration-200"
            >
              Сбросить
            </button>
          )}
        </div>

        {mobileOpen && (
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            {filtersContent}
          </div>
        )}
      </div>
    </div>
  );
}
