'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/stores/cart-store';

interface Product {
  id: string;
  name: string;
  slug: string;
  images: string[];
  pricePerKg: number | null;
  pricePerUnit: number | null;
  pricingType: string;
  isAvailable: boolean;
}

export function CartCrossSell() {
  const [products, setProducts] = useState<Product[]>([]);
  const cartItems = useCartStore((s) => s.items);

  const cartProductIds = cartItems.map((item) => item.productId).filter(Boolean);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch('/api/products?limit=8&sort=createdAt&order=desc');
        const json = await res.json();
        if (json.success && json.data?.products) {
          const filtered = json.data.products
            .filter((p: Product) => p.isAvailable && !cartProductIds.includes(p.id))
            .slice(0, 4);
          setProducts(filtered);
        }
      } catch {
        // Silent fail — cross-sell is optional
      }
    }
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (products.length === 0) return null;

  return (
    <div className="mt-8 pt-6 border-t border-[var(--color-champagne)]">
      <h3 className="font-heading text-base font-semibold text-[var(--color-graphite)] mb-4">
        Добавить к заказу
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {products.map((product) => {
          const price =
            product.pricingType === 'per_unit'
              ? product.pricePerUnit
              : product.pricePerKg;
          const imageUrl = product.images?.[0];

          return (
            <Link
              key={product.id}
              href={`/catalog/${product.slug}`}
              className="group flex flex-col rounded-xl border border-[var(--color-champagne)]/60 overflow-hidden transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-square bg-[var(--color-warm-ivory)]">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-2xl">
                    🎂
                  </span>
                )}
              </div>
              <div className="p-2.5">
                <p className="text-xs font-medium text-[var(--color-graphite)] line-clamp-2 leading-tight mb-1">
                  {product.name}
                </p>
                {price != null && (
                  <p className="text-xs font-semibold text-[var(--color-caramel)]">
                    {price.toLocaleString('ru-RU')} ₽
                    {product.pricingType === 'per_kg' ? '/кг' : ''}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
