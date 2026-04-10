import type { Metadata } from 'next';
import { Suspense } from 'react';
import { fetchServer } from '@/lib/api';
import { shopConfig } from '@/config/shop.config';

export const metadata: Metadata = {
  title: `Каталог — ${shopConfig.name}`,
  description: 'Свадебные, детские, классические торты, бенто, капкейки и трайфлы на заказ в Арзамасе.',
};
import { type Product } from '@/components/catalog/ProductCard';
import { ProductGrid } from '@/components/catalog/ProductGrid';
import { CatalogFilters } from '@/components/catalog/CatalogFilters';
import { Pagination } from '@/components/catalog/Pagination';

interface CatalogSearchParams {
  categorySlug?: string;
  occasion?: string;
  priceMin?: string;
  priceMax?: string;
  sort?: string;
  order?: string;
  page?: string;
}

interface ProductsApiResponse {
  items: Product[];
}

const LIMIT = 12;

async function CatalogContent({ searchParams }: { searchParams: CatalogSearchParams }) {
  const page = Math.max(1, Number(searchParams.page ?? 1));
  const sort = searchParams.sort ?? 'createdAt';
  const order = searchParams.order ?? 'desc';

  let products: Product[] = [];
  let total = 0;
  let fetchError = false;

  try {
    const res = await fetchServer<ProductsApiResponse>('/products', {
      params: {
        categorySlug: searchParams.categorySlug,
        occasion: searchParams.occasion,
        priceMin: searchParams.priceMin,
        priceMax: searchParams.priceMax,
        sort,
        order,
        page,
        limit: LIMIT,
      },
    });

    products = res.data?.items ?? (Array.isArray(res.data) ? (res.data as Product[]) : []);
    total = res.meta?.total ?? products.length;
  } catch (error) {
    console.error('Failed to fetch products:', error);
    products = [];
    total = 0;
    fetchError = true;
  }

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <>
      {fetchError && products.length === 0 && (
        <p className="text-center py-12 text-red-500">
          Не удалось загрузить товары. Попробуйте обновить страницу.
        </p>
      )}
      <ProductGrid products={products} />
      <Pagination currentPage={page} totalPages={totalPages} totalItems={total} />
    </>
  );
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Page header */}
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="font-heading font-bold text-4xl text-[var(--color-dark)]">Каталог</h1>
        <p className="text-[var(--color-text-secondary)]">
          Авторские торты, капкейки и трайфлы ручной работы
        </p>
      </div>

      {/* Filters — wrapped in Suspense because CatalogFilters uses useSearchParams */}
      <div className="mb-8">
        <Suspense fallback={<div className="h-10 animate-pulse rounded-lg bg-gray-100" />}>
          <CatalogFilters />
        </Suspense>
      </div>

      {/* Product grid + pagination */}
      <Suspense
        fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: LIMIT }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        }
      >
        <CatalogContent searchParams={params} />
      </Suspense>
    </div>
  );
}
