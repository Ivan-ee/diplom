'use client';

import Link from 'next/link';
import Image from 'next/image';
import { RevealOnScroll } from '@/components/ui/reveal-on-scroll';

interface HeroSectionProps {
  heroImages?: Array<{ src: string; alt: string }>;
}

export function HeroSection({ heroImages }: HeroSectionProps) {
  const hasImages = heroImages && heroImages.length > 0;

  return (
    <section className="relative overflow-hidden px-4 min-h-[calc(100dvh-72px)] flex items-center">
      <div className="max-w-6xl mx-auto w-full py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">

          {/* Right column (image) — rendered first in DOM so it appears above text on mobile */}
          <div className="order-first lg:order-none">
            {hasImages ? (
              <div className="relative w-full max-h-[calc(50dvh-36px)] lg:max-h-[calc(100dvh-72px-96px)] overflow-hidden rounded-[var(--radius-hero)]">
                <Image
                  src={heroImages[0].src}
                  alt={heroImages[0].alt}
                  width={800}
                  height={800}
                  className="w-full h-auto"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                  loading="eager"
                />
                <div className="absolute bottom-4 left-4 z-20 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2.5 shadow-[var(--shadow-card)]">
                  <p className="text-sm font-semibold text-[var(--color-graphite)]">от 1 500 ₽/кг</p>
                  <p className="text-xs text-[var(--color-graphite-light)]">Бесплатная дегустация</p>
                </div>
              </div>
            ) : (
              <div className="aspect-[4/3] max-h-[calc(50dvh-36px)] lg:max-h-none lg:aspect-square rounded-[var(--radius-hero)] bg-gradient-to-br from-[var(--surface-secondary)] to-[var(--color-champagne)] flex items-center justify-center">
                <span className="text-8xl opacity-60">🎂</span>
              </div>
            )}
          </div>

          {/* Left column (text) */}
          <RevealOnScroll delay={0} className="flex flex-col gap-6">
            <h1 className="text-[length:var(--text-display)] leading-[var(--leading-display)] font-heading font-semibold tracking-tight text-[var(--color-graphite)]">
              <span className="font-[family-name:var(--font-editorial)]">
                Торты ручной работы
              </span>
            </h1>

            <p className="text-[length:var(--text-body)] lg:text-lg text-[var(--color-graphite-light)] max-w-xl leading-[var(--leading-body)]">
              Авторские торты, капкейки и десерты в Арзамасе. Каждый торт — произведение искусства.
            </p>

            <div className="grid grid-cols-2 gap-3 lg:flex lg:items-center">
              <Link
                href="/catalog"
                className="inline-flex items-center justify-center bg-[var(--color-caramel)] hover:bg-[var(--color-caramel-hover)] text-white rounded-full py-3.5 text-sm lg:text-base font-medium transition-colors duration-200 lg:px-8"
              >
                Выбрать торт
              </Link>
              <Link
                href="/constructor"
                className="inline-flex items-center justify-center border border-[var(--border-default)] text-[var(--color-graphite)] hover:bg-[var(--surface-secondary)] rounded-full py-3.5 text-sm lg:text-base font-medium transition-colors duration-200 lg:px-8"
              >
                Собрать в 3D
              </Link>
            </div>

            <div className="flex flex-wrap gap-3 mt-2">
              <span className="flex items-center gap-1.5 text-xs text-[var(--color-graphite-light)]">
                <span className="text-[var(--color-caramel)]">✦</span> Натуральные ингредиенты
              </span>
              <span className="flex items-center gap-1.5 text-xs text-[var(--color-graphite-light)]">
                <span className="text-[var(--color-caramel)]">✦</span> Готовим от 1 дня
              </span>
            </div>
          </RevealOnScroll>

        </div>
      </div>
    </section>
  );
}
