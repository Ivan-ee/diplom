import Link from 'next/link';
import Image from 'next/image';
import { RevealOnScroll } from '@/components/ui/reveal-on-scroll';

// Set to true once /public/images/hero-cake.jpg is added to the project
const HAS_HERO_IMAGE = false;

export function HeroSection() {
  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden px-4">
      <div className="grid lg:grid-cols-2 items-center gap-12 max-w-7xl mx-auto w-full py-24 lg:py-0">
        {/* Left column — text */}
        <RevealOnScroll delay={0} className="flex flex-col gap-6">
          <h1 className="font-[family-name:var(--font-editorial)] font-medium tracking-tight leading-[0.95] text-5xl lg:text-6xl xl:text-7xl text-[var(--color-graphite)]">
            Торты ручной работы
          </h1>

          <p className="text-lg lg:text-xl text-[var(--color-graphite-light)] max-w-lg leading-relaxed">
            Авторские торты, капкейки и десерты в Арзамасе. Каждый торт — произведение искусства.
          </p>

          <div className="pt-2">
            <Link
              href="/catalog"
              className="inline-flex items-center justify-center rounded-full px-8 py-3 text-base font-medium bg-[var(--color-caramel)] hover:bg-[var(--color-caramel-hover)] text-white transition-colors duration-200"
            >
              Выбрать торт
            </Link>
          </div>
        </RevealOnScroll>

        {/* Right column — photo */}
        <RevealOnScroll delay={0.2}>
          <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-[var(--color-warm-ivory)] shadow-xl">
            {HAS_HERO_IMAGE ? (
              <Image
                src="/images/hero-cake.jpg"
                alt="Авторский торт"
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--color-toffee)]/30 to-[var(--color-warm-ivory)]">
                <span className="text-sm text-neutral-400 tracking-wide">Фото торта</span>
              </div>
            )}
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
