'use client';

import { ProductCard, type Product } from '@/components/catalog/ProductCard';
import { StaggerChildren, StaggerItem } from '@/components/ui/stagger-children';

interface PopularProductsProps {
  products: Product[];
}

export function PopularProducts({ products }: PopularProductsProps) {
  if (!products.length) return null;

  return (
    <section className="py-20 lg:py-28 px-4">
      {/* Heading */}
      <div className="text-center mb-12">
        <h2 className="font-heading font-bold tracking-tight text-4xl lg:text-5xl text-[var(--color-graphite)]">
          Популярные десерты
        </h2>
        <p className="text-lg text-[var(--color-graphite-light)] mt-4">
          Самые любимые торты наших клиентов
        </p>
      </div>

      {/* Grid */}
      <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {products.map((product) => (
          <StaggerItem key={product.id}>
            <ProductCard product={product} />
          </StaggerItem>
        ))}
      </StaggerChildren>
    </section>
  );
}
