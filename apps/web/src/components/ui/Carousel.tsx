'use client';

import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import type { EmblaOptionsType, EmblaPluginType } from 'embla-carousel';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// useCarousel — low-level hook for advanced consumers
// ---------------------------------------------------------------------------

export interface UseCarouselReturn {
  emblaRef: ReturnType<typeof useEmblaCarousel>[0];
  emblaApi: ReturnType<typeof useEmblaCarousel>[1];
  selectedIndex: number;
  scrollSnaps: number[];
  canScrollPrev: boolean;
  canScrollNext: boolean;
  scrollPrev: () => void;
  scrollNext: () => void;
}

export function useCarousel(
  options?: EmblaOptionsType,
  plugins?: EmblaPluginType[],
): UseCarouselReturn {
  const [emblaRef, emblaApi] = useEmblaCarousel(options, plugins);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const syncState = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setScrollSnaps(emblaApi.scrollSnapList());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    syncState();
    emblaApi.on('select', syncState);
    emblaApi.on('reInit', syncState);
    return () => {
      emblaApi.off('select', syncState);
      emblaApi.off('reInit', syncState);
    };
  }, [emblaApi, syncState]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return {
    emblaRef,
    emblaApi,
    selectedIndex,
    scrollSnaps,
    canScrollPrev,
    canScrollNext,
    scrollPrev,
    scrollNext,
  };
}

// ---------------------------------------------------------------------------
// CarouselProps
// ---------------------------------------------------------------------------

export interface CarouselProps {
  /** Each direct child becomes a slide. */
  children: React.ReactNode;
  options?: EmblaOptionsType;
  /**
   * Pass `true` for defaults (delay: 3000, stopOnInteraction: true),
   * or an object to override individual options.
   */
  autoplay?: boolean | { delay?: number; stopOnInteraction?: boolean };
  showArrows?: boolean;
  showDots?: boolean;
  className?: string;
  /** Extra classes applied to every slide wrapper div. */
  slideClassName?: string;
  /** Required for accessibility — describes the carousel purpose. */
  ariaLabel: string;
}

// ---------------------------------------------------------------------------
// Carousel component
// ---------------------------------------------------------------------------

export function Carousel({
  children,
  options,
  autoplay,
  showArrows = true,
  showDots = true,
  className,
  slideClassName,
  ariaLabel,
}: CarouselProps) {
  // Build plugin list -------------------------------------------------------
  const plugins = React.useMemo<EmblaPluginType[]>(() => {
    if (!autoplay) return [];
    const config =
      typeof autoplay === 'object'
        ? {
            delay: autoplay.delay ?? 3000,
            stopOnInteraction: autoplay.stopOnInteraction ?? true,
          }
        : { delay: 3000, stopOnInteraction: true };
    return [Autoplay(config)];
  }, [autoplay]);

  // Merge options — default loop: true so the component works out of the box -
  const mergedOptions = React.useMemo<EmblaOptionsType>(
    () => ({ loop: true, align: 'start', ...options }),
    [options],
  );

  const {
    emblaRef,
    emblaApi,
    selectedIndex,
    scrollSnaps,
    canScrollPrev,
    canScrollNext,
    scrollPrev,
    scrollNext,
  } = useCarousel(mergedOptions, plugins);

  // Stable scrollTo callback for dot buttons --------------------------------
  const scrollTo = useCallback(
    (index: number) => emblaApi?.scrollTo(index),
    [emblaApi],
  );

  const slideCount = React.Children.count(children);

  // Wrap each child in an accessible slide div ------------------------------
  const slides = React.Children.map(children, (child, index) => (
    <div
      key={index}
      className={cn('embla__slide min-w-0 shrink-0 grow-0', slideClassName)}
      role="group"
      aria-roledescription="slide"
      aria-label={`Slide ${index + 1} of ${slideCount}`}
    >
      {child}
    </div>
  ));

  return (
    <div
      className={cn('relative', className)}
      aria-roledescription="carousel"
      aria-label={ariaLabel}
    >
      {/* Embla viewport */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {slides}
        </div>
      </div>

      {/* Prev arrow */}
      {showArrows && (
        <>
          <button
            type="button"
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            aria-label="Previous slide"
            className={cn(
              'absolute left-3 top-1/2 -translate-y-1/2 z-10',
              'hidden sm:flex items-center justify-center',
              'w-10 h-10 rounded-full',
              'bg-white/80 backdrop-blur-sm',
              'shadow-[var(--shadow-card)]',
              'text-[var(--color-graphite-light)]',
              'hover:text-[var(--color-graphite)]',
              'hover:shadow-[var(--shadow-card-hover)]',
              'transition-all duration-200',
              'disabled:opacity-0 disabled:pointer-events-none',
            )}
          >
            <ChevronLeft className="w-5 h-5" aria-hidden="true" />
          </button>

          {/* Next arrow */}
          <button
            type="button"
            onClick={scrollNext}
            disabled={!canScrollNext}
            aria-label="Next slide"
            className={cn(
              'absolute right-3 top-1/2 -translate-y-1/2 z-10',
              'hidden sm:flex items-center justify-center',
              'w-10 h-10 rounded-full',
              'bg-white/80 backdrop-blur-sm',
              'shadow-[var(--shadow-card)]',
              'text-[var(--color-graphite-light)]',
              'hover:text-[var(--color-graphite)]',
              'hover:shadow-[var(--shadow-card-hover)]',
              'transition-all duration-200',
              'disabled:opacity-0 disabled:pointer-events-none',
            )}
          >
            <ChevronRight className="w-5 h-5" aria-hidden="true" />
          </button>
        </>
      )}

      {/* Dot indicators — only rendered when there are multiple snaps */}
      {showDots && scrollSnaps.length > 1 && (
        <div
          className="flex items-center justify-center gap-1.5 mt-4"
          role="tablist"
          aria-label="Carousel slides"
        >
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={index === selectedIndex}
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => scrollTo(index)}
              className={cn(
                'rounded-full transition-all duration-200 ease-out',
                index === selectedIndex
                  ? 'w-6 h-1.5 bg-[var(--color-caramel)]'
                  : 'w-2 h-1.5 bg-[var(--color-champagne)]',
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
