import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'bakery_token';

/**
 * DEFENSE-IN-DEPTH ONLY: Decodes JWT payload WITHOUT signature verification.
 * Actual signature verification happens on the NestJS backend (JwtAuthGuard).
 * This middleware provides client-side route protection for UX purposes only.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    // Base64url → Base64 → JSON
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = Buffer.from(base64, 'base64').toString('utf-8');
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  // No token — redirect to home with ?auth=login&from=<path>
  if (!token) {
    const loginUrl = new URL('/', request.url);
    loginUrl.searchParams.set('auth', 'login');
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin routes — additionally check role in JWT payload
  if (pathname.startsWith('/admin')) {
    const payload = decodeJwtPayload(token);
    if (!payload || (payload.role as string)?.toLowerCase() !== 'admin') {
      const homeUrl = new URL('/', request.url);
      homeUrl.searchParams.set('auth', 'login');
      homeUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(homeUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/account/:path*', '/admin/:path*'],
};
