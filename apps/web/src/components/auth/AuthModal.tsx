'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

type Tab = 'login' | 'register';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: Tab;
  returnPath?: string;
}

export function AuthModal({ isOpen, onClose, defaultTab = 'login', returnPath }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);
  const modalRef = useRef<HTMLDivElement>(null);

  // Sync active tab when defaultTab changes (e.g. opened via "register" link)
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab, isOpen]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const modal = modalRef.current;
    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstEl = focusableElements[0];
    const lastEl = focusableElements[focusableElements.length - 1];

    // Focus first input
    const firstInput = modal.querySelector<HTMLElement>('input');
    firstInput?.focus();

    function handleTab(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl?.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl?.focus();
        }
      }
    }

    modal.addEventListener('keydown', handleTab);
    return () => modal.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  // Lock body scroll and handle Escape key while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handler);
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handler);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="auth-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Dialog container — vertically centered */}
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              key="auth-modal"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-label={activeTab === 'login' ? 'Вход в аккаунт' : 'Регистрация'}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-graphite-light)] hover:bg-[var(--color-champagne)]/60 hover:text-[var(--color-graphite)] transition-colors duration-150"
                aria-label="Закрыть"
              >
                <X size={20} />
              </button>

              {/* Tabs */}
              <div className="mb-8 flex bg-[var(--color-champagne)]/40 rounded-xl p-1">
                <TabButton
                  active={activeTab === 'login'}
                  onClick={() => setActiveTab('login')}
                >
                  Вход
                </TabButton>
                <TabButton
                  active={activeTab === 'register'}
                  onClick={() => setActiveTab('register')}
                >
                  Регистрация
                </TabButton>
              </div>

              {/* Form */}
              <AnimatePresence mode="wait">
                {activeTab === 'login' ? (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.18 }}
                  >
                    <LoginForm onSuccess={onClose} returnPath={returnPath} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="register"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.18 }}
                  >
                    <RegisterForm onSuccess={onClose} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Switch tab hint */}
              <p className="mt-5 text-center text-sm text-[var(--color-graphite-light)]">
                {activeTab === 'login' ? (
                  <>
                    Нет аккаунта?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('register')}
                      className="font-medium text-[var(--color-caramel)] hover:underline"
                    >
                      Зарегистрироваться
                    </button>
                  </>
                ) : (
                  <>
                    Уже есть аккаунт?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('login')}
                      className="font-medium text-[var(--color-caramel)] hover:underline"
                    >
                      Войти
                    </button>
                  </>
                )}
              </p>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function TabButton({ active, onClick, children }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex-1 py-2.5 text-sm font-medium rounded-lg transition-all text-center cursor-pointer',
        active
          ? 'bg-[var(--color-caramel)] text-white shadow-sm'
          : 'text-[var(--color-graphite-light)] hover:text-[var(--color-graphite)]',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
