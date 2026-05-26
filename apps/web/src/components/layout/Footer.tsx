'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { shopConfig } from '@/config/shop.config';

const navLinks = [
  { href: '/catalog', label: 'Каталог' },
  { href: '/constructor', label: 'Конструктор' },
  { href: '/fillings', label: 'Начинки' },
  { href: '/about', label: 'О нас' },
];

export function Footer() {
  const pathname = usePathname();
  if (pathname === '/constructor' || pathname === '/cake-constructor') return null;

  return (
    <footer className="bg-[var(--surface-secondary)] border-t border-[var(--border-default)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] gap-8 lg:gap-12">

          {/* Column 1 — Brand */}
          <div className="flex flex-col">
            <div className="flex items-baseline gap-0.5">
              <span className="font-[family-name:var(--font-editorial)] text-2xl font-medium text-[var(--color-graphite)]">Виктория</span>
              <span className="font-heading text-lg font-semibold tracking-tight text-[var(--color-graphite)]"> Торт</span>
            </div>
            <p className="mt-3 text-sm text-[var(--color-graphite-light)]">
              {shopConfig.tagline}
            </p>
          </div>

          {/* Column 2 — Navigation */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-medium text-[var(--color-graphite)] mb-4">
              Навигация
            </h3>
            <nav className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-[var(--color-graphite-light)] hover:text-[var(--color-graphite)] transition-colors duration-200 w-fit"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Column 3 — Contacts */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-medium text-[var(--color-graphite)] mb-4">
              Контакты
            </h3>
            <div className="flex flex-col space-y-2">
              {shopConfig.phones.map((phone) => (
                <a
                  key={phone.value}
                  href={`tel:${phone.value}`}
                  className="text-sm text-[var(--color-graphite-light)] hover:text-[var(--color-graphite)] transition-colors duration-200 w-fit"
                >
                  {phone.display}
                </a>
              ))}
              <p className="text-sm text-[var(--color-graphite-light)]">
                г. {shopConfig.city}
              </p>
              <p className="text-sm text-[var(--color-graphite-light)]">
                Пн–Сб: 9:00–20:00
              </p>
            </div>
          </div>

          {/* Column 4 — Socials */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-medium text-[var(--color-graphite)] mb-4">
              Соцсети
            </h3>
            <div className="flex flex-col space-y-2">
              <a
                href={shopConfig.socials.vk}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[var(--color-graphite-light)] hover:text-[var(--color-graphite)] transition-colors duration-200 w-fit"
              >
                ВКонтакте
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[var(--border-default)] mt-8 pt-6">
          <p className="text-xs text-[var(--color-graphite-light)] text-center">
            © 2026 {shopConfig.name}. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  );
}
