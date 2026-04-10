'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ProductGalleryProps {
  images: string[];
  name: string;
}

export function ProductGallery({ images, name }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const hasImages = images.length > 0;

  return (
    <div className="lg:sticky lg:top-24 self-start flex flex-col gap-4">
      {/* Main image */}
      <div className="relative aspect-[4/5] lg:aspect-square w-full rounded-2xl overflow-hidden bg-[var(--color-cream)]">
        {hasImages ? (
          <Image
            src={images[activeIndex]}
            alt={`${name} — фото ${activeIndex + 1}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 55vw"
            priority
          />
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
              aria-label={`Фото ${idx + 1}`}
              aria-pressed={idx === activeIndex}
              className={`relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                idx === activeIndex
                  ? 'border-[var(--color-dusty-rose)]'
                  : 'border-transparent hover:border-neutral-200'
              }`}
            >
              <Image
                src={src}
                alt={`${name} — миниатюра ${idx + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
