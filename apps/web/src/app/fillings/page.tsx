import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchServer } from '@/lib/api';
import { getMockIngredients } from '@/lib/constructor/mock-ingredients';
import { formatPrice } from '@/lib/utils';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Начинки — Кондитерская',
  description:
    'Все доступные начинки для тортов: клубничный крем, шоколадный ганаш, солёная карамель и другие. Натуральные ингредиенты, ручная работа.',
};

interface Filling {
  id: string;
  name: string;
  description?: string;
  pricePerKg: number;
  available: boolean;
}

interface IngredientsResponse {
  fillings: Filling[];
}

const FILLING_ACCENTS: Record<string, string> = {
  'filling-strawberry': '#E8A0A8',
  'filling-chocolate': '#7B4F3A',
  'filling-caramel': '#D4A055',
};

const FILLING_ACCENT_FALLBACKS = [
  '#D4A8B0',
  '#A8C4D4',
  '#B8D4A8',
  '#D4C4A8',
  '#C4A8D4',
];

function getAccentColor(id: string, index: number): string {
  return FILLING_ACCENTS[id] ?? FILLING_ACCENT_FALLBACKS[index % FILLING_ACCENT_FALLBACKS.length];
}

async function getFillings(): Promise<Filling[]> {
  try {
    const response = await fetchServer<IngredientsResponse>('/constructor/ingredients', {
      next: { revalidate: 3600 },
    });

    if (response.success && Array.isArray(response.data?.fillings)) {
      return response.data.fillings.filter((f) => f.available);
    }

    return getMockIngredients().fillings;
  } catch {
    return getMockIngredients().fillings;
  }
}

export default async function FillingsPage() {
  const fillings = await getFillings();

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero */}
      <section className="text-center mb-16">
        <h1 className="font-heading text-4xl sm:text-5xl font-bold text-dark mb-4">
          Наши начинки
        </h1>
        <p className="text-lg text-text-secondary max-w-2xl mx-auto">
          Каждая начинка готовится из натуральных ингредиентов. Без искусственных
          красителей и консервантов — только проверенные рецепты.
        </p>
      </section>

      {/* Fillings grid */}
      <section className="mb-16">
        {fillings.length === 0 ? (
          <p className="text-center text-text-secondary py-12">
            Список начинок временно недоступен. Пожалуйста, свяжитесь с нами напрямую.
          </p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6" role="list">
            {fillings.map((filling, index) => {
              const accent = getAccentColor(filling.id, index);
              return (
                <li
                  key={filling.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col"
                >
                  {/* Accent bar */}
                  <div
                    className="h-1.5 w-full shrink-0"
                    style={{ backgroundColor: accent }}
                    aria-hidden="true"
                  />

                  <div className="flex flex-col gap-3 p-6 flex-1">
                    <h2 className="font-heading text-xl font-semibold text-dark">
                      {filling.name}
                    </h2>

                    {filling.description && (
                      <p className="text-sm text-text-secondary leading-relaxed flex-1">
                        {filling.description}
                      </p>
                    )}

                    <p className="text-sm font-medium text-[var(--color-dusty-rose)] mt-auto">
                      {formatPrice(filling.pricePerKg)} / кг
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Info block */}
      <section className="bg-cream rounded-2xl p-8 sm:p-12 mb-16">
        <h2 className="font-heading text-2xl font-semibold text-dark mb-4">
          Как мы готовим начинки
        </h2>
        <div className="space-y-4 text-text-secondary leading-relaxed">
          <p>
            Все начинки изготавливаются вручную в день сборки торта. Мы используем только
            свежие сливки, натуральные ягодные пюре и бельгийский шоколад — никаких
            растительных жиров и усилителей вкуса.
          </p>
          <p>
            Количество начинки регулируется при заказе: можно попросить больше крема
            между коржами или уменьшить его для более плотного торта. Укажите пожелания
            в поле комментария при оформлении заказа.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center">
        <p className="text-text-secondary mb-6">
          Хотите сами собрать торт с любимой начинкой?
        </p>
        <Link
          href="/constructor"
          className="inline-block rounded-xl bg-[var(--color-dusty-rose)] px-8 py-3 font-heading font-semibold text-white text-base hover:opacity-90 active:scale-[0.98] transition-all duration-200"
        >
          Попробуйте в конструкторе
        </Link>
      </section>
    </div>
  );
}
