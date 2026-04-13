'use client';

import Link from 'next/link';
import Image from 'next/image';
import { RevealOnScroll } from '@/components/ui/reveal-on-scroll';
import { Carousel } from '@/components/ui/Carousel';

interface HeroSectionProps {
  heroImages?: Array<{ src: string; alt: string }>;
}

export function HeroSection({ heroImages }: HeroSectionProps) {
  const hasImages = heroImages && heroImages.length > 0;

  return (
    <section className="relative overflow-hidden px-4 py-16 lg:py-24">
      <div className="max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">

          {/* Right column (image) — rendered first in DOM so it appears above text on mobile */}
          <div className="order-first lg:order-none">
            {hasImages ? (
              <div className="relative rounded-[var(--radius-hero)] overflow-hidden">
                <Carousel
                  ariaLabel="Фото тортов"
                  autoplay={{ delay: 5000, stopOnInteraction: true }}
                  showDots
                  options={{ loop: true }}
                  slideClassName="basis-full"
                >
                  {heroImages.map((img, i) => (
                    <div key={i} className="aspect-[16/9] lg:aspect-square relative">
                      <Image
                        src={img.src}
                        alt={img.alt}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        priority={i === 0}
                      />
                    </div>
                  ))}
                </Carousel>
                {/* Floating price card */}
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2.5 shadow-[var(--shadow-card)]">
                  <p className="text-sm font-semibold text-[var(--color-graphite)]">от 1 500 ₽/кг</p>
                  <p className="text-xs text-[var(--color-graphite-light)]">Бесплатная дегустация</p>
                </div>
              </div>
            ) : (
              <div className="aspect-[16/9] lg:aspect-square rounded-[var(--radius-hero)] bg-gradient-to-br from-[var(--surface-secondary)] to-[var(--color-champagne)] flex items-center justify-center">
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

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/catalog"
                className="inline-flex items-center justify-center bg-[var(--color-caramel)] hover:bg-[var(--color-caramel-hover)] text-white rounded-full px-8 py-3.5 text-base font-medium transition-colors duration-200"
              >
                Выбрать торт
              </Link>
              <Link
                href="/constructor"
                className="inline-flex items-center justify-center border border-[var(--border-default)] text-[var(--color-graphite)] hover:bg-[var(--surface-secondary)] rounded-full px-8 py-3.5 text-base font-medium transition-colors duration-200"
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
