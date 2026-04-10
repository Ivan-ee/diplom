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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumbs */}
      <nav
        className="flex items-center gap-2 text-sm text-neutral-400 mb-10"
        aria-label="Хлебные крошки"
      >
        <Link href="/" className="hover:text-neutral-600 transition-colors duration-200">
          Главная
        </Link>
        <ChevronRight size={13} className="shrink-0 text-neutral-300" />
        <Link href="/catalog" className="hover:text-neutral-600 transition-colors duration-200">
          Каталог
        </Link>
        <ChevronRight size={13} className="shrink-0 text-neutral-300" />
        <span className="text-neutral-700 font-medium">
          {product.name}
        </span>
      </nav>

      {/* Main content — Apple-style asymmetric grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-16">
        {/* Gallery — sticky on desktop */}
        <ProductGallery images={images} name={product.name} />

        {/* Info */}
        <ProductInfo product={product} />
      </div>
    </div>
  );
}
