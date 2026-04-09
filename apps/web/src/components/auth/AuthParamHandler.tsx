'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthContext } from './AuthProvider';

/**
 * Reads ?auth=login|register and optional ?from=<path> from the URL and opens
 * the auth modal accordingly. Removes both params from the URL after opening.
 */
export function AuthParamHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { openAuth } = useAuthContext();

  useEffect(() => {
    const param = searchParams.get('auth');
    if (param === 'login' || param === 'register') {
      const from = searchParams.get('from') ?? undefined;
      openAuth(param, from);
      // Remove the params without adding a history entry
      const url = new URL(window.location.href);
      url.searchParams.delete('auth');
      url.searchParams.delete('from');
      router.replace(url.pathname + (url.search || ''));
    }
  }, [searchParams, openAuth, router]);

  return null;
}
