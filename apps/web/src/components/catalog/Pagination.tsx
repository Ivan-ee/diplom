'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export function Pagination({ currentPage, totalPages, totalItems }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const goToPage = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (page === 1) {
        params.delete('page');
      } else {
        params.set('page', String(page));
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: true });
    },
    [router, pathname, searchParams],
  );

  if (totalPages <= 1) return null;

  function getPageNumbers(): (number | '...')[] {
    const delta = 1;
    const range: number[] = [];
    const result: (number | '...')[] = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      result.push(1, '...');
    } else {
      result.push(1);
    }

    result.push(...range);

    if (currentPage + delta < totalPages - 1) {
      result.push('...', totalPages);
    } else {
      result.push(totalPages);
    }

    return result;
  }

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col items-center gap-3 mt-12">
      {totalItems > 0 && (
        <p className="text-sm text-neutral-400">
          Страница <span className="text-neutral-700 font-medium">{currentPage}</span> из{' '}
          <span className="text-neutral-700 font-medium">{totalPages}</span>
          {' '}&mdash; {totalItems} товаров
        </p>
      )}

      <div className="flex items-center justify-center gap-2" role="navigation" aria-label="Навигация по страницам">
        {/* Prev */}
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Предыдущая страница"
          className="w-10 h-10 rounded-full flex items-center justify-center bg-neutral-100 text-neutral-600 hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Page numbers */}
        {pageNumbers.map((page, idx) =>
          page === '...' ? (
            <span
              key={`ellipsis-${idx}`}
              className="w-10 text-center text-sm text-neutral-400 select-none"
            >
              …
            </span>
          ) : (
            <button
              key={page}
              onClick={() => goToPage(page)}
              aria-current={page === currentPage ? 'page' : undefined}
              className={`w-10 h-10 rounded-full text-sm font-medium transition-all duration-200 ${
                page === currentPage
                  ? 'bg-[var(--color-dusty-rose)] text-white shadow-sm'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {page}
            </button>
          ),
        )}

        {/* Next */}
        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Следующая страница"
          className="w-10 h-10 rounded-full flex items-center justify-center bg-neutral-100 text-neutral-600 hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
