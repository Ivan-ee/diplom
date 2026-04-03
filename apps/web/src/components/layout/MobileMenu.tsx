'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { X } from 'lucide-react';
import { UserMenu } from '@/components/auth/UserMenu';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const navLinks = [
  { href: '/catalog', label: 'Каталог' },
  { href: '/constructor', label: 'Конструктор' },
  { href: '/about', label: 'О нас' },
];

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed top-0 right-0 z-50 h-full w-72 bg-white shadow-2xl flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Меню навигации"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <span className="font-heading font-semibold text-lg text-[var(--color-dark)]">
                Меню
              </span>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[var(--color-cream)] transition-colors duration-200"
                aria-label="Закрыть меню"
              >
                <X size={20} className="text-[var(--color-text-secondary)]" />
              </button>
            </div>

            {/* Navigation links */}
            <nav className="flex flex-col gap-1 px-4 pt-4 flex-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className="flex items-center px-3 py-3 rounded-lg text-base font-medium text-[var(--color-dark)] hover:bg-[var(--color-cream)] hover:text-[var(--color-dusty-rose)] transition-colors duration-200"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Footer */}
            <div className="px-6 pb-8 pt-4 border-t border-gray-100 flex flex-col gap-3">
              <a
                href="tel:+78312000000"
                className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-dusty-rose)] transition-colors duration-200 text-center"
              >
                +7 (831) 200-00-00
              </a>
              <div className="flex justify-center" onClick={onClose}>
                <UserMenu />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
