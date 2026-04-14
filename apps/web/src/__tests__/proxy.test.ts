import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy } from '@/proxy';

// ── Helpers ────────────────────────────────────────────────────────────────────

function createJWT(payload: object): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fake-signature`;
}

function createRequest(path: string, token?: string): NextRequest {
  const url = new URL(path, 'http://localhost:3000');
  const req = new NextRequest(url);
  if (token !== undefined) {
    req.cookies.set('bakery_token', token);
  }
  return req;
}

// ── Proxy ─────────────────────────────────────────────────────────────────────

describe('proxy', () => {
  // ── No token ────────────────────────────────────────────────────────────────

  describe('when no bakery_token cookie is present', () => {
    it('redirects to /?auth=login for /account routes', () => {
      const req = createRequest('/account/profile');
      const res = proxy(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/?auth=login');
    });

    it('redirects to /?auth=login for /admin routes', () => {
      const req = createRequest('/admin/orders');
      const res = proxy(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/?auth=login');
    });
  });

  // ── Valid user token on /account ─────────────────────────────────────────────

  describe('when a valid token with role USER is present', () => {
    it('allows access to /account routes', () => {
      const token = createJWT({ sub: 'user-1', role: 'USER' });
      const req = createRequest('/account/profile', token);
      const res = proxy(req);
      // NextResponse.next() has status 200
      expect(res.status).toBe(200);
    });

    it('redirects away from /admin routes', () => {
      const token = createJWT({ sub: 'user-1', role: 'USER' });
      const req = createRequest('/admin/dashboard', token);
      const res = proxy(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/?auth=login');
    });
  });

  // ── Admin token – lowercase role ─────────────────────────────────────────────

  describe('when a valid token with role admin (lowercase) is present', () => {
    it('allows access to /admin routes', () => {
      const token = createJWT({ sub: 'admin-1', role: 'admin' });
      const req = createRequest('/admin/orders', token);
      const res = proxy(req);
      expect(res.status).toBe(200);
    });

    it('allows access to /account routes', () => {
      const token = createJWT({ sub: 'admin-1', role: 'admin' });
      const req = createRequest('/account/profile', token);
      const res = proxy(req);
      expect(res.status).toBe(200);
    });
  });

  // ── Admin token – uppercase role (NestJS stores 'ADMIN') ────────────────────

  describe('when a valid token with role ADMIN (uppercase) is present', () => {
    it('allows access to /admin routes', () => {
      const token = createJWT({ sub: 'admin-1', role: 'ADMIN' });
      const req = createRequest('/admin/orders', token);
      const res = proxy(req);
      expect(res.status).toBe(200);
    });

    it('allows access to /account routes', () => {
      const token = createJWT({ sub: 'admin-1', role: 'ADMIN' });
      const req = createRequest('/account/profile', token);
      const res = proxy(req);
      expect(res.status).toBe(200);
    });
  });

  // ── Malformed JWT ────────────────────────────────────────────────────────────

  describe('when the token is malformed', () => {
    it('redirects when token has only one part', () => {
      const req = createRequest('/admin/orders', 'not-a-jwt');
      const res = proxy(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/?auth=login');
    });

    it('redirects when token has two parts (missing signature)', () => {
      const req = createRequest('/admin/orders', 'header.payload');
      const res = proxy(req);
      expect(res.status).toBe(307);
    });

    it('redirects when token payload is not valid base64 JSON', () => {
      const req = createRequest('/admin/dashboard', 'header.!!!.sig');
      const res = proxy(req);
      expect(res.status).toBe(307);
    });

    it('still allows /account access when token payload is valid but not 3 parts', () => {
      // Only 2 parts → decodeJwtPayload returns null → redirect on admin check
      // For /account the route guard only checks token presence, not payload
      const req = createRequest('/account/profile', 'header.payload');
      // Token IS present so no-token redirect is skipped; /account never checks payload
      const res = proxy(req);
      expect(res.status).toBe(200);
    });
  });
});
