'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
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
  pricePerKg?: number;
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
};

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  const minWeight = product.weightMin ?? (product.weightOptions?.[0] ?? (product.minWeight ? parseFloat(product.minWeight) * 1000 : 1000));
  const categoryName = typeof product.category === 'object' && product.category !== null
    ? product.category.name
    : (product.category ?? '');
  const categorySlug = typeof product.category === 'object' && product.category !== null
    ? product.category.slug
    : (product.type ?? product.category ?? '');
  const categoryLabel = categoryLabels[categorySlug] ?? categoryName;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      type: 'product',
      productId: product.id,
      name: product.name,
      imageUrl: product.imageUrl ?? product.images?.[0] ?? '',
      weight: minWeight,
      price: product.pricePerKg ?? product.priceMin ?? 0,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <Link href={`/catalog/${product.slug}`} className="group block focus:outline-none">
      <Card className="overflow-hidden transition-all duration-200 ease-out group-hover:-translate-y-0.5 group-hover:shadow-lg group-focus-visible:ring-2 group-focus-visible:ring-[var(--color-dusty-rose)] group-focus-visible:ring-offset-2">
        {/* Image area */}
        <div className="relative h-48 bg-[var(--color-cream)] overflow-hidden">
          {product.imageUrl || product.images?.[0] ? (
            <Image
              src={product.imageUrl ?? product.images![0]}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-6xl select-none" aria-hidden="true">🎂</span>
            </div>
          )}

          {/* Category badge overlay */}
          {categoryLabel && (
            <div className="absolute top-3 left-3">
              <Badge variant="secondary" className="shadow-sm">
                {categoryLabel}
              </Badge>
            </div>
          )}

          {/* Unavailable overlay */}
          {product.isAvailable === false && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <Badge variant="warning">Нет в наличии</Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h3 className="font-heading font-semibold text-[var(--color-dark)] text-base leading-tight line-clamp-2 group-hover:text-[var(--color-dusty-rose)] transition-colors duration-200">
              {product.name}
            </h3>
            {product.weightMin != null && (
              <p className="text-xs text-[var(--color-text-secondary)]">
                от {product.weightMin / 1000} кг
                {product.weightMax != null && product.weightMax !== product.weightMin
                  ? ` до ${product.weightMax / 1000} кг`
                  : ''}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 mt-auto">
            <div>
              <span className="font-heading font-bold text-lg text-[var(--color-dusty-rose)]">
                {formatPrice(product.pricePerKg ?? product.priceMin ?? 0)}
              </span>
              {product.pricePerKg && (
                <span className="text-xs text-[var(--color-text-secondary)] ml-1">
                  /кг
                </span>
              )}
            </div>

            <Button
              size="sm"
              variant={added ? 'secondary' : 'default'}
              onClick={handleAddToCart}
              disabled={product.isAvailable === false}
              className="shrink-0 transition-all duration-200"
              aria-label={`Добавить ${product.name} в корзину`}
            >
              {added ? (
                '✓ Добавлено'
              ) : (
                <>
                  <ShoppingCart size={14} />
                  В корзину
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
}
