import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { fetchServer } from '@/lib/api';
import { type Product } from '@/components/catalog/ProductCard';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductInfo } from '@/components/product/ProductInfo';

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

interface ProductsListResponse {
  items: Product[];
}

export async function generateStaticParams() {
  try {
    const res = await fetchServer<ProductsListResponse>('/products', {
      params: { limit: 100 },
    });
    const items: Product[] =
      res.data?.items ?? (Array.isArray(res.data) ? (res.data as Product[]) : []);
    return items.map((p) => ({ slug: p.slug }));
  } catch (error) {
    console.error('generateStaticParams: failed to fetch product list:', error);
    return [];
  }
}

export async function generateMetadata({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  try {
    const res = await fetchServer<Product>(`/products/${slug}`);
    const product = res.data;
    return {
      title: `${product.name} — Кондитерская`,
      description: product.description ?? `Купить ${product.name} в кондитерской Арзамаса`,
    };
  } catch (error) {
    console.error(`generateMetadata: failed to fetch product "${slug}":`, error);
    return { title: 'Продукт — Кондитерская' };
  }
}

export const revalidate = 3600;

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;

  let product: Product;
  try {
    const res = await fetchServer<Product>(`/products/${slug}`, {
      next: { revalidate: 3600 },
    });
    product = res.data;
  } catch {
    notFound();
  }

  const images: string[] = product.images?.length
    ? product.images
    : product.imageUrl
      ? [product.imageUrl]
      : [];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav
        className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] mb-8"
        aria-label="Хлебные крошки"
      >
        <Link href="/" className="hover:text-[var(--color-dusty-rose)] transition-colors duration-200">
          Главная
        </Link>
        <ChevronRight size={14} className="shrink-0" />
        <Link href="/catalog" className="hover:text-[var(--color-dusty-rose)] transition-colors duration-200">
          Каталог
        </Link>
        <ChevronRight size={14} className="shrink-0" />
        <span className="text-[var(--color-dark)] font-medium truncate max-w-[200px]">
          {product.name}
        </span>
      </nav>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        {/* Gallery */}
        <ProductGallery images={images} name={product.name} />

        {/* Info */}
        <ProductInfo product={product} />
      </div>

      {/* Divider */}
      <div className="mt-16 border-t border-gray-100" />

      {/* Back to catalog */}
      <div className="mt-8 flex justify-center">
        <Link
          href="/catalog"
          className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-dusty-rose)] transition-colors duration-200 flex items-center gap-1"
        >
          <ChevronRight size={14} className="rotate-180" />
          Вернуться в каталог
        </Link>
      </div>
    </div>
  );
}
