'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

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
          className={`text-lg ${i < rating ? 'text-[var(--color-dusty-rose)]' : 'text-gray-200'}`}
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
    <section className="py-16 px-4 bg-white">
      <div className="mx-auto max-w-7xl">
        {/* Heading */}
        <div className="mb-10 flex flex-col gap-2">
          <h2 className="font-heading font-semibold text-3xl text-[var(--color-dark)]">
            Отзывы наших клиентов
          </h2>
          <p className="text-[var(--color-text-secondary)]">
            Нам доверяют сотни семей в Арзамасе
          </p>
        </div>

        <Swiper
          modules={[Pagination, Autoplay]}
          spaceBetween={24}
          slidesPerView={1}
          pagination={{ clickable: true }}
          autoplay={{ delay: 6000, disableOnInteraction: false, pauseOnMouseEnter: true }}
          breakpoints={{
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
          className="!pb-10"
        >
          {reviews.map((review) => (
            <SwiperSlide key={review.id}>
              <div className="flex flex-col gap-4 rounded-xl bg-[var(--color-cream)] p-6 h-full min-h-[200px]">
                {/* Stars */}
                <StarRating rating={review.rating} />

                {/* Quote */}
                <p className="text-sm text-[var(--color-dark)] leading-relaxed flex-1">
                  &ldquo;{review.text}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-[var(--color-soft-peach)]/60">
                  <span className="font-heading font-semibold text-sm text-[var(--color-dark)]">
                    {review.author}
                  </span>
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    {review.date}
                  </span>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <style>{`
        .swiper-pagination-bullet {
          background: var(--color-dusty-rose);
          opacity: 0.35;
          width: 8px;
          height: 8px;
        }
        .swiper-pagination-bullet-active {
          opacity: 1;
          width: 24px;
          border-radius: 4px;
          transition: width 0.3s ease;
        }
      `}</style>
    </section>
  );
}
