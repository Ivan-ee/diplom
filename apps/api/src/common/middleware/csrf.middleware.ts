import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const COOKIE_NAME = 'XSRF-TOKEN';
const HEADER_NAME = 'x-xsrf-token';
const CSRF_WHITELISTED_PATHS = new Set(['/api/auth/login', '/api/auth/register']);

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // Auth endpoints are exempt from CSRF — they are the session bootstrap
    // points where no XSRF-TOKEN cookie exists yet. They are protected by
    // rate-limiting (5/min) instead.
    if (CSRF_WHITELISTED_PATHS.has(req.path)) {
      return next();
    }

    // Refresh or issue the XSRF-TOKEN cookie on every request so that new
    // browser sessions pick it up without a dedicated handshake endpoint.
    if (!req.cookies[COOKIE_NAME]) {
      const token = randomBytes(32).toString('hex');
      res.cookie(COOKIE_NAME, token, {
        httpOnly: false, // intentional — browser JS must read and echo this value
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      });
      // The cookie value is now in the Set-Cookie response header but NOT yet
      // in req.cookies for this request. That is fine: this is the first GET
      // that seeds the token; the first state-changing request will come later
      // and will carry both the cookie and the matching header.
    }

    if (!SAFE_METHODS.has(req.method)) {
      const cookieToken = req.cookies[COOKIE_NAME] as string | undefined;
      const headerToken = req.headers[HEADER_NAME] as string | undefined;

      if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        res.status(403).json({
          success: false,
          statusCode: 403,
          timestamp: new Date().toISOString(),
          error: {
            code: 'CSRF_VALIDATION_FAILED',
            message: 'CSRF token validation failed',
          },
        });
        return;
      }
    }

    next();
  }
}
