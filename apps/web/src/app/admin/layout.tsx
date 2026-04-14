'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, Package, Users, Palette, Tag, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/admin',             label: 'Дашборд',      icon: LayoutDashboard, exact: true },
  { href: '/admin/orders',      label: 'Заказы',        icon: ShoppingCart },
  { href: '/admin/products',    label: 'Товары',         icon: Package },
  { href: '/admin/users',       label: 'Пользователи',  icon: Users },
  { href: '/admin/promo-codes', label: 'Промокоды',      icon: Tag },
  { href: '/admin/constructor', label: 'Конструктор',    icon: Palette },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold text-neutral-900">Нет доступа</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Эта страница доступна только администраторам
          </p>
          <Link href="/" className="mt-4 inline-block text-sm text-[var(--color-caramel)] hover:underline">
            На главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* Sidebar — desktop only */}
      <aside className="hidden lg:flex w-60 flex-shrink-0 flex-col bg-white border-r border-neutral-200 p-6">
        {/* Brand */}
        <span className="text-lg font-semibold font-heading text-neutral-900">
          Админ-панель
        </span>

        {/* Nav */}
        <nav className="mt-8 space-y-1">
          {navLinks.map(({ href, label, icon: Icon, exact }) => {
            const active = exact
              ? pathname === href
              : pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  active
                    ? 'bg-neutral-100 text-neutral-900'
                    : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
                )}
              >
                <Icon size={16} className="shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <button
          onClick={logout}
          className="mt-auto flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-400 hover:text-red-500 transition-colors"
        >
          <LogOut size={16} className="shrink-0" />
          Выйти
        </button>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="lg:hidden h-14 flex items-center gap-1 px-4 bg-white border-b border-neutral-200 overflow-x-auto">
          {navLinks.map(({ href, label, icon: Icon, exact }) => {
            const active = exact
              ? pathname === href
              : pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
                  active
                    ? 'bg-neutral-100 text-neutral-900'
                    : 'text-neutral-500 hover:text-neutral-700'
                )}
              >
                <Icon size={13} />
                {label}
              </Link>
            );
          })}
          <button
            onClick={logout}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-neutral-400 hover:text-red-500 whitespace-nowrap transition-colors"
          >
            <LogOut size={13} />
            Выйти
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
