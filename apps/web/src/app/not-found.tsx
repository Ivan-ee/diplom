import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <span className="text-6xl mb-6">🎂</span>
      <h1 className="font-heading text-3xl font-bold text-[var(--color-graphite)] mb-3">
        Страница не найдена
      </h1>
      <p className="text-[var(--color-graphite-light)] mb-8 max-w-md">
        Похоже, эта страница убежала вместе с тортом. Но у нас ещё много вкусного!
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full bg-[var(--color-caramel)] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--color-caramel-hover)]"
        >
          На главную
        </Link>
        <Link
          href="/catalog"
          className="inline-flex items-center justify-center rounded-full border border-[var(--color-champagne)] px-6 py-3 text-sm font-medium text-[var(--color-graphite)] transition-colors hover:bg-[var(--color-champagne)]/40"
        >
          В каталог
        </Link>
      </div>
    </div>
  );
}
