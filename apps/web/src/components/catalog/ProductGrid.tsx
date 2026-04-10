import Link from 'next/link';
import { ProductCard, type Product } from './ProductCard';

interface ProductGridProps {
  products: Product[];
}

export function ProductGrid({ products }: ProductGridProps) {
  if (!products.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <h3 className="font-heading font-semibold text-xl text-neutral-900">
          Ничего не найдено
        </h3>
        <p className="text-neutral-500 max-w-sm text-sm">
          Попробуйте изменить фильтры или сбросьте их, чтобы увидеть все товары.
        </p>
        <Link
          href="/catalog"
          className="mt-1 text-sm font-medium text-[var(--color-dusty-rose)] hover:underline transition-colors duration-200"
        >
          Сбросить фильтры
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
