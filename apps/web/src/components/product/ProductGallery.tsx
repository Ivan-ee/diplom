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
    <div className="flex flex-col gap-4">
      {/* Main image */}
      <div className="relative h-96 w-full rounded-xl overflow-hidden bg-[var(--color-cream)] flex items-center justify-center">
        {hasImages ? (
          <Image
            src={images[activeIndex]}
            alt={`${name} — фото ${activeIndex + 1}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        ) : (
          <span className="text-[120px] select-none" aria-hidden="true">🎂</span>
        )}
      </div>

      {/* Thumbnail strip — only if more than 1 image */}
      {hasImages && images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {images.map((src, idx) => (
            <button
              key={src}
              onClick={() => setActiveIndex(idx)}
              className={`relative shrink-0 h-20 w-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                idx === activeIndex
                  ? 'border-[var(--color-dusty-rose)] shadow-sm'
                  : 'border-transparent hover:border-[var(--color-soft-peach)]'
              }`}
              aria-label={`Фото ${idx + 1}`}
              aria-pressed={idx === activeIndex}
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
    </div>
  );
}
