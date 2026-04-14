'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Chip } from '@heroui/react';
import { formatPrice } from '@/lib/utils';
import { AddToCartControl } from '@/components/catalog/AddToCartControl';

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description?: string;
  composition?: string;
  category?: ProductCategory | string;
  type?: string;
  imageUrl?: string;
  images?: string[];
  /** Pricing mode. Defaults to 'per_kg' for backward-compat with older API responses. */
  priceType?: 'per_kg' | 'per_unit';
  /** Price per kilogram in kopecks. Present when priceType === 'per_kg'. */
  pricePerKg?: number | null;
  /** Fixed price per unit in kopecks. Present when priceType === 'per_unit'. */
  pricePerUnit?: number | null;
  priceMin?: number;
  priceMax?: number;
  minWeight?: string;
  maxWeight?: string;
  weightStep?: string;
  weightMin?: number;
  weightMax?: number;
  weightOptions?: number[];
  isAvailable?: boolean;
  createdAt?: string;
  occasions?: Array<{ id: string; name: string; slug: string }>;
}

interface ProductCardProps {
  product: Product;
}

const categoryLabels: Record<string, string> = {
  cake: 'Торт',
  cupcake: 'Капкейк',
  macaron: 'Макарон',
  pastry: 'Выпечка',
  classic: 'Классические',
  wedding: 'Свадебные',
  kids: 'Детские',
  bento: 'Бенто',
  cupcakes: 'Капкейки',
  trifles: 'Трайфлы',
};

export function ProductCard({ product }: ProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const minWeight =
    product.weightMin ??
    (product.weightOptions?.[0] ??
      (product.minWeight ? Math.round(parseFloat(product.minWeight) * 1000) : 1000));

  const categoryName =
    typeof product.category === 'object' && product.category !== null
      ? product.category.name
      : (product.category ?? '');

  const categorySlug =
    typeof product.category === 'object' && product.category !== null
      ? product.category.slug
      : (product.type ?? product.category ?? '');

  const categoryLabel = categoryLabels[categorySlug] ?? categoryName;

  const isPerUnit = product.priceType === 'per_unit';
  const displayPrice = isPerUnit
    ? (product.pricePerUnit ?? 0)
    : (product.pricePerKg ?? product.priceMin ?? 0);

  const imageUrl = product.imageUrl ?? product.images?.[0];

  return (
    <div className="group relative rounded-[var(--radius-card)] overflow-hidden bg-white border border-[var(--border-default)] hover:border-[var(--color-caramel)]/30 active:scale-[0.98] transition-all duration-200 ease-out flex flex-col h-full">
      {/* Image area */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[var(--color-warm-ivory)]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className={`object-cover group-hover:scale-105 ${imageLoaded ? 'opacity-100 blur-0' : 'opacity-0 blur-[8px]'}`}
            style={{ transition: 'opacity 300ms ease-out, filter 300ms ease-out, scale 600ms cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            onLoad={() => setImageLoaded(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[var(--color-warm-ivory)]">
            <span className="text-5xl text-[var(--color-soft-oat)] font-light select-none" aria-hidden="true">
              ~
            </span>
          </div>
        )}

        {/* Category badge */}
        {categoryLabel && (
          <div className="absolute top-3 left-3 z-10">
            <Chip size="sm" variant="soft" className="bg-[var(--surface-elevated)]/85 backdrop-blur-sm text-[var(--color-graphite)] text-xs font-medium">
              {categoryLabel}
            </Chip>
          </div>
        )}

        {/* Unavailable overlay */}
        {product.isAvailable === false && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-10">
            <span className="text-sm font-medium text-[var(--color-graphite-light)] bg-white/90 px-3 py-1.5 rounded-full">
              Нет в наличии
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-2.5 sm:p-4 flex flex-col flex-1">
        {/* Stretched link — covers the entire card at z-0 */}
        <Link
          href={`/catalog/${product.slug}`}
          aria-label={product.name}
          className="after:absolute after:inset-0 after:z-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-caramel)] focus-visible:ring-offset-2 focus-visible:rounded-[var(--radius-card)]"
          tabIndex={0}
        >
          <h3 className="text-xs sm:text-base font-medium text-[var(--color-graphite)] line-clamp-2 leading-snug min-h-[2.5rem] sm:min-h-[2.75rem]">
            {product.name}
          </h3>
        </Link>

        <p className="text-sm sm:text-lg font-semibold text-[var(--color-caramel)] mt-1">
          {isPerUnit
            ? formatPrice(product.pricePerUnit ?? 0)
            : `от ${formatPrice(product.pricePerKg ?? product.priceMin ?? 0)}/кг`}
        </p>

        {/* Button sits above the stretched link at z-10 */}
        <div className="mt-auto pt-2 sm:pt-3 relative z-10">
          <AddToCartControl product={product} variant="compact" />
        </div>
      </div>
    </div>
  );
}
