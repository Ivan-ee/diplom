import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function CTASection() {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-[var(--color-soft-peach)]/30 to-white">
      <div className="mx-auto max-w-3xl text-center flex flex-col items-center gap-6">
        {/* Decorative element */}
        <span className="text-5xl select-none" aria-hidden="true">🎂</span>

        <h2 className="font-heading font-bold text-4xl lg:text-5xl text-[var(--color-dark)] leading-tight">
          Создайте торт{' '}
          <span className="text-[var(--color-dusty-rose)]">мечты</span>
        </h2>

        <p className="text-lg text-[var(--color-text-secondary)] max-w-xl leading-relaxed">
          Наш 3D-конструктор позволит увидеть результат до заказа. Выберите форму, крем, декор и надпись — и мы воплотим вашу идею.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Button asChild size="lg" className="w-full sm:w-auto min-w-[220px]">
            <Link href="/constructor">Открыть конструктор</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full sm:w-auto min-w-[220px]">
            <Link href="/catalog">Перейти в каталог</Link>
          </Button>
        </div>

        {/* Small note */}
        <p className="text-sm text-[var(--color-text-secondary)]">
          Бесплатно и без регистрации — просто начните собирать
        </p>
      </div>
    </section>
  );
}
