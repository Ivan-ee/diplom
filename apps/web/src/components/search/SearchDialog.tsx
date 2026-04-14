'use client';

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useId,
} from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion, type Transition } from 'framer-motion';
import { Search } from 'lucide-react';
import { fetchClient } from '@/lib/api';
import { cn, formatPrice } from '@/lib/utils';
import { SEARCH_DEBOUNCE_MS } from '@/lib/constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SearchResult {
  id: string;
  name: string;
  highlightedName: string;
  slug: string;
  imageUrl: string | null;
  pricePerKg: number | null;
  pricePerUnit: number | null;
  priceType: string;
  category: string;
}

export interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPrice(result: SearchResult): string | null {
  if (result.priceType === 'per_kg' && result.pricePerKg !== null) {
    return `${formatPrice(result.pricePerKg)} / кг`;
  }
  if (result.pricePerUnit !== null) {
    return formatPrice(result.pricePerUnit);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <div className="h-12 w-12 shrink-0 animate-pulse rounded-lg bg-[var(--surface-secondary)]" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="h-3.5 w-2/3 animate-pulse rounded bg-[var(--surface-secondary)]" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-[var(--surface-secondary)]" />
      </div>
    </div>
  );
}

interface ResultRowProps {
  result: SearchResult;
  index: number;
  isActive: boolean;
  resultId: string;
  onMouseEnter: () => void;
  onClick: () => void;
}

