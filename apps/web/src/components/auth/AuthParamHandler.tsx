'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthContext } from './AuthProvider';

/**
 * Reads ?auth=login|register from the URL and opens the auth modal accordingly.
 * Removes the param from the URL after opening so it stays clean.
 */
export function AuthParamHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { openAuth } = useAuthContext();

  useEffect(() => {
    const param = searchParams.get('auth');
    if (param === 'login' || param === 'register') {
      openAuth(param);
      // Remove the param without adding a history entry
      const url = new URL(window.location.href);
      url.searchParams.delete('auth');
      router.replace(url.pathname + (url.search || ''));
    }
  }, [searchParams, openAuth, router]);

  return null;
}
