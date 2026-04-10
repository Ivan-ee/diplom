import Link from 'next/link';
import Image from 'next/image';
import { RevealOnScroll } from '@/components/ui/reveal-on-scroll';

// Set to true once /public/images/constructor-preview.jpg is added to the project
const HAS_CONSTRUCTOR_IMAGE = false;

export function CTASection() {
  return (
    <section className="py-20 lg:py-28 px-4 bg-[var(--color-warm-ivory)]">
      <div className="grid lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
        {/* Left — photo */}
        <RevealOnScroll delay={0}>
          <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-white shadow-lg">
            {HAS_CONSTRUCTOR_IMAGE ? (
              <Image
                src="/images/constructor-preview.jpg"
                alt="3D конструктор тортов"
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--color-toffee)]/20 to-[var(--color-warm-ivory)]">
                <span className="text-sm text-neutral-400 tracking-wide">Фото конструктора</span>
              </div>
            )}
          </div>
        </RevealOnScroll>

        {/* Right — text */}
        <RevealOnScroll delay={0.2} className="flex flex-col gap-6">
          <h2 className="font-heading font-bold tracking-tight text-4xl lg:text-5xl text-[var(--color-graphite)] leading-tight">
            Создайте свой идеальный торт
          </h2>

          <p className="text-lg text-[var(--color-graphite-light)] leading-relaxed">
            Выберите форму, начинку, покрытие и декор — увидите результат в 3D.
          </p>

          <div>
            <Link
              href="/constructor"
              className="inline-flex items-center justify-center rounded-full px-8 py-3 text-base font-medium bg-[var(--color-caramel)] hover:bg-[var(--color-caramel-hover)] text-white transition-colors duration-200"
            >
              Открыть конструктор
            </Link>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
