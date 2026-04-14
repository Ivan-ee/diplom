'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, User, Menu, Heart, ShoppingBag as OrdersIcon, LogOut, X, Search } from 'lucide-react';
import { Drawer, DrawerRoot, DrawerTrigger, DrawerBackdrop, DrawerContent, DrawerBody, DrawerCloseTrigger, DrawerHandle, Popover, PopoverRoot, PopoverTrigger, PopoverContent, PopoverDialog } from '@heroui/react';
import { CartBadge } from './CartBadge';
import { useAuth } from '@/hooks/useAuth';
import { SearchDialog } from '@/components/search/SearchDialog';
import { useSearchDialog } from '@/hooks/useSearchDialog';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { useCartDrawer } from '@/hooks/useCartDrawer';

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
  const searchDialog = useSearchDialog();
  const cartDrawer = useCartDrawer();

  return (
    <>
    <header className="sticky top-0 z-50 h-[72px] w-full bg-[var(--color-milk-white)]/85 backdrop-blur-xl border-b border-[var(--border-subtle)]">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link
          href="/"
          className="hover:text-[var(--color-caramel)] transition-colors duration-200 shrink-0 flex items-baseline gap-0.5"
        >
          <span className="font-[family-name:var(--font-editorial)] text-[22px] font-medium text-[var(--color-graphite)]">Виктория</span>
          <span className="font-heading text-lg font-semibold tracking-tight text-[var(--color-graphite)]"> Торт</span>
        </Link>

        {/* Desktop nav */}
        {!isConstructor && (
          <nav className="hidden lg:flex items-center gap-8" aria-label="Основная навигация">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-[15px] font-medium tracking-[-0.01em] transition-colors duration-200 ${
                  pathname === link.href
                    ? 'text-[var(--color-graphite)] font-semibold'
                    : 'text-[var(--color-graphite-light)] hover:text-[var(--color-graphite)]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Desktop UserMenu + Search pill */}
          {!isConstructor && (
            <>
              <div className="hidden lg:block">
                <DesktopUserMenu
                  user={user}
                  isAuthenticated={isAuthenticated}
                  onLoginClick={() => openAuth('login')}
                  onLogout={logout}
                />
              </div>

              {/* Desktop search pill */}
              <button
                type="button"
                onClick={searchDialog.open}
                className="hidden lg:flex items-center gap-2 h-9 px-4 rounded-full bg-[var(--surface-secondary)] border border-[var(--border-default)] text-[var(--color-graphite-light)] text-sm hover:border-[var(--color-champagne)] hover:text-[var(--color-graphite)] transition-colors duration-200"
                aria-label="Поиск"
              >
                <Search size={16} />
                <span>Поиск...</span>
                <kbd className="ml-2 text-[10px] font-sans border border-[var(--color-champagne)] rounded px-1.5 py-0.5 text-[var(--color-graphite-light)]/60">⌘K</kbd>
              </button>

              {/* Mobile search icon */}
              <button
                type="button"
                onClick={searchDialog.open}
                className="flex lg:hidden h-10 w-10 items-center justify-center rounded-xl hover:bg-[var(--surface-secondary)] transition-colors duration-200"
                aria-label="Поиск"
              >
                <Search size={21} className="text-[var(--color-graphite-light)]" />
              </button>
            </>
          )}

          {/* Cart */}
          <button
            type="button"
            onClick={cartDrawer.open}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl hover:bg-[var(--surface-secondary)] transition-colors duration-200"
            aria-label="Корзина"
          >
            <ShoppingBag size={21} className="text-[var(--color-graphite-light)]" />
            <CartBadge />
          </button>

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
      <SearchDialog isOpen={searchDialog.isOpen} onClose={searchDialog.close} />
      <CartDrawer isOpen={cartDrawer.isOpen} onOpenChange={cartDrawer.setOpen} />
    </>
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
        className="flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-[var(--color-graphite-light)] hover:text-[var(--color-graphite)] hover:bg-[var(--surface-secondary)] transition-colors duration-200"
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
      <PopoverTrigger>
        <button
          type="button"
          aria-label="Меню пользователя"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-caramel)] text-sm font-semibold text-white shadow-sm transition-transform duration-150 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-caramel)] focus-visible:ring-offset-2"
        >
          {initial}
        </button>
      </PopoverTrigger>
      <PopoverContent className="z-50 min-w-[220px] rounded-xl border border-[var(--border-default)] bg-[var(--surface-elevated)] p-0 shadow-xl outline-none">
        <PopoverDialog className="outline-none">
          {/* User info */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-default)]">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-toffee)] text-sm font-semibold text-neutral-800">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[var(--color-graphite)]">{user.name}</p>
              <p className="truncate text-xs text-[var(--color-graphite-light)]">{user.email}</p>
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

          <div className="my-1 border-t border-[var(--border-default)]" />

          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-graphite-light)] transition-colors duration-150 hover:bg-red-50 hover:text-red-600"
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
      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-graphite-light)] transition-colors duration-150 hover:bg-[var(--surface-secondary)] hover:text-[var(--color-graphite)]"
    >
      <span className="text-[var(--color-graphite-light)]/60">{icon}</span>
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
        className="flex lg:hidden h-10 w-10 items-center justify-center rounded-xl hover:bg-[var(--surface-secondary)] transition-colors duration-200"
      >
        <Menu size={21} className="text-[var(--color-graphite-light)]" />
      </DrawerTrigger>

      <DrawerBackdrop isDismissable className="fixed inset-0 bg-black/40 backdrop-blur-sm" />

      <DrawerContent placement="bottom" className="bg-[var(--surface-elevated)] outline-none">
        <DrawerBody className="flex flex-col h-full p-0">
          <DrawerHandle className="pt-3" />
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)]">
            <span className="font-heading font-semibold text-base text-[var(--color-graphite)]">
              Меню
            </span>
            <DrawerCloseTrigger className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-[var(--surface-secondary)] transition-colors duration-200 text-[var(--color-graphite-light)] focus-visible:outline-none">
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
                    ? 'bg-[var(--surface-secondary)] text-[var(--color-graphite)] font-semibold'
                    : 'text-[var(--color-graphite-light)] hover:bg-[var(--surface-secondary)] hover:text-[var(--color-graphite)]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Footer actions */}
          <div className="px-6 pb-8 pt-4 border-t border-[var(--border-default)] flex flex-col gap-3">
            {isAuthenticated && user ? (
              <>
                <div className="flex items-center gap-3 py-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-caramel)] text-sm font-semibold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--color-graphite)]">{user.name}</p>
                    <p className="truncate text-xs text-[var(--color-graphite-light)]">{user.email}</p>
                  </div>
                </div>
                <Link
                  href="/account/orders"
                  onClick={handleClose}
                  className="flex items-center gap-2 text-sm text-[var(--color-graphite-light)] hover:text-[var(--color-graphite)] transition-colors py-1"
                >
                  <OrdersIcon size={15} />
                  Мои заказы
                </Link>
                <Link
                  href="/account/favorites"
                  onClick={handleClose}
                  className="flex items-center gap-2 text-sm text-[var(--color-graphite-light)] hover:text-[var(--color-graphite)] transition-colors py-1"
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
                className="w-full rounded-xl border border-[var(--border-default)] py-2.5 text-sm font-medium text-[var(--color-graphite-light)] hover:bg-[var(--surface-secondary)] transition-colors duration-200"
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
