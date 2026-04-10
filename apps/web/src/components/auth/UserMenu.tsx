'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, LogOut, ShoppingBag, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export function UserMenu() {
  const { user, isAuthenticated, openAuth, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  if (!isAuthenticated || !user) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => openAuth('login')}
        aria-label="Войти в аккаунт"
      >
        Войти
      </Button>
    );
  }

  const initial = user.name.charAt(0).toUpperCase();

  const handleLogout = async () => {
    setOpen(false);
    await logout();
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Avatar trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Меню пользователя"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-caramel)] text-sm font-semibold text-white shadow-sm transition-transform duration-150 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-caramel)] focus-visible:ring-offset-2"
      >
        {initial}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="user-dropdown"
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="absolute right-0 top-11 z-50 min-w-[200px] rounded-xl border border-gray-100 bg-white py-1.5 shadow-xl"
            role="menu"
          >
            {/* User info */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-toffee)] text-sm font-semibold text-[var(--color-graphite)]">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--color-graphite)]">{user.name}</p>
                <p className="truncate text-xs text-[var(--color-graphite-light)]">{user.email}</p>
              </div>
            </div>

            {/* Nav items */}
            <div className="py-1">
              <DropdownLink
                href="/account/orders"
                icon={<ShoppingBag size={16} />}
                onClick={() => setOpen(false)}
              >
                Мои заказы
              </DropdownLink>
              <DropdownLink
                href="/account/favorites"
                icon={<Heart size={16} />}
                onClick={() => setOpen(false)}
              >
                Избранное
              </DropdownLink>
            </div>

            {/* Divider */}
            <div className="my-1 border-t border-gray-100" role="separator" />

            {/* Logout */}
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-graphite-light)] transition-colors duration-150 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={16} />
              Выйти
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface DropdownLinkProps {
  href: string;
  icon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}

function DropdownLink({ href, icon, onClick, children }: DropdownLinkProps) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-graphite)] transition-colors duration-150 hover:bg-[var(--color-warm-ivory)] hover:text-[var(--color-caramel)]"
    >
      <span className="text-[var(--color-graphite-light)]">{icon}</span>
      {children}
    </Link>
  );
}
