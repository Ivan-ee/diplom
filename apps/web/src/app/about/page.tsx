import type { Metadata } from 'next';
import { Heart, Award, Clock, MapPin, Phone, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'О нас — Кондитерская',
  description: 'Авторская кондитерская в Арзамасе. Натуральные ингредиенты, ручная работа, торты на заказ.',
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
          Мы создаём авторские торты с любовью к каждой детали. Натуральные ингредиенты,
          ручная работа и индивидуальный подход к каждому заказу.
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
            Наша кондитерская начала свою историю в самом сердце Арзамаса. То, что начиналось
            как маленькая домашняя пекарня, выросло в любимое место для заказа тортов на все
            случаи жизни.
          </p>
          <p>
            Мы верим, что торт — это не просто десерт, а центральная часть любого праздника.
            Именно поэтому мы разработали уникальный 3D-конструктор, который позволяет вам
            увидеть и настроить торт вашей мечты ещё до того, как мы начнём его готовить.
          </p>
          <p>
            Каждый рецепт проверен годами, каждый ингредиент отобран вручную. Мы не используем
            искусственные красители и консерванты — только натуральные продукты.
          </p>
        </div>
      </section>

      {/* Contacts */}
      <section>
        <h2 className="font-heading text-2xl font-semibold text-dark mb-6">Контакты</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <MapPin size={20} className="text-dusty-rose mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-dark">Адрес</p>
              <p className="text-sm text-text-secondary">г. Арзамас, ул. Ленина, д. 15</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone size={20} className="text-dusty-rose mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-dark">Телефон</p>
              <a href="tel:+79001234567" className="text-sm text-dusty-rose hover:text-dusty-rose-hover transition-colors">
                +7 (900) 123-45-67
              </a>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail size={20} className="text-dusty-rose mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-dark">Email</p>
              <a href="mailto:info@bakery-arzamas.ru" className="text-sm text-dusty-rose hover:text-dusty-rose-hover transition-colors">
                info@bakery-arzamas.ru
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
