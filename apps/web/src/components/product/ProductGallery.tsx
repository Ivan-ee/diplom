'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

interface ProductGalleryProps {
  images: string[];
  name: string;
}

export function ProductGallery({ images, name }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const hasImages = images.length > 0;

  useEffect(() => {
    if (!lightboxOpen) return;

    document.body.style.overflow = 'hidden';

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowLeft') setActiveIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
      if (e.key === 'ArrowRight') setActiveIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
    }

    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKey);
    };
  }, [lightboxOpen, images.length]);

  return (
    <div
      className="lg:sticky lg:top-24 self-start flex flex-col gap-4 outline-none"
      tabIndex={hasImages ? 0 : undefined}
      aria-roledescription="carousel"
      aria-label="Галерея товара"
      onKeyDown={(e) => {
        if (!hasImages || images.length < 2) return;
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
        }
      }}
    >
      {/* Main image */}
      <div
        className={`group relative aspect-[4/5] lg:aspect-square w-full rounded-[var(--radius-hero)] overflow-hidden bg-[var(--color-warm-ivory)] shadow-[var(--shadow-card)] ${hasImages ? 'cursor-zoom-in' : ''}`}
        onClick={() => hasImages && setLightboxOpen(true)}
      >
        {hasImages ? (
          <>
            <Image
              src={images[activeIndex]}
              alt={`${name} — фото ${activeIndex + 1}`}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 55vw"
              priority
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/5 rounded-[var(--radius-hero)]">
              <ZoomIn size={24} className="text-white drop-shadow-md" />
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[120px] select-none" aria-hidden="true">🎂</span>
          </div>
        )}
      </div>

      {/* Thumbnail strip — only if more than 1 image */}
      {hasImages && images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {images.map((src, idx) => (
            <button
              key={src}
              onClick={() => setActiveIndex(idx)}
              aria-label={`Фото ${idx + 1} из ${images.length}`}
              aria-pressed={idx === activeIndex}
              className={`relative shrink-0 w-20 h-20 rounded-[var(--radius-control)] overflow-hidden border-2 transition-all duration-200 ${
                idx === activeIndex
                  ? 'border-[var(--color-caramel)]'
                  : 'border-transparent hover:border-[var(--color-champagne)]'
              }`}
            >
              <Image
                src={src}
                alt={`${name} — миниатюра ${idx + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && hasImages && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
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
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveIndex(prev => prev === 0 ? images.length - 1 : prev - 1); }}
                  className="absolute left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                  aria-label="Предыдущее фото"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveIndex(prev => prev === images.length - 1 ? 0 : prev + 1); }}
                  className="absolute right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                  aria-label="Следующее фото"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            {/* Main image */}
            <motion.img
              key={activeIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              src={images[activeIndex]}
              alt={`Фото ${activeIndex + 1}`}
              className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs text-white">
              {activeIndex + 1} / {images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
