import Link from 'next/link';
import { RevealOnScroll } from '@/components/ui/reveal-on-scroll';

const steps = [
  { step: '1', label: 'Форма', icon: '○' },
  { step: '2', label: 'Основа', icon: '◎' },
  { step: '3', label: 'Начинка', icon: '◉' },
  { step: '4', label: 'Покрытие', icon: '◍' },
  { step: '5', label: 'Декор', icon: '✦' },
];

export function CTASection() {
  return (
    <section className="py-[var(--spacing-section-mobile)] lg:py-[var(--spacing-section-desktop)] px-4 bg-[var(--color-warm-ivory)]">
      <div className="grid lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
        {/* Left — step diagram */}
        <RevealOnScroll delay={0}>
          <div className="relative rounded-[var(--radius-hero)] overflow-hidden bg-[var(--surface-elevated)] border border-[var(--border-default)] p-8 lg:p-12 flex flex-col justify-center aspect-[4/3]">
            <div className="grid grid-cols-5 gap-3 lg:gap-4">
              {steps.map((s) => (
                <div key={s.step} className="flex flex-col items-center gap-2 text-center">
                  <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-[var(--color-caramel)]/10 flex items-center justify-center text-[var(--color-caramel)] text-lg lg:text-xl">
                    {s.icon}
                  </div>
                  <span className="text-[length:var(--text-caption)] lg:text-[length:var(--text-body-sm)] font-medium text-[var(--color-graphite)]">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-center mt-6 lg:mt-8 text-[length:var(--text-body-sm)] text-[var(--color-graphite-light)]">
              Бесплатно · 5 простых шагов · Точный расчёт цены
            </p>
          </div>
        </RevealOnScroll>

        {/* Right — text */}
        <RevealOnScroll delay={0.2} className="flex flex-col gap-6">
          <h2 className="text-[length:var(--text-h2)] lg:text-[length:var(--text-h1)] leading-[var(--leading-heading)] font-heading font-semibold text-[var(--color-graphite)]">
            Создайте свой{' '}
            <span className="font-[family-name:var(--font-editorial)]">идеальный</span>{' '}
            торт
          </h2>

          <p className="text-[length:var(--text-body)] text-[var(--color-graphite-light)] leading-[var(--leading-body)]">
            Выберите форму, начинку, покрытие и декор — увидите результат в 3D.
          </p>

          <div>
            <Link
              href="/constructor"
              className="inline-flex items-center justify-center rounded-full px-8 py-3.5 text-base font-medium bg-[var(--color-caramel)] hover:bg-[var(--color-caramel-hover)] text-white transition-colors duration-200"
            >
              Открыть конструктор
            </Link>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
