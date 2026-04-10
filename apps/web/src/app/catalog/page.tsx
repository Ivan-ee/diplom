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
import { ProductGridSkeleton } from '@/components/catalog/ProductGridSkeleton';
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
    <div className="pb-16">
      {/* Page header */}
      <div className="pt-12 pb-8 px-4 max-w-7xl mx-auto">
        <h1 className="text-5xl lg:text-6xl font-bold tracking-tight font-heading text-[var(--color-graphite)]">
          Каталог
        </h1>
        <p className="text-lg text-[var(--color-graphite-light)] mt-3">
          Торты, капкейки и десерты ручной работы
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8">
        <Suspense fallback={<div className="h-10 animate-pulse rounded-xl bg-[var(--color-champagne)]/40 max-w-7xl mx-auto px-4" />}>
          <CatalogFilters />
        </Suspense>
      </div>

      {/* Product grid + pagination */}
      <div className="max-w-7xl mx-auto px-4">
        <Suspense fallback={<ProductGridSkeleton />}>
          <CatalogContent searchParams={params} />
        </Suspense>
      </div>
    </div>
  );
}
