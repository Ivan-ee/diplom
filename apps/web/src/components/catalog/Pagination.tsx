'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

  // Build visible page numbers with ellipsis
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
    <div className="flex flex-col items-center gap-4 py-6">
      {/* Page info */}
      <p className="text-sm text-[var(--color-text-secondary)]">
        Страница <span className="font-semibold text-[var(--color-dark)]">{currentPage}</span>{' '}
        из <span className="font-semibold text-[var(--color-dark)]">{totalPages}</span>
        {totalItems > 0 && (
          <> &mdash; {totalItems} товаров</>
        )}
      </p>

      {/* Controls */}
      <div className="flex items-center gap-1" role="navigation" aria-label="Навигация по страницам">
        {/* Prev */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Предыдущая страница"
        >
          <ChevronLeft size={18} />
        </Button>

        {/* Page numbers */}
        {pageNumbers.map((page, idx) =>
          page === '...' ? (
            <span
              key={`ellipsis-${idx}`}
              className="w-9 text-center text-sm text-[var(--color-text-secondary)] select-none"
            >
              …
            </span>
          ) : (
            <button
              key={page}
              onClick={() => goToPage(page)}
              aria-current={page === currentPage ? 'page' : undefined}
              className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 ${
                page === currentPage
                  ? 'bg-[var(--color-dusty-rose)] text-white shadow-sm'
                  : 'text-[var(--color-dark)] hover:bg-[var(--color-cream)] hover:text-[var(--color-dusty-rose)]'
              }`}
            >
              {page}
            </button>
          ),
        )}

        {/* Next */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Следующая страница"
        >
          <ChevronRight size={18} />
        </Button>
      </div>
    </div>
  );
}
