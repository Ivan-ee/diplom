import { Leaf, Clock, Sparkles } from 'lucide-react';
import { StaggerChildren, StaggerItem } from '@/components/ui/stagger-children';

const advantages = [
  {
    icon: Leaf,
    title: 'Натуральные ингредиенты',
    description:
      'Используем только свежие натуральные продукты без консервантов и искусственных красителей.',
  },
  {
    icon: Clock,
    title: 'Самовывоз в удобное время',
    description:
      'Выбирайте удобное время для получения заказа. Работаем без выходных с 9:00 до 20:00.',
  },
  {
    icon: Sparkles,
    title: 'Всегда свежее',
    description:
      'Каждый торт готовится под ваш заказ. Никаких заготовок — только свежая выпечка к вашей дате.',
  },
];

export function Advantages() {
  return (
    <section className="py-[var(--spacing-section-mobile)] lg:py-[var(--spacing-section-desktop)] px-4 bg-[var(--surface-secondary)]">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-[length:var(--text-h2)] leading-[var(--leading-heading)] font-heading font-semibold text-center mb-12 text-[var(--color-graphite)]">
          Почему выбирают нас
        </h2>

        <StaggerChildren className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 lg:grid lg:grid-cols-3 lg:gap-8 lg:overflow-visible">
            {advantages.map(({ icon: Icon, title, description }) => (
              <StaggerItem key={title} className="h-full">
                <div className="snap-start min-w-[260px] lg:min-w-0 flex flex-col items-center text-center rounded-[var(--radius-card)] bg-[var(--surface-elevated)] p-8 h-full">
                  <div className="w-12 h-12 rounded-full bg-[var(--surface-elevated)] border border-[var(--border-default)] flex items-center justify-center mb-4">
                    <Icon
                      size={22}
                      className="text-[var(--color-caramel)]"
                      strokeWidth={1.5}
                    />
                  </div>
                  <h3 className="font-heading font-semibold text-[length:var(--text-h3)] mb-2 text-[var(--color-graphite)]">
                    {title}
                  </h3>
                  <p className="text-[length:var(--text-body-sm)] text-[var(--color-graphite-light)] leading-[var(--leading-body)]">
                    {description}
                  </p>
                </div>
              </StaggerItem>
            ))}
        </StaggerChildren>
      </div>
    </section>
  );
}
