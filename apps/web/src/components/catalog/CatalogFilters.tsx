'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import { motion } from 'framer-motion';

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
  const [isPending, startTransition] = useTransition();

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

  function handleReset() {
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  }

  const hasActiveFilters = currentCategorySlug !== '' || currentSort !== 'createdAt:desc';

  return (
    <div
      className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 max-w-7xl mx-auto px-4 transition-opacity duration-200 ${isPending ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}
    >
      {/* Category tabs */}
      <div
        className="flex flex-wrap items-center gap-1 bg-[var(--surface-secondary)] border border-[var(--border-default)] rounded-[var(--radius-pill)] p-1"
        role="group"
        aria-label="Категория"
      >
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => handleCategory(cat.value)}
            aria-pressed={currentCategorySlug === cat.value}
            className={`relative cursor-pointer px-3 py-1.5 rounded-[var(--radius-pill)] text-sm font-medium transition-colors duration-200 ${
              currentCategorySlug === cat.value
                ? 'text-white'
                : 'text-[var(--color-graphite)] hover:text-[var(--color-graphite)]'
            }`}
          >
            {currentCategorySlug === cat.value && (
              <motion.div
                layoutId="category-pill"
                className="absolute inset-0 rounded-[var(--radius-pill)] bg-[var(--color-caramel)] shadow-sm"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Right side: sort + reset */}
      <div className="flex items-center gap-3">
        <select
          value={currentSort}
          onChange={(e) => handleSort(e.target.value)}
          aria-label="Сортировка"
          className="text-sm border border-[var(--border-default)] rounded-[var(--radius-control)] px-3 py-2 bg-[var(--surface-elevated)] text-[var(--color-graphite)] focus:outline-none focus:border-[var(--color-caramel)] focus:ring-1 focus:ring-[var(--color-caramel)] cursor-pointer transition-colors duration-200"
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
            className="text-sm text-[var(--color-graphite-light)]/60 hover:text-[var(--color-graphite)] transition-colors duration-200 whitespace-nowrap"
            aria-label="Сбросить фильтры"
          >
            Сбросить
          </button>
        )}
      </div>
    </div>
  );
}
