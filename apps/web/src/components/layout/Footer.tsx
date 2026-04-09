import Link from 'next/link';

const navLinks = [
  { href: '/catalog', label: 'Каталог' },
  { href: '/constructor', label: 'Конструктор' },
  { href: '/fillings', label: 'Начинки' },
  { href: '/about', label: 'О нас' },
];

export function Footer() {
  return (
    <footer className="bg-[var(--color-cream)] border-t border-[var(--color-soft-peach)]/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">

          {/* Column 1 — Brand */}
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="font-heading font-semibold text-xl text-[var(--color-dark)] hover:text-[var(--color-dusty-rose)] transition-colors duration-200 w-fit"
            >
              Кондитерская
            </Link>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-[220px]">
              Авторские торты на заказ. Создаём сладкие моменты с любовью к каждой детали.
            </p>
          </div>

          {/* Column 2 — Navigation */}
          <div className="flex flex-col gap-3">
            <h3 className="font-heading font-semibold text-sm text-[var(--color-dark)] uppercase tracking-wide">
              Навигация
            </h3>
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-dusty-rose)] transition-colors duration-200 w-fit"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Column 3 — Contacts */}
          <div className="flex flex-col gap-3">
            <h3 className="font-heading font-semibold text-sm text-[var(--color-dark)] uppercase tracking-wide">
              Контакты
            </h3>
            <div className="flex flex-col gap-2">
              <a
                href="tel:+78312000000"
                className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-dusty-rose)] transition-colors duration-200 w-fit"
              >
                +7 (831) 200-00-00
              </a>
              <a
                href="mailto:hello@konditer.ru"
                className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-dusty-rose)] transition-colors duration-200 w-fit"
              >
                hello@konditer.ru
              </a>
              <address className="not-italic text-sm text-[var(--color-text-secondary)] leading-relaxed">
                г. Арзамас,<br />
                ул. Ленина, д. 15
              </address>
            </div>
          </div>

          {/* Column 4 — Socials */}
          <div className="flex flex-col gap-3">
            <h3 className="font-heading font-semibold text-sm text-[var(--color-dark)] uppercase tracking-wide">
              Мы в соцсетях
            </h3>
            <div className="flex flex-col gap-2">
              <a
                href="https://vk.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-dusty-rose)] transition-colors duration-200 w-fit"
              >
                {/* VK icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12.785 16.241s.288-.032.436-.194c.136-.148.132-.427.132-.427s-.02-1.304.585-1.496c.598-.19 1.365 1.26 2.18 1.818.615.422 1.082.33 1.082.33l2.17-.03s1.135-.07.597-1.123c-.044-.083-.314-.66-1.616-1.865-1.364-1.26-1.182-1.056.462-3.236.998-1.33 1.396-2.143 1.271-2.49-.12-.33-.854-.243-.854-.243l-2.44.015s-.181-.025-.315.056c-.132.079-.216.263-.216.263s-.387 1.028-.903 1.902c-1.088 1.848-1.522 1.947-1.699 1.832-.413-.267-.31-1.075-.31-1.648 0-1.793.272-2.54-.528-2.733-.266-.064-.46-.106-1.137-.113-.869-.009-1.604.003-2.02.206-.277.135-.491.436-.36.453.161.021.526.098.72.36.249.338.24 1.098.24 1.098s.143 2.11-.333 2.372c-.327.179-.775-.186-1.737-1.857-.494-.854-.868-1.8-.868-1.8s-.072-.176-.202-.271c-.157-.115-.376-.151-.376-.151l-2.319.015s-.347.01-.474.161c-.113.134-.009.412-.009.412s1.816 4.25 3.872 6.393c1.886 1.97 4.026 1.84 4.026 1.84h.97z"/>
                </svg>
                ВКонтакте
              </a>
              <a
                href="https://t.me"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-dusty-rose)] transition-colors duration-200 w-fit"
              >
                {/* Telegram icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M11.944 0A12 12 0 1 0 24 12 12 12 0 0 0 11.944 0Zm5.688 8.22-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.04 13.67l-2.965-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.851.888Z"/>
                </svg>
                Telegram
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-[var(--color-soft-peach)]/60">
          <p className="text-xs text-[var(--color-text-secondary)] text-center">
            © 2026 Кондитерская. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  );
}
