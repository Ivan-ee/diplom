'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, User, Menu, Heart, ShoppingBag as OrdersIcon, LogOut, X } from 'lucide-react';
import { Drawer, DrawerRoot, DrawerTrigger, DrawerBackdrop, DrawerContent, DrawerBody, DrawerCloseTrigger, Popover, PopoverRoot, PopoverTrigger, PopoverContent, PopoverDialog } from '@heroui/react';
import { CartBadge } from './CartBadge';
import { useAuth } from '@/hooks/useAuth';

const navLinks = [
  { href: '/catalog', label: 'Каталог' },
  { href: '/constructor', label: 'Конструктор' },
  { href: '/fillings', label: 'Начинки' },
  { href: '/about', label: 'О нас' },
];

export function Header() {
  const pathname = usePathname();
  const isConstructor = pathname === '/constructor';
  const { user, isAuthenticated, openAuth, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 h-[72px] w-full bg-white/80 backdrop-blur-xl border-b border-black/[0.04]">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link
          href="/"
          className="font-heading text-xl font-semibold text-neutral-900 hover:text-[var(--color-dusty-rose)] transition-colors duration-200 shrink-0"
        >
          Виктория Торт
        </Link>

        {/* Desktop nav */}
        {!isConstructor && (
          <nav className="hidden lg:flex items-center gap-6" aria-label="Основная навигация">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors duration-200 ${
                  pathname === link.href
                    ? 'text-black font-semibold'
                    : 'text-neutral-600 hover:text-black'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Desktop UserMenu */}
          {!isConstructor && (
            <div className="hidden lg:block">
              <DesktopUserMenu
                user={user}
                isAuthenticated={isAuthenticated}
                onLoginClick={() => openAuth('login')}
                onLogout={logout}
              />
            </div>
          )}

          {/* Cart */}
          <Link
            href="/cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl hover:bg-neutral-100 transition-colors duration-200"
            aria-label="Корзина"
          >
            <ShoppingBag size={21} className="text-neutral-700" />
            <CartBadge />
          </Link>

          {/* Mobile hamburger */}
          {!isConstructor && (
            <MobileDrawer
              pathname={pathname}
              user={user}
              isAuthenticated={isAuthenticated}
              onLoginClick={() => openAuth('login')}
              onLogout={logout}
            />
          )}
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Desktop UserMenu via HeroUI Popover                                 */
/* ------------------------------------------------------------------ */

interface UserMenuProps {
  user: { name: string; email: string } | null;
  isAuthenticated: boolean;
  onLoginClick: () => void;
  onLogout: () => Promise<void>;
}

function DesktopUserMenu({ user, isAuthenticated, onLoginClick, onLogout }: UserMenuProps) {
  if (!isAuthenticated || !user) {
    return (
      <button
        type="button"
        onClick={onLoginClick}
        className="flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-neutral-600 hover:text-black hover:bg-neutral-100 transition-colors duration-200"
        aria-label="Войти в аккаунт"
      >
        <User size={18} />
        <span>Войти</span>
      </button>
    );
  }

  const initial = user.name.charAt(0).toUpperCase();

  return (
    <PopoverRoot>
      <PopoverTrigger
        aria-label="Меню пользователя"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-dusty-rose)] text-sm font-semibold text-white shadow-sm transition-transform duration-150 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dusty-rose)] focus-visible:ring-offset-2"
      >
        {initial}
      </PopoverTrigger>
      <PopoverContent className="z-50 min-w-[220px] rounded-xl border border-neutral-100 bg-white p-0 shadow-xl outline-none">
        <PopoverDialog className="outline-none">
          {/* User info */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-soft-peach)] text-sm font-semibold text-neutral-800">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-neutral-900">{user.name}</p>
              <p className="truncate text-xs text-neutral-500">{user.email}</p>
            </div>
          </div>

          {/* Nav items */}
          <div className="py-1">
            <PopoverLink href="/account/orders" icon={<OrdersIcon size={15} />}>
              Мои заказы
            </PopoverLink>
            <PopoverLink href="/account/favorites" icon={<Heart size={15} />}>
              Избранное
            </PopoverLink>
          </div>

          <div className="my-1 border-t border-neutral-100" />

          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-neutral-500 transition-colors duration-150 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={15} />
            Выйти
          </button>
        </PopoverDialog>
      </PopoverContent>
    </PopoverRoot>
  );
}

interface PopoverLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function PopoverLink({ href, icon, children }: PopoverLinkProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 transition-colors duration-150 hover:bg-neutral-50 hover:text-neutral-900"
    >
      <span className="text-neutral-400">{icon}</span>
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile Drawer (HeroUI)                                              */
/* ------------------------------------------------------------------ */

interface MobileDrawerProps {
  pathname: string;
  user: { name: string; email: string } | null;
  isAuthenticated: boolean;
  onLoginClick: () => void;
  onLogout: () => Promise<void>;
}

function MobileDrawer({ pathname, user, isAuthenticated, onLoginClick, onLogout }: MobileDrawerProps) {
  const [open, setOpen] = useState(false);

  const handleClose = () => setOpen(false);

  const handleLogin = () => {
    handleClose();
    onLoginClick();
  };

  const handleLogout = async () => {
    handleClose();
    await onLogout();
  };

  return (
    <DrawerRoot isOpen={open} onOpenChange={setOpen}>
      <DrawerTrigger
        aria-label="Открыть меню"
        className="flex lg:hidden h-10 w-10 items-center justify-center rounded-xl hover:bg-neutral-100 transition-colors duration-200"
      >
        <Menu size={21} className="text-neutral-700" />
      </DrawerTrigger>

      <DrawerBackdrop isDismissable className="fixed inset-0 bg-black/40 backdrop-blur-sm" />

      <DrawerContent placement="right" className="fixed top-0 right-0 h-full w-72 bg-white shadow-2xl outline-none">
        <DrawerBody className="flex flex-col h-full p-0">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100">
            <span className="font-heading font-semibold text-base text-neutral-900">
              Меню
            </span>
            <DrawerCloseTrigger className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-neutral-100 transition-colors duration-200 text-neutral-500 focus-visible:outline-none">
              <X size={18} />
            </DrawerCloseTrigger>
          </div>

          {/* Nav links */}
          <nav className="flex flex-col gap-0.5 px-4 pt-4 flex-1" aria-label="Мобильная навигация">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={handleClose}
                className={`flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-colors duration-200 ${
                  pathname === link.href
                    ? 'bg-neutral-100 text-neutral-900 font-semibold'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Footer actions */}
          <div className="px-6 pb-8 pt-4 border-t border-neutral-100 flex flex-col gap-3">
            {isAuthenticated && user ? (
              <>
                <div className="flex items-center gap-3 py-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-dusty-rose)] text-sm font-semibold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-neutral-900">{user.name}</p>
                    <p className="truncate text-xs text-neutral-500">{user.email}</p>
                  </div>
                </div>
                <Link
                  href="/account/orders"
                  onClick={handleClose}
                  className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors py-1"
                >
                  <OrdersIcon size={15} />
                  Мои заказы
                </Link>
                <Link
                  href="/account/favorites"
                  onClick={handleClose}
                  className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors py-1"
                >
                  <Heart size={15} />
                  Избранное
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 transition-colors py-1"
                >
                  <LogOut size={15} />
                  Выйти
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleLogin}
                className="w-full rounded-xl border border-neutral-200 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors duration-200"
              >
                Войти
              </button>
            )}
          </div>
        </DrawerBody>
      </DrawerContent>
    </DrawerRoot>
  );
}
