'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Chip, Button } from '@heroui/react';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/stores/cart-store';

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
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

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

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      type: 'product',
      productId: product.id,
      name: product.name,
      imageUrl: imageUrl ?? '',
      weight: isPerUnit ? 0 : minWeight,
      price: displayPrice,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <Link href={`/catalog/${product.slug}`} aria-label={product.name} className="group block focus:outline-none h-full">
      <div className="rounded-2xl overflow-hidden bg-white border border-[var(--color-champagne)] hover:shadow-lg transition-all duration-300 focus-within:ring-2 focus-within:ring-[var(--color-caramel)] focus-within:ring-offset-2 flex flex-col h-full">
        {/* Image area */}
        <div className="relative aspect-[3/4] overflow-hidden bg-[var(--color-warm-ivory)]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[var(--color-warm-ivory)]">
              <span className="text-5xl text-neutral-300 font-light select-none" aria-hidden="true">
                ~
              </span>
            </div>
          )}

          {/* Category badge */}
          {categoryLabel && (
            <div className="absolute top-3 left-3 z-10">
              <Chip size="sm" variant="soft" className="bg-white/85 backdrop-blur-sm text-neutral-700 text-xs font-medium">
                {categoryLabel}
              </Chip>
            </div>
          )}

          {/* Unavailable overlay */}
          {product.isAvailable === false && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-10">
              <span className="text-sm font-medium text-neutral-500 bg-white/90 px-3 py-1.5 rounded-full">
                Нет в наличии
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="text-base font-medium text-[var(--color-graphite)] line-clamp-2 leading-snug min-h-[2.75rem]">
            {product.name}
          </h3>

          <p className="text-lg font-semibold text-[var(--color-caramel)] mt-1">
            {isPerUnit
              ? `${formatPrice(product.pricePerUnit ?? 0)} ₽`
              : `от ${formatPrice(product.pricePerKg ?? product.priceMin ?? 0)} ₽/кг`}
          </p>

          <motion.div whileTap={{ scale: 0.98 }} className="mt-auto pt-3 relative z-10">
            <Button
              fullWidth
              onClick={handleAddToCart}
              isDisabled={product.isAvailable === false}
              aria-label={`Добавить ${product.name} в корзину`}
              className={`w-full rounded-xl text-sm font-medium transition-colors duration-200 ${
                added
                  ? 'bg-[var(--color-champagne)] text-[var(--color-graphite-light)]'
                  : 'bg-[var(--color-caramel)] hover:bg-[var(--color-caramel-hover)] text-white'
              }`}
            >
              {added ? '✓ Добавлено' : 'В корзину'}
            </Button>
          </motion.div>
        </div>
      </div>
    </Link>
  );
}
