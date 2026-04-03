'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

type Tab = 'login' | 'register';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: Tab;
}

export function AuthModal({ isOpen, onClose, defaultTab = 'login' }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);

  // Sync active tab when defaultTab changes (e.g. opened via "register" link)
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab, isOpen]);

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
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
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
              role="dialog"
              aria-modal="true"
              aria-label={activeTab === 'login' ? 'Вход в аккаунт' : 'Регистрация'}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-[var(--color-dark)] transition-colors duration-150"
                aria-label="Закрыть"
              >
                <X size={20} />
              </button>

              {/* Title */}
              <h2 className="mb-6 font-heading text-2xl font-semibold text-[var(--color-dark)]">
                {activeTab === 'login' ? 'Вход в аккаунт' : 'Регистрация'}
              </h2>

              {/* Tabs */}
              <div className="mb-6 flex gap-2 rounded-xl bg-gray-100 p-1">
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
                    <LoginForm onSuccess={onClose} />
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
              <p className="mt-5 text-center text-sm text-[var(--color-text-secondary)]">
                {activeTab === 'login' ? (
                  <>
                    Нет аккаунта?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('register')}
                      className="font-medium text-[var(--color-dusty-rose)] hover:underline"
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
                      className="font-medium text-[var(--color-dusty-rose)] hover:underline"
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
        'flex-1 rounded-lg py-2 text-sm font-medium transition-all duration-200',
        active
          ? 'bg-[var(--color-dusty-rose)] text-white shadow-sm'
          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-dark)]',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
