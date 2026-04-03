'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Package, Layers, LogOut, ChefHat } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/admin/orders',      label: 'Заказы',      icon: ShoppingBag },
  { href: '/admin/products',    label: 'Товары',       icon: Package },
  { href: '/admin/constructor', label: 'Конструктор',  icon: Layers },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-cream)]">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold text-[var(--color-dark)]">Нет доступа</h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Эта страница доступна только администраторам
          </p>
          <Link href="/" className="mt-4 inline-block text-sm text-[var(--color-dusty-rose)] hover:underline">
            На главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--color-cream)]">
      {/* Sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-[var(--color-soft-peach)]/60 bg-white lg:flex">
        {/* Brand */}
        <div className="flex h-14 items-center gap-2.5 border-b border-[var(--color-soft-peach)]/60 px-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-dusty-rose)]">
            <ChefHat size={14} className="text-white" />
          </div>
          <span className="font-heading text-sm font-bold text-[var(--color-dark)]">
            Админ-панель
          </span>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-1 p-3">
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

        {/* Logout */}
        <div className="border-t border-[var(--color-soft-peach)]/60 p-3">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors duration-150 hover:bg-red-50 hover:text-red-500"
          >
            <LogOut size={16} className="shrink-0" />
            Выйти
          </button>
        </div>
      </aside>

      {/* Content area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top header */}
        <header className="flex h-14 items-center gap-4 border-b border-[var(--color-soft-peach)]/60 bg-white px-5">
          {/* Mobile nav pills */}
          <div className="flex items-center gap-1 lg:hidden">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + '/');
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors duration-150',
                    active
                      ? 'bg-[var(--color-dusty-rose)]/10 text-[var(--color-dusty-rose)]'
                      : 'text-[var(--color-dark)] hover:text-[var(--color-dusty-rose)]'
                  )}
                >
                  <Icon size={13} />
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Desktop title */}
          <span className="hidden font-heading text-sm font-bold text-[var(--color-dark)] lg:block">
            {navLinks.find(({ href }) => pathname === href || pathname.startsWith(href + '/'))?.label ?? 'Админ-панель'}
          </span>

          {/* Spacer + mobile logout */}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-colors duration-150 hover:bg-red-50 hover:text-red-500 lg:hidden"
            >
              <LogOut size={13} />
              Выйти
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-5 lg:p-7">
          {children}
        </main>
      </div>
    </div>
  );
}
