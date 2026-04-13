'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { cn } from '@/lib/utils';

interface ProductGalleryProps {
  images: string[];
  name: string;
}

export function ProductGallery({ images, name }: ProductGalleryProps) {
  const hasImages = images.length > 0;
  const multipleImages = images.length > 1;

  // Embla carousel — loop only when there are multiple images
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: multipleImages,
    align: 'start',
  });

  // Index tracked for thumbnails/dots and as the initial index passed to the lightbox
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Lightbox state — tracks its own current image independently after opening
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Sync selectedIndex from Embla on slide change
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi]);

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

  // Lightbox keyboard navigation and body scroll lock
  useEffect(() => {
    if (!lightboxOpen) return;

    document.body.style.overflow = 'hidden';

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setLightboxOpen(false);
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
      }
    }

    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKey);
    };
  }, [lightboxOpen, images.length]);

  return (
    <div className="lg:sticky lg:top-24 self-start flex flex-col gap-4">
      {/* Embla carousel — main image area */}
      {hasImages ? (
        <div
          className="embla overflow-hidden rounded-[var(--radius-hero)] bg-[var(--color-warm-ivory)] shadow-[var(--shadow-card)]"
          ref={emblaRef}
          aria-roledescription="carousel"
          aria-label="Галерея товара"
        >
          <div className="embla__container flex">
            {images.map((img, i) => (
              <div
                key={img}
                className="embla__slide flex-[0_0_100%] min-w-0"
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} из ${images.length}`}
              >
                <div
                  className="relative aspect-[4/5] sm:aspect-square cursor-zoom-in"
                  onClick={() => openLightbox(i)}
                >
                  <Image
                    src={img}
                    alt={`${name} — фото ${i + 1}`}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 55vw"
                    priority={i === 0}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // No images fallback
        <div className="relative aspect-[4/5] sm:aspect-square w-full rounded-[var(--radius-hero)] overflow-hidden bg-[var(--color-warm-ivory)] shadow-[var(--shadow-card)] flex items-center justify-center">
          <span className="text-[120px] select-none" aria-hidden="true">🎂</span>
        </div>
      )}

      {/* Desktop thumbnails — only if more than 1 image */}
      {hasImages && multipleImages && (
        <div className="hidden sm:flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-1">
          {images.map((src, i) => (
            <button
              key={src}
              onClick={() => emblaApi?.scrollTo(i)}
              className={cn(
                'relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-200',
                selectedIndex === i
                  ? 'border-[var(--color-caramel)]'
                  : 'border-transparent opacity-60 hover:opacity-100'
              )}
              aria-label={`Фото ${i + 1} из ${images.length}`}
              aria-pressed={selectedIndex === i}
            >
              <Image
                src={src}
                alt=""
                width={64}
                height={64}
                className="object-cover w-full h-full"
              />
            </button>
          ))}
        </div>
      )}

      {/* Mobile dots — only if more than 1 image */}
      {hasImages && multipleImages && (
        <div className="flex sm:hidden justify-center gap-1.5 mt-3">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              className={cn(
                'rounded-full transition-all duration-200',
                selectedIndex === i
                  ? 'w-6 h-1.5 bg-[var(--color-caramel)]'
                  : 'w-1.5 h-1.5 bg-[var(--color-champagne)]'
              )}
              aria-label={`Перейти к фото ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Lightbox — kept exactly as-is, uses lightboxIndex */}
      <AnimatePresence>
        {lightboxOpen && hasImages && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm"
            onClick={() => setLightboxOpen(false)}
          >
            {/* Close button */}
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Закрыть"
            >
              <X size={20} />
            </button>

            {/* Navigation arrows */}
            {multipleImages && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
                  }}
                  className="absolute left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                  aria-label="Предыдущее фото"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
                  }}
                  className="absolute right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                  aria-label="Следующее фото"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            {/* Main lightbox image */}
            <motion.img
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              src={images[lightboxIndex]}
              alt={`Фото ${lightboxIndex + 1}`}
              className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs text-white">
              {lightboxIndex + 1} / {images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
