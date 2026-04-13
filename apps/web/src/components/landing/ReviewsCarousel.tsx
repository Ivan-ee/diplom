import { StaggerChildren, StaggerItem } from '@/components/ui/stagger-children';

const reviews = [
  {
    id: 1,
    author: 'Мария И.',
    rating: 5,
    text: 'Заказывала торт на день рождения дочери — получилось просто великолепно! Вкус нежный, декор точно по пожеланиям. Все гости были в восторге. Обязательно закажу ещё!',
    date: 'Март 2026',
  },
  {
    id: 2,
    author: 'Алексей П.',
    rating: 5,
    text: 'Использовал 3D-конструктор, чтобы собрать торт для жены на годовщину. Очень удобно — видишь результат сразу. Торт приготовили точно по макету, было очень вкусно.',
    date: 'Февраль 2026',
  },
  {
    id: 3,
    author: 'Елена С.',
    rating: 4,
    text: 'Хороший выбор в каталоге, приятный сайт. Торт понравился, крем не слишком сладкий. Единственное пожелание — чуть больше вариантов начинок. В целом довольна!',
    date: 'Январь 2026',
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Оценка: ${rating} из 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`text-lg leading-none ${i < rating ? 'text-[var(--color-caramel)]' : 'text-[var(--color-champagne)]'}`}
          aria-hidden="true"
        >
          ★
        </span>
      ))}
    </div>
  );
}

export function ReviewsCarousel() {
  return (
    <section className="py-[var(--spacing-section-mobile)] lg:py-[var(--spacing-section-desktop)] px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-[length:var(--text-h2)] leading-[var(--leading-heading)] font-heading font-semibold text-center mb-12 text-[var(--color-graphite)]">
          Отзывы
        </h2>

        <StaggerChildren className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((review) => (
            <StaggerItem key={review.id}>
              <div className="flex flex-col bg-[var(--surface-elevated)] rounded-[var(--radius-card)] p-8 border border-[var(--border-default)] shadow-[var(--shadow-card)] h-full">
                <StarRating rating={review.rating} />

                <span
                  className="text-4xl text-[var(--color-toffee)]/40 font-[family-name:var(--font-editorial)] leading-none select-none mt-4"
                  aria-hidden="true"
                >
                  &ldquo;
                </span>

                <p className="font-[family-name:var(--font-editorial)] text-lg lg:text-xl leading-relaxed text-[var(--color-graphite-light)] flex-1">
                  {review.text}
                </p>

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--border-default)]">
                  <span className="font-heading font-medium text-[length:var(--text-body-sm)] text-[var(--color-graphite)]">
                    {review.author}
                  </span>
                  <span className="text-[length:var(--text-caption)] text-[var(--color-graphite-light)]/60">
                    {review.date}
                  </span>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}
