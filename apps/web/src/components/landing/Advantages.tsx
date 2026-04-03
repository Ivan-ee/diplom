import { Leaf, Clock, Sparkles } from 'lucide-react';

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
      'Каждый торт готовится под ваш заказ. Никаких заготовок — только свежая выпечка к&nbsp;вашей дате.',
  },
];

export function Advantages() {
  return (
    <section className="bg-[var(--color-cream)] py-16 px-4">
      <div className="mx-auto max-w-7xl">
        {/* Inner container */}
        <div className="rounded-2xl bg-white/60 px-6 py-12 sm:px-10 lg:px-16">
          {/* Heading */}
          <div className="mb-10 text-center">
            <h2 className="font-heading font-semibold text-3xl text-[var(--color-dark)]">
              Наши преимущества
            </h2>
            <p className="mt-2 text-[var(--color-text-secondary)]">
              Почему клиенты выбирают нас снова и снова
            </p>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {advantages.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="flex flex-col items-center text-center gap-4"
              >
                {/* Icon circle */}
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-cream)] shadow-sm">
                  <Icon
                    size={28}
                    className="text-[var(--color-dusty-rose)]"
                    strokeWidth={1.5}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <h3 className="font-heading font-semibold text-lg text-[var(--color-dark)]">
                    {title}
                  </h3>
                  <p
                    className="text-sm text-[var(--color-text-secondary)] leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: description }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
