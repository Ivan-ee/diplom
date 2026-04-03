'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Menu } from 'lucide-react';
import { CartBadge } from './CartBadge';
import { MobileMenu } from './MobileMenu';
import { UserMenu } from '@/components/auth/UserMenu';

const navLinks = [
  { href: '/catalog', label: 'Каталог' },
  { href: '/constructor', label: 'Конструктор' },
  { href: '/about', label: 'О нас' },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const isConstructor = pathname === '/constructor';

  return (
    <>
      <header className="sticky top-0 z-50 h-16 w-full bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* Logo */}
          <Link
            href="/"
            className="font-heading font-semibold text-xl text-[var(--color-dark)] hover:text-[var(--color-dusty-rose)] transition-colors duration-200 shrink-0"
          >
            Кондитерская
          </Link>

          {/* Desktop nav — hidden on constructor route */}
          {!isConstructor && (
            <nav className="hidden lg:flex items-center gap-1" aria-label="Основная навигация">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    pathname === link.href
                      ? 'text-[var(--color-dusty-rose)] bg-[var(--color-cream)]'
                      : 'text-[var(--color-dark)] hover:text-[var(--color-dusty-rose)] hover:bg-[var(--color-cream)]'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          {/* Desktop right side */}
          <div className="flex items-center gap-2">
            {/* Phone — desktop only, not on constructor */}
            {!isConstructor && (
              <a
                href="tel:+78312000000"
                className="hidden lg:block text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-dusty-rose)] transition-colors duration-200 mr-2"
              >
                +7 (831) 200-00-00
              </a>
            )}

            {/* User menu / login button — desktop only, not on constructor */}
            {!isConstructor && (
              <div className="hidden lg:block">
                <UserMenu />
              </div>
            )}

            {/* Cart icon with badge */}
            <Link
              href="/cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-lg hover:bg-[var(--color-cream)] transition-colors duration-200"
              aria-label="Корзина"
            >
              <ShoppingCart size={22} className="text-[var(--color-dark)]" />
              <CartBadge />
            </Link>

            {/* Hamburger — mobile only, not on constructor */}
            {!isConstructor && (
              <button
                className="flex lg:hidden h-10 w-10 items-center justify-center rounded-lg hover:bg-[var(--color-cream)] transition-colors duration-200"
                onClick={() => setMenuOpen(true)}
                aria-label="Открыть меню"
              >
                <Menu size={22} className="text-[var(--color-dark)]" />
              </button>
            )}
          </div>
        </div>
      </header>

      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
