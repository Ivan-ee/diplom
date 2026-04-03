'use client';

import { useAuthStore } from '@/stores/auth-store';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { fetchClient } from '@/lib/api';

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const storeLogout = useAuthStore((s) => s.logout);
  const { openAuth, closeAuth } = useAuthContext();

  const logout = async () => {
    try {
      await fetchClient('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors — clear local state regardless
    } finally {
      storeLogout();
    }
  };

  return {
    user,
    isAuthenticated,
    openAuth,
    closeAuth,
    logout,
  };
}
