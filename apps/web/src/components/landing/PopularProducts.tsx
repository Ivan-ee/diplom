'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { ProductCard, type Product } from '@/components/catalog/ProductCard';
import { Carousel } from '@/components/ui/Carousel';

interface PopularProductsProps {
  products: Product[];
}

export function PopularProducts({ products }: PopularProductsProps) {
  if (!products.length) return null;

  return (
    <section className="py-[var(--spacing-section-mobile)] lg:py-[var(--spacing-section-desktop)] px-4">
      <div className="max-w-7xl mx-auto">
        {/* Heading row */}
        <div className="flex items-end justify-between mb-8 lg:mb-12">
          <div>
            <h2 className="text-[length:var(--text-h2)] leading-[var(--leading-heading)] font-heading font-semibold text-[var(--color-graphite)]">
              Популярные десерты
            </h2>
            <p className="font-[family-name:var(--font-editorial)] text-[length:var(--text-body)] text-[var(--color-graphite-light)] mt-2">
              Самые любимые торты наших клиентов
            </p>
          </div>
          <Link
            href="/catalog"
            className="hidden sm:flex items-center gap-1 text-[length:var(--text-body-sm)] font-medium text-[var(--color-caramel)] hover:text-[var(--color-caramel-hover)] transition-colors shrink-0"
          >
            Смотреть все
            <ChevronRight size={16} />
          </Link>
        </div>

        {/* Carousel */}
        <Carousel
          ariaLabel="Популярные десерты"
          showArrows
          showDots
          options={{ loop: false, containScroll: 'trimSnaps', align: 'start', skipSnaps: true }}
          slideClassName="min-w-0 flex-[0_0_80%] sm:flex-[0_0_calc(50%-8px)] lg:flex-[0_0_calc(33.333%-10.667px)] xl:flex-[0_0_calc(25%-12px)]"
          containerClassName="gap-4"
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </Carousel>
      </div>
    </section>
  );
}
