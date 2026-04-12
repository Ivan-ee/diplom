import Link from 'next/link';
import { RevealOnScroll } from '@/components/ui/reveal-on-scroll';

export function HeroSection() {
  return (
    <section className="relative min-h-[60vh] lg:min-h-[70vh] flex items-center justify-center overflow-hidden px-4">
      <div className="max-w-3xl mx-auto w-full py-20 lg:py-0">
        <RevealOnScroll delay={0} className="flex flex-col items-center text-center gap-6">
          <h1 className="text-4xl text-[length:var(--text-display)] leading-[var(--leading-display)] font-heading font-semibold tracking-tight text-[var(--color-graphite)]">
            <span className="font-[family-name:var(--font-editorial)] italic">
              Торты ручной работы
            </span>
          </h1>

          <p className="text-[length:var(--text-body)] lg:text-lg text-[var(--color-graphite-light)] max-w-xl mx-auto leading-[var(--leading-body)]">
            Авторские торты, капкейки и десерты в Арзамасе. Каждый торт — произведение искусства.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
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
        </RevealOnScroll>
      </div>
    </section>
  );
}
