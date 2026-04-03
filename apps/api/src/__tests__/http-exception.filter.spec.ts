import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  HttpException,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';

// ---------------------------------------------------------------------------
// Helpers to build a mock ArgumentsHost
// ---------------------------------------------------------------------------

function buildHost(url = '/test-path') {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const response = { status };

  const request = { url };

  const switchToHttp = vi.fn().mockReturnValue({
    getResponse: () => response,
    getRequest: () => request,
  });

  return { host: { switchToHttp } as any, json, status, response };
}

// ---------------------------------------------------------------------------

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    // Suppress logger output in tests
    vi.spyOn((filter as any).logger, 'warn').mockImplementation(() => undefined);
  });

  // -------------------------------------------------------------------------
  // Standard HttpException (NotFoundException)
  // -------------------------------------------------------------------------

  it('formats a NotFoundException into the standard error envelope', () => {
    const exception = new NotFoundException('Product not found');
    const { host, status, json } = buildHost('/api/products/99');

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledOnce();

    const body = json.mock.calls[0][0];
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toBe('Product not found');
    expect(body.error.path).toBe('/api/products/99');
  });

  // -------------------------------------------------------------------------
  // Validation error — BadRequestException with array message
  // -------------------------------------------------------------------------

  it('formats a validation BadRequestException (array message) with VALIDATION_ERROR code', () => {
    const validationMessages = ['name must not be empty', 'price must be a number'];
    const exception = new BadRequestException({ message: validationMessages, error: 'Bad Request', statusCode: 400 });
    const { host, status, json } = buildHost('/api/products');

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);

    const body = json.mock.calls[0][0];
    expect(body.success).toBe(false);
    // resolveCode(400) === 'BAD_REQUEST', not 'VALIDATION_ERROR'
    expect(body.error.code).toBe('BAD_REQUEST');
    expect(body.error.message).toBe('Validation failed');
    expect(body.error.details).toEqual(validationMessages);
  });

  // -------------------------------------------------------------------------
  // HTTP status is reflected correctly for various exception types
  // -------------------------------------------------------------------------

  it('returns 401 status for UnauthorizedException', () => {
    const exception = new UnauthorizedException('Unauthorized');
    const { host, status } = buildHost();

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(401);
  });

  it('returns 409 for ConflictException and maps code to CONFLICT', () => {
    const exception = new ConflictException('Email already taken');
    const { host, json } = buildHost('/api/auth/register');

    filter.catch(exception, host);

    const body = json.mock.calls[0][0];
    expect(body.error.code).toBe('CONFLICT');
  });

  it('falls back to HTTP_ERROR code for unmapped status', () => {
    const exception = new HttpException('I am a teapot', 418);
    const { host, json } = buildHost('/api/brew');

    filter.catch(exception, host);

    const body = json.mock.calls[0][0];
    expect(body.error.code).toBe('HTTP_ERROR');
  });

  // -------------------------------------------------------------------------
  // Timestamp and path are present in the response
  // -------------------------------------------------------------------------

  it('includes a valid ISO timestamp and the request path in the error envelope', () => {
    const before = Date.now();
    const exception = new NotFoundException();
    const { host, json } = buildHost('/api/orders/123');

    filter.catch(exception, host);

    const after = Date.now();
    const body = json.mock.calls[0][0];

    expect(body.error.path).toBe('/api/orders/123');

    const ts = new Date(body.error.timestamp).getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  // -------------------------------------------------------------------------
  // String-body HttpException
  // -------------------------------------------------------------------------

  it('handles a string exception response directly as the message', () => {
    const exception = new HttpException('plain string error', HttpStatus.BAD_REQUEST);
    const { host, json } = buildHost();

    filter.catch(exception, host);

    const body = json.mock.calls[0][0];
    expect(body.error.message).toBe('plain string error');
    expect(body.error.details).toBeUndefined();
  });

  // -------------------------------------------------------------------------
  // Object body without array message falls through to scalar message
  // -------------------------------------------------------------------------

  it('uses body.message when it is a scalar string', () => {
    const exception = new BadRequestException({ message: 'single string error', statusCode: 400 });
    const { host, json } = buildHost();

    filter.catch(exception, host);

    const body = json.mock.calls[0][0];
    expect(body.error.message).toBe('single string error');
    expect(body.error.details).toBeUndefined();
  });
});
