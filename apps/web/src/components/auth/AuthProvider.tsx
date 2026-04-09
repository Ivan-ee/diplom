'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AuthModal } from './AuthModal';
import { fetchClient } from '@/lib/api';
import { useAuthStore, type User } from '@/stores/auth-store';

type Tab = 'login' | 'register';

interface AuthContextValue {
  openAuth: (tab?: Tab, from?: string) => void;
  closeAuth: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used inside AuthProvider');
  }
  return ctx;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultTab, setDefaultTab] = useState<Tab>('login');
  const [returnPath, setReturnPath] = useState<string | undefined>(undefined);
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);
  const hydrated = useRef(false);

  // Restore session from httpOnly cookie on mount (one-time)
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    fetchClient<User>('/auth/profile')
      .then((res) => {
        setUser(res.data);
      })
      .catch((err) => {
        if (err instanceof Error && !err.message.includes('401') && !err.message.includes('Unauthorized')) {
          console.error('Failed to restore session:', err);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [setUser, setLoading]);

  const openAuth = useCallback((tab: Tab = 'login', from?: string) => {
    setDefaultTab(tab);
    setReturnPath(from);
    setIsOpen(true);
  }, []);

  const closeAuth = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <AuthContext.Provider value={{ openAuth, closeAuth }}>
      {children}
      <AuthModal isOpen={isOpen} onClose={closeAuth} defaultTab={defaultTab} returnPath={returnPath} />
    </AuthContext.Provider>
  );
}
