'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { fetchClient } from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';
import { useCartStore } from '@/stores/cart-store';
import { useCartDrawer } from '@/hooks/useCartDrawer';
import { Carousel } from '@/components/ui/Carousel';
import { type Product } from '@/components/catalog/ProductCard';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CrossSellProps {
  categorySlug?: string;
  currentProductId: string;
}

interface ProductsListResponse {
  items: Product[];
}

// ---------------------------------------------------------------------------
// Skeleton card
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div className="border border-[var(--border-default)] rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-square bg-[var(--color-champagne)]" />
      <div className="p-2.5 space-y-2">
        <div className="h-3 bg-[var(--color-champagne)] rounded w-full" />
        <div className="h-3 bg-[var(--color-champagne)] rounded w-2/3" />
        <div className="flex items-center justify-between mt-2">
          <div className="h-4 bg-[var(--color-champagne)] rounded w-1/2" />
          <div className="w-8 h-8 rounded-full bg-[var(--color-champagne)]" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CrossSell card
// ---------------------------------------------------------------------------

interface CrossSellCardProps {
  product: Product;
}

function CrossSellCard({ product }: CrossSellCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartDrawer((s) => s.open);

  const imageUrl = product.imageUrl ?? product.images?.[0];

  const isPerUnit = product.priceType === 'per_unit';
  const minWeightG =
    product.weightMin ??
    product.weightOptions?.[0] ??
    (product.minWeight ? Math.round(parseFloat(product.minWeight) * 1000) : 1000);

  const price = isPerUnit
    ? (product.pricePerUnit ?? 0)
    : Math.round((product.pricePerKg ?? 0) * (minWeightG / 1000));

  const displayPrice = isPerUnit
    ? formatPrice(product.pricePerUnit ?? 0)
    : `от ${formatPrice(product.pricePerKg ?? product.priceMin ?? 0)}/кг`;

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    addItem({
      type: 'product',
      productId: product.id,
      name: product.name,
      imageUrl: imageUrl ?? '',
      weight: minWeightG,
      price,
      pricePerKg: isPerUnit ? undefined : (product.pricePerKg ?? undefined),
      pricePerUnit: isPerUnit ? (product.pricePerUnit ?? undefined) : undefined,
      priceType: isPerUnit ? 'per_unit' : 'per_kg',
      weightStep: product.weightStep
        ? Math.round(parseFloat(product.weightStep) * 1000)
        : 500,
      minWeight: minWeightG,
      maxWeight:
        product.weightMax ??
        (product.maxWeight ? Math.round(parseFloat(product.maxWeight) * 1000) : undefined),
    });

    openDrawer();
  }

  return (
    <Link
      href={`/catalog/${product.slug}`}
      className="block border border-[var(--border-default)] rounded-2xl overflow-hidden hover:border-[var(--color-caramel)]/40 hover:shadow-[var(--shadow-card-hover)] transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-caramel)] focus-visible:ring-offset-2"
    >
      {/* Thumbnail */}
      <div className="relative aspect-square overflow-hidden bg-[var(--color-warm-ivory)]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-opacity duration-300"
            sizes="(max-width: 640px) 42vw, (max-width: 1024px) 30vw, 23vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-4xl text-[var(--color-soft-oat)] font-light select-none" aria-hidden="true">
              ~
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5">
        <p className="text-sm text-[var(--color-graphite)] line-clamp-2 leading-snug min-h-[2.5rem]">
          {product.name}
        </p>
        <div className="flex items-center justify-between mt-2 gap-2">
          <span className="text-sm font-semibold text-[var(--color-caramel)] leading-none">
            {displayPrice}
          </span>
          <button
            type="button"
            onClick={handleAdd}
            aria-label={`Добавить ${product.name} в корзину`}
            className={cn(
              'w-8 h-8 rounded-full shrink-0',
              'border border-[var(--border-default)]',
              'flex items-center justify-center',
              'hover:bg-[var(--color-caramel)] hover:text-white hover:border-[var(--color-caramel)]',
              'transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-caramel)] focus-visible:ring-offset-1',
            )}
          >
            <Plus size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// CrossSell
// ---------------------------------------------------------------------------

const SKELETONS = Array.from({ length: 4 }, (_, i) => i);

export function CrossSell({ categorySlug, currentProductId }: CrossSellProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // Primary fetch — same category
        const primary = await fetchClient<ProductsListResponse>('/products', {
          params: { ...(categorySlug ? { categorySlug } : {}), limit: '7' },
        });

        const primaryItems: Product[] =
          primary.data?.items ??
          (Array.isArray(primary.data) ? (primary.data as Product[]) : []);

        const filtered = primaryItems.filter((p) => p.id !== currentProductId);
        let result = filtered.slice(0, 6);

        // Fallback fetch if we have fewer than 3 items and a category was given
        if (result.length < 3 && categorySlug) {
          const fallback = await fetchClient<ProductsListResponse>('/products', {
            params: { limit: '13' },
          });

          const fallbackItems: Product[] =
            fallback.data?.items ??
            (Array.isArray(fallback.data) ? (fallback.data as Product[]) : []);

          const existingIds = new Set([currentProductId, ...result.map((p) => p.id)]);
          const extras = fallbackItems
            .filter((p) => !existingIds.has(p.id))
            .slice(0, 6 - result.length);

          result = [...result, ...extras];
        }

        if (!cancelled) setProducts(result);
      } catch {
        // Silently suppress — cross-sell is non-critical
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [categorySlug, currentProductId]);

  // Nothing to show
  if (!loading && products.length === 0) return null;

  return (
    <div>
      <h2 className="text-xl font-semibold text-[var(--color-graphite)] mb-6">
        С этим тортом покупают
      </h2>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {SKELETONS.map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <Carousel
          ariaLabel="Сопутствующие товары"
          className="-ml-3"
          slideClassName="min-w-0 flex-[0_0_42%] sm:flex-[0_0_30%] lg:flex-[0_0_23%] pl-3"
          options={{ align: 'start', containScroll: 'trimSnaps' }}
          showArrows
          showDots
        >
          {products.map((product) => (
            <CrossSellCard key={product.id} product={product} />
          ))}
        </Carousel>
      )}
    </div>
  );
}
