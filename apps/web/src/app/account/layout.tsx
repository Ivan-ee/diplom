'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/account/orders', label: 'Заказы', icon: ShoppingBag },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  return (
    <div className="min-h-screen bg-[var(--color-cream)]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page heading */}
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-[var(--color-dark)]">
            Личный кабинет
          </h1>
          {user?.name && (
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              {user.name}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          {/* Sidebar — desktop */}
          <aside className="hidden lg:flex lg:w-56 lg:shrink-0 lg:flex-col">
            <nav className="flex flex-col gap-1 rounded-xl bg-white p-3 shadow-sm">
              {navLinks.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + '/');
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                      active
                        ? 'bg-[var(--color-dusty-rose)]/10 text-[var(--color-dusty-rose)]'
                        : 'text-[var(--color-dark)] hover:bg-[var(--color-cream)] hover:text-[var(--color-dusty-rose)]'
                    )}
                  >
                    <Icon size={16} className="shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto pt-4">
              <button
                onClick={logout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors duration-150 hover:bg-red-50 hover:text-red-500"
              >
                <LogOut size={16} className="shrink-0" />
                Выйти
              </button>
            </div>
          </aside>

          {/* Top tabs — mobile */}
          <div className="lg:hidden">
            <div className="flex gap-1 rounded-xl bg-white p-1.5 shadow-sm">
              {navLinks.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + '/');
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150',
                      active
                        ? 'bg-[var(--color-dusty-rose)]/10 text-[var(--color-dusty-rose)]'
                        : 'text-[var(--color-dark)] hover:text-[var(--color-dusty-rose)]'
                    )}
                  >
                    <Icon size={15} className="shrink-0" />
                    {label}
                  </Link>
                );
              })}
              <button
                onClick={logout}
                className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors duration-150 hover:bg-red-50 hover:text-red-500"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>

          {/* Main content */}
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
