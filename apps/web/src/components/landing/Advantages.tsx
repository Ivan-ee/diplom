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
    <section className="py-24 px-4 bg-neutral-50">
      <h2 className="font-heading font-bold tracking-tight text-4xl lg:text-5xl text-center mb-16 text-[var(--color-dark)]">
        Почему выбирают нас
      </h2>

      <StaggerChildren className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
        {advantages.map(({ icon: Icon, title, description }) => (
          <StaggerItem key={title} className="flex flex-col items-center text-center">
            <Icon
              size={48}
              className="text-[var(--color-dusty-rose)] mb-4"
              strokeWidth={1.5}
            />
            <h3 className="font-heading font-semibold text-xl mb-2 text-[var(--color-dark)]">
              {title}
            </h3>
            <p className="text-neutral-500 text-sm leading-relaxed">
              {description}
            </p>
          </StaggerItem>
        ))}
      </StaggerChildren>
    </section>
  );
}
