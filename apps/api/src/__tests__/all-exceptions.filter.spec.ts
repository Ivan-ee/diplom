import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpStatus } from '@nestjs/common';
import { AllExceptionsFilter } from '../common/filters/all-exceptions.filter';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildHost(url = '/test', method = 'GET') {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });

  const switchToHttp = vi.fn().mockReturnValue({
    getResponse: () => ({ status }),
    getRequest: () => ({ url, method }),
  });

  return { host: { switchToHttp } as any, json, status };
}

// ---------------------------------------------------------------------------

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    vi.spyOn((filter as any).logger, 'error').mockImplementation(() => undefined);
  });

  // -------------------------------------------------------------------------
  // Generic Error instance
  // -------------------------------------------------------------------------

  it('catches a generic Error and responds with 500 and the standard envelope', () => {
    const { host, status, json } = buildHost('/api/orders');

    filter.catch(new Error('something went wrong'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledOnce();

    const body = json.mock.calls[0][0];
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.statusCode).toBe(500);
  });

  it('does NOT expose the raw error message to the client', () => {
    const { host, json } = buildHost();

    filter.catch(new Error('super secret db password leak'), host);

    const body = json.mock.calls[0][0];
    expect(body.error.message).toBe('Internal server error');
    expect(body.error.message).not.toContain('secret');
  });

  // -------------------------------------------------------------------------
  // Non-Error throw (plain string)
  // -------------------------------------------------------------------------

  it('catches a thrown string and still returns 500 with the generic message', () => {
    const { host, status, json } = buildHost('/api/products');

    filter.catch('something totally unexpected', host);

    expect(status).toHaveBeenCalledWith(500);

    const body = json.mock.calls[0][0];
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).toBe('Internal server error');
  });

  it('catches a thrown plain object and still returns 500', () => {
    const { host, status, json } = buildHost();

    filter.catch({ some: 'weird object' }, host);

    expect(status).toHaveBeenCalledWith(500);
    const body = json.mock.calls[0][0];
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });

  it('catches null and still returns 500', () => {
    const { host, status } = buildHost();

    filter.catch(null, host);

    expect(status).toHaveBeenCalledWith(500);
  });

  // -------------------------------------------------------------------------
  // Response shape — top-level fields
  // -------------------------------------------------------------------------

  it('includes top-level timestamp as a valid ISO string', () => {
    const before = Date.now();
    const { host, json } = buildHost();

    filter.catch(new Error('boom'), host);

    const after = Date.now();
    const body = json.mock.calls[0][0];

    expect(typeof body.timestamp).toBe('string');
    const ts = new Date(body.timestamp).getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it('includes top-level statusCode: 500', () => {
    const { host, json } = buildHost();

    filter.catch(new Error('x'), host);

    expect(json.mock.calls[0][0].statusCode).toBe(500);
  });
});
