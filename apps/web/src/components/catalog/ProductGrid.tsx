import Link from 'next/link';
import { ProductCard, type Product } from './ProductCard';
import { StaggerChildren, StaggerItem } from '@/components/ui/stagger-children';

interface ProductGridProps {
  products: Product[];
}

export function ProductGrid({ products }: ProductGridProps) {
  if (!products.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <h3 className="font-heading font-semibold text-xl text-[var(--color-graphite)]">
          Ничего не найдено
        </h3>
        <p className="text-[var(--color-graphite-light)] max-w-sm text-sm">
          Попробуйте изменить фильтры или сбросьте их, чтобы увидеть все товары.
        </p>
        <Link
          href="/catalog"
          className="mt-1 text-sm font-medium text-[var(--color-caramel)] hover:underline transition-colors duration-200"
        >
          Сбросить фильтры
        </Link>
      </div>
    );
  }

  return (
    <div id="product-grid">
      <StaggerChildren className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {products.map((product) => (
          <StaggerItem key={product.id}>
            <ProductCard product={product} />
          </StaggerItem>
        ))}
      </StaggerChildren>
    </div>
  );
}
