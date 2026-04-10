'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

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
  { value: 'createdAt:desc', label: 'Сначала новые' },
];

export function CatalogFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentCategorySlug = searchParams.get('categorySlug') ?? '';
  const currentSort = `${searchParams.get('sort') ?? 'createdAt'}:${searchParams.get('order') ?? 'desc'}`;

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
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  function handleCategory(value: string) {
    updateParam({ categorySlug: value || null });
  }

  function handleSort(value: string) {
    const [sort, order] = value.split(':');
    updateParam({ sort, order });
  }

  function handleReset() {
    router.push(pathname, { scroll: false });
  }

  const hasActiveFilters = currentCategorySlug !== '' || currentSort !== 'createdAt:desc';

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 max-w-7xl mx-auto px-4">
      {/* Category tabs */}
      <div
        className="flex flex-wrap items-center gap-1 bg-neutral-100 rounded-xl p-1"
        role="group"
        aria-label="Категория"
      >
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => handleCategory(cat.value)}
            aria-pressed={currentCategorySlug === cat.value}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              currentCategorySlug === cat.value
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Right side: sort + reset */}
      <div className="flex items-center gap-3">
        <select
          value={currentSort}
          onChange={(e) => handleSort(e.target.value)}
          aria-label="Сортировка"
          className="text-sm border border-neutral-200 rounded-xl px-3 py-2 bg-white text-neutral-700 focus:outline-none focus:border-[var(--color-dusty-rose)] focus:ring-1 focus:ring-[var(--color-dusty-rose)] cursor-pointer transition-colors duration-200"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors duration-200 whitespace-nowrap"
            aria-label="Сбросить фильтры"
          >
            Сбросить
          </button>
        )}
      </div>
    </div>
  );
}
