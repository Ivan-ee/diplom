import { fetchServer } from '@/lib/api';
import { type Product } from '@/components/catalog/ProductCard';
import { HeroSection } from '@/components/landing/HeroSection';
import { PopularProducts } from '@/components/landing/PopularProducts';
import { Advantages } from '@/components/landing/Advantages';
import { ReviewsCarousel } from '@/components/landing/ReviewsCarousel';
import { CTASection } from '@/components/landing/CTASection';

export const revalidate = 3600;

interface ProductsResponse {
  items: Product[];
}

export default async function HomePage() {
  let products: Product[] = [];

  try {
    const res = await fetchServer<ProductsResponse>('/products', {
      params: { limit: 6, sort: 'createdAt', order: 'desc' },
      next: { revalidate: 3600 },
    });
    products = res.data?.items ?? (Array.isArray(res.data) ? (res.data as Product[]) : []);
  } catch {
    // API may be unavailable during build — render page without products
    products = [];
  }

  const heroImages = products
    .filter((p) => p.imageUrl)
    .slice(0, 5)
    .map((p) => ({ src: p.imageUrl as string, alt: p.name }));

  return (
    <>
      <HeroSection heroImages={heroImages} />
      <PopularProducts products={products} />
      <Advantages />
      <ReviewsCarousel />
      <CTASection />
    </>
  );
}
