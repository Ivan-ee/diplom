import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { shopConfig } from '@/config/shop.config';

export function HeroSection() {
  return (
    <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden bg-gradient-to-b from-[var(--color-cream)] via-white to-white px-4">
      {/* Decorative blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -left-24 h-[480px] w-[480px] rounded-full bg-[var(--color-soft-peach)]/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-16 -right-16 h-[380px] w-[380px] rounded-full bg-[var(--color-dusty-rose)]/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/3 right-1/4 h-[240px] w-[240px] rounded-full bg-[var(--color-cream)] blur-2xl"
      />

      {/* Decorative cake illustration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 hidden xl:flex flex-col items-center opacity-20 select-none"
      >
        <span className="text-[180px] leading-none">🎂</span>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center gap-6 max-w-3xl">
        {/* Eyebrow */}
        <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-soft-peach)]/60 px-4 py-1.5 text-sm font-medium text-[var(--color-dusty-rose)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-dusty-rose)]" />
          {shopConfig.shortName} — {shopConfig.city}
        </span>

        {/* Main heading */}
        <h1 className="font-heading font-bold text-[var(--color-dark)] text-5xl lg:text-6xl xl:text-7xl leading-[1.1] tracking-tight">
          Авторские торты{' '}
          <span className="text-[var(--color-dusty-rose)]">на заказ</span>
        </h1>

        {/* Subheading */}
        <p className="text-lg lg:text-xl text-[var(--color-text-secondary)] max-w-xl leading-relaxed">
          Соберите уникальный торт в&nbsp;3D-конструкторе или выберите из&nbsp;каталога — доставим в&nbsp;идеальном виде
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Button asChild size="lg" className="w-full sm:w-auto min-w-[200px]">
            <Link href="/constructor">Собрать свой торт</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full sm:w-auto min-w-[200px]">
            <Link href="/catalog">Смотреть каталог</Link>
          </Button>
        </div>

        {/* Trust indicators */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-sm text-[var(--color-text-secondary)]">
          <span>Авторские торты</span>
          <span className="h-4 w-px bg-gray-200 hidden sm:block" />
          <span>Собственный цех</span>
          <span className="h-4 w-px bg-gray-200 hidden sm:block" />
          <span>Доставка по Арзамасу</span>
        </div>
      </div>
    </section>
  );
}
