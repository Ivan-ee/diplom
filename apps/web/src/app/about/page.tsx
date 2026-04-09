import type { Metadata } from 'next';
import { Heart, Award, Clock, Phone } from 'lucide-react';
import { shopConfig } from '@/config/shop.config';

export const metadata: Metadata = {
  title: `О нас — ${shopConfig.name}`,
  description: shopConfig.description,
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero */}
      <section className="text-center mb-16">
        <h1 className="font-heading text-4xl sm:text-5xl font-bold text-dark mb-4">
          О нашей кондитерской
        </h1>
        <p className="text-lg text-text-secondary max-w-2xl mx-auto">
          Мастерская счастья — так мы называем нашу домашнюю кондитерскую в Арзамасе.
          Авторские торты на заказ от Елены Канаевой: свадебные, детские, бенто,
          капкейки и трайфлы — каждый с заботой и вниманием к деталям.
        </p>
      </section>

      {/* Values */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-16">
        {[
          {
            icon: Heart,
            title: 'С любовью',
            text: 'Каждый торт — это произведение искусства, созданное с душой и вниманием к деталям',
          },
          {
            icon: Award,
            title: 'Качество',
            text: 'Только натуральные ингредиенты от проверенных поставщиков, без консервантов',
          },
          {
            icon: Clock,
            title: 'Свежесть',
            text: 'Готовим торт в день выдачи, чтобы вы получили самый свежий и вкусный десерт',
          },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cream">
              <Icon size={24} className="text-dusty-rose" />
            </div>
            <h3 className="font-heading text-lg font-semibold text-dark mb-2">{title}</h3>
            <p className="text-sm text-text-secondary">{text}</p>
          </div>
        ))}
      </section>

      {/* Story */}
      <section className="bg-cream rounded-2xl p-8 sm:p-12 mb-16">
        <h2 className="font-heading text-2xl font-semibold text-dark mb-4">Наша история</h2>
        <div className="space-y-4 text-text-secondary leading-relaxed">
          <p>
            Наша мастерская — это небольшой домашний цех в Арзамасе, где каждый торт
            делается вручную. Всё начиналось как увлечение, а сегодня «Виктория» — это
            место, где готовят десерты на свадьбы, детские праздники, юбилеи, годовщины
            и любые значимые дни.
          </p>
          <p>
            Мы не работаем по шаблонам. Вкус, оформление, размер, начинка — обсуждаем
            персонально под каждый повод. Именно поэтому мы создали 3D-конструктор:
            чтобы вы могли увидеть свой будущий торт ещё до начала работы.
          </p>
          <p>
            Используем только качественные ингредиенты: настоящий крем-чиз, натуральные
            ягоды, медовые коржи. Без искусственных красителей и консервантов — только
            честная домашняя работа.
          </p>
        </div>
      </section>

      {/* Contacts */}
      <section>
        <h2 className="font-heading text-2xl font-semibold text-dark mb-6">Контакты</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="flex flex-col gap-4">
            {shopConfig.phones.map((phone) => (
              <div key={phone.value} className="flex items-start gap-3">
                <Phone size={20} className="text-dusty-rose mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-dark">{phone.label}</p>
                  <a
                    href={`tel:${phone.value}`}
                    className="text-sm text-dusty-rose hover:text-dusty-rose-hover transition-colors"
                  >
                    {phone.display}
                  </a>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-3">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
              className="text-dusty-rose mt-0.5 shrink-0"
            >
              <path d="M12.785 16.241s.288-.032.436-.194c.136-.148.132-.427.132-.427s-.02-1.304.585-1.496c.598-.19 1.365 1.26 2.18 1.818.615.422 1.082.33 1.082.33l2.17-.03s1.135-.07.597-1.123c-.044-.083-.314-.66-1.616-1.865-1.364-1.26-1.182-1.056.462-3.236.998-1.33 1.396-2.143 1.271-2.49-.12-.33-.854-.243-.854-.243l-2.44.015s-.181-.025-.315.056c-.132.079-.216.263-.216.263s-.387 1.028-.903 1.902c-1.088 1.848-1.522 1.947-1.699 1.832-.413-.267-.31-1.075-.31-1.648 0-1.793.272-2.54-.528-2.733-.266-.064-.46-.106-1.137-.113-.869-.009-1.604.003-2.02.206-.277.135-.491.436-.36.453.161.021.526.098.72.36.249.338.24 1.098.24 1.098s.143 2.11-.333 2.372c-.327.179-.775-.186-1.737-1.857-.494-.854-.868-1.8-.868-1.8s-.072-.176-.202-.271c-.157-.115-.376-.151-.376-.151l-2.319.015s-.347.01-.474.161c-.113.134-.009.412-.009.412s1.816 4.25 3.872 6.393c1.886 1.97 4.026 1.84 4.026 1.84h.97z" />
            </svg>
            <div>
              <p className="font-medium text-dark">ВКонтакте</p>
              <a
                href={shopConfig.socials.vk}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-dusty-rose hover:text-dusty-rose-hover transition-colors"
              >
                vk.com/victoria.tort
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
