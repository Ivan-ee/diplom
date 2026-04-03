import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ProductCard, type Product } from './ProductCard';

interface ProductGridProps {
  products: Product[];
}

export function ProductGrid({ products }: ProductGridProps) {
  if (!products.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <span className="text-6xl select-none" aria-hidden="true">🍰</span>
        <h3 className="font-heading font-semibold text-xl text-[var(--color-dark)]">
          По вашим параметрам ничего не найдено
        </h3>
        <p className="text-[var(--color-text-secondary)] max-w-sm text-sm">
          Попробуйте изменить фильтры или сбросьте их, чтобы увидеть все товары.
        </p>
        <Button asChild variant="outline">
          <Link href="/catalog">Сбросить фильтры</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