function ResultRow({
  result,
  index,
  isActive,
  resultId,
  onMouseEnter,
  onClick,
}: ResultRowProps) {
  const price = getPrice(result);

  return (
    <li
      id={resultId}
      role="option"
      aria-selected={isActive}
      data-index={index}
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors duration-100',
        isActive
          ? 'bg-[var(--surface-secondary)]'
          : 'hover:bg-[var(--surface-secondary)]',
      )}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[var(--surface-secondary)]">
        {result.imageUrl ? (
          <Image
            src={result.imageUrl}
            alt={result.name}
            fill
            sizes="48px"
            className="object-cover"
          />
        ) : (
          <div className="h-full w-full" />
        )}
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p
          className="truncate text-sm font-medium text-[var(--color-graphite)] [&_mark]:bg-transparent [&_mark]:font-semibold [&_mark]:text-[var(--color-caramel)]"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: result.highlightedName }}
        />
        <p className="mt-0.5 truncate text-xs text-[var(--color-graphite-light)]">
          {[price, result.category].filter(Boolean).join(' · ')}
        </p>
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SearchDialog({ isOpen, onClose }: SearchDialogProps) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const instanceId = useId();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const previousFocusRef = useRef<Element | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const listboxId = `search-results-${instanceId}`;
  const getOptionId = (index: number) => `search-result-${instanceId}-${index}`;
  const activeDescendant = activeIndex >= 0 ? getOptionId(activeIndex) : undefined;

  // ----- Focus management -----

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      // Defer so that AnimatePresence has time to mount the input
      const raf = requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
      return () => cancelAnimationFrame(raf);
    } else {
      // Restore focus when dialog closes
      const el = previousFocusRef.current;
      if (el && el instanceof HTMLElement) {
        el.focus();
      }
      // Reset state on close
      setQuery('');
      setResults([]);
      setActiveIndex(-1);
    }
  }, [isOpen]);

  // ----- Debounced search -----

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setActiveIndex(-1);

    const timer = setTimeout(async () => {
      // Cancel previous in-flight request
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetchClient<SearchResult[]>('/search', {
          params: { q: query.trim(), limit: '6' },
          signal: controller.signal,
        });
        if (!controller.signal.aborted) {
          setResults(response.data ?? []);
        }
      } catch {
        if (!controller.signal.aborted) {
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [query]);

  // ----- Navigation -----

  const navigateToResult = useCallback(
    (result: SearchResult) => {
      router.push(`/catalog/${result.slug}`);
      onClose();
    },
    [router, onClose],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          setActiveIndex((prev) => {
            const next = prev + 1;
            return next >= results.length ? 0 : next;
          });
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          setActiveIndex((prev) => {
            const next = prev - 1;
            return next < 0 ? results.length - 1 : next;
          });
          break;
        }
        case 'Enter': {
          e.preventDefault();
          if (activeIndex >= 0 && results[activeIndex]) {
            navigateToResult(results[activeIndex]);
          }
          break;
        }
        case 'Escape': {
          e.preventDefault();
          onClose();
          break;
        }
        default:
          break;
      }
    },
    [activeIndex, results, navigateToResult, onClose],
  );

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const item = listRef.current.querySelector<HTMLElement>(
      `[id="${getOptionId(activeIndex)}"]`,
    );
    item?.scrollIntoView({ block: 'nearest' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  // ----- Body scroll lock -----

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // ----- Motion variants -----

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const dialogVariants = shouldReduceMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
      }
    : {
        hidden: { opacity: 0, scale: 0.96 },
        visible: { opacity: 1, scale: 1 },
      };

  const transition: Transition = { duration: 0.2, ease: 'easeOut' as const };

  // ----- Derived state -----

  const trimmedQuery = query.trim();
  const showEmpty = !isLoading && trimmedQuery.length > 0 && results.length === 0;
  const showResults = !isLoading && results.length > 0;
  const showHint = !trimmedQuery && !isLoading;

  // ----- Render -----

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="search-overlay"
            className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={transition}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Dialog */}
          <motion.div
            key="search-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Поиск по каталогу"
            className={cn(
              'fixed inset-0 z-[60] flex items-center justify-center',
              'p-4 sm:p-6',
            )}
            // Clicks on the wrapper (outside the inner box) should close
            onClick={(e) => {
              if (e.target === e.currentTarget) onClose();
            }}
          >
            <motion.div
              variants={dialogVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={transition}
              className={cn(
                // Mobile: full-screen, no rounding
                'flex h-full w-full flex-col overflow-hidden bg-[var(--surface-elevated)]',
                'shadow-[var(--shadow-elevated)]',
                // Desktop: centered card
                'sm:h-auto sm:max-h-[80vh] sm:max-w-[540px] sm:rounded-2xl',
                'sm:mx-4',
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search input row */}
              <div className="flex shrink-0 items-center gap-3 border-b border-[var(--border-default)] px-5 py-4">
                <Search
                  size={20}
                  className="shrink-0 text-[var(--color-graphite-light)]"
                  aria-hidden="true"
                />
                <input
                  ref={inputRef}
                  type="search"
                  role="combobox"
                  aria-expanded={results.length > 0}
                  aria-controls={listboxId}
                  aria-autocomplete="list"
                  aria-activedescendant={activeDescendant}
                  autoComplete="off"
                  spellCheck={false}
                  className={cn(
                    'min-w-0 flex-1 bg-transparent text-base text-[var(--color-graphite)]',
                    'placeholder:text-[var(--color-graphite-light)]',
                    'outline-none',
                    // Remove browser default search input decorations
                    '[appearance:textfield] [&::-webkit-search-cancel-button]:hidden',
                  )}
                  placeholder="Поиск тортов и десертов..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActiveIndex(-1);
                  }}
                  onKeyDown={handleKeyDown}
                />
                <kbd
                  className={cn(
                    'hidden shrink-0 cursor-default select-none rounded px-1.5 py-0.5',
                    'border border-[var(--color-champagne)]',
                    'text-xs text-[var(--color-graphite-light)]',
                    'sm:inline-flex sm:items-center',
                  )}
                  title="Закрыть (Escape)"
                >
                  ESC
                </kbd>
              </div>

              {/* Body */}
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                {/* Hint state */}
                {showHint && (
                  <p className="px-5 py-8 text-center text-sm text-[var(--color-graphite-light)]">
                    Начните вводить название...
                  </p>
                )}

                {/* Loading state */}
                {isLoading && (
                  <div className="px-3 py-2" aria-busy="true" aria-label="Загрузка результатов">
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </div>
                )}

                {/* Empty state */}
                {showEmpty && (
                  <p className="px-5 py-8 text-center text-sm text-[var(--color-graphite-light)]">
                    Ничего не найдено по&nbsp;
                    <span className="font-medium text-[var(--color-graphite)]">
                      &laquo;{trimmedQuery}&raquo;
                    </span>
                  </p>
                )}

                {/* Results */}
                {showResults && (
                  <div className="px-3 py-2">
                    <p className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-graphite-light)]">
                      Товары
                    </p>
                    <ul
                      ref={listRef}
                      id={listboxId}
                      role="listbox"
                      aria-label="Результаты поиска"
                      className="flex flex-col gap-0.5"
                    >
                      {results.map((result, index) => (
                        <ResultRow
                          key={result.id}
                          result={result}
                          index={index}
                          isActive={index === activeIndex}
                          resultId={getOptionId(index)}
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => navigateToResult(result)}
                        />
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Footer hint bar */}
              <div
                className={cn(
                  'flex shrink-0 items-center justify-between border-t border-[var(--border-default)]',
                  'px-5 py-2.5',
                )}
              >
                <p className="text-xs text-[var(--color-graphite-light)]">
                  <span className="mr-1 font-mono">↑↓</span>навигация
                  <span className="mx-2 opacity-40">·</span>
                  <span className="mr-1 font-mono">Enter</span>выбор
                </p>
                {showResults && (
                  <p className="text-xs text-[var(--color-graphite-light)]">
                    {results.length}{' '}
                    {results.length === 1
                      ? 'результат'
                      : results.length >= 2 && results.length <= 4
                        ? 'результата'
                        : 'результатов'}
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
