'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Heart, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/account/orders', label: 'Заказы', icon: ShoppingBag },
  { href: '/account/favorites', label: 'Избранное', icon: Heart },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Page heading */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-[var(--color-graphite)]">
            Личный кабинет
          </h1>
          {user?.name && (
            <p className="mt-1 text-sm text-neutral-500">
              {user.name}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          {/* Sidebar — desktop */}
          <aside className="hidden lg:flex lg:w-56 lg:shrink-0 lg:flex-col">
            <p className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">
              Аккаунт
            </p>
            <nav className="space-y-1">
              {navLinks.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + '/');
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                      active
                        ? 'bg-white text-neutral-900 shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-700 hover:bg-white/50'
                    )}
                  >
                    <Icon size={16} className="shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </nav>

            <button
              onClick={logout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-400 hover:text-red-500 transition-colors mt-8 pt-4 border-t border-neutral-200 w-full"
            >
              <LogOut size={16} className="shrink-0" />
              Выйти
            </button>
          </aside>

          {/* Top tabs — mobile */}
          <div className="lg:hidden">
            <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
              {navLinks.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + '/');
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-colors',
                      active
                        ? 'bg-[var(--color-caramel)] text-white'
                        : 'bg-white text-neutral-500'
                    )}
                  >
                    <Icon size={14} className="shrink-0" />
                    {label}
                  </Link>
                );
              })}
              <button
                onClick={logout}
                className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap bg-white text-neutral-400 hover:text-red-500 transition-colors flex items-center gap-2"
              >
                <LogOut size={14} />
                Выйти
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
