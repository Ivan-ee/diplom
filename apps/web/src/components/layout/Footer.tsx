import Link from 'next/link';
import { shopConfig } from '@/config/shop.config';

const navLinks = [
  { href: '/catalog', label: 'Каталог' },
  { href: '/constructor', label: 'Конструктор' },
  { href: '/fillings', label: 'Начинки' },
  { href: '/about', label: 'О нас' },
];

export function Footer() {
  return (
    <footer className="bg-[var(--color-warm-ivory)] border-t border-[var(--color-champagne)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Column 1 — Navigation */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-[var(--color-graphite)] uppercase tracking-wider mb-4">
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

          {/* Column 2 — Contacts */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-[var(--color-graphite)] uppercase tracking-wider mb-4">
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
            </div>
          </div>

          {/* Column 3 — Socials */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-[var(--color-graphite)] uppercase tracking-wider mb-4">
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
        <div className="border-t border-[var(--color-champagne)] mt-8 pt-6">
          <p className="text-xs text-[var(--color-graphite-light)]/60 text-center">
            © 2026 {shopConfig.name}. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  );
}
