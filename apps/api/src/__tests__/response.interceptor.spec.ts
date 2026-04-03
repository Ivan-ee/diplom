import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of, throwError, lastValueFrom } from 'rxjs';
import { ResponseInterceptor } from '../common/interceptors/response.interceptor';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildContext(url = '/api/test', method = 'GET') {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ url, method }),
    }),
  } as any;
}

function buildHandler(value: unknown) {
  return { handle: () => of(value) } as any;
}

function buildErrorHandler(error: unknown) {
  return { handle: () => throwError(() => error) } as any;
}

// ---------------------------------------------------------------------------

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor<unknown>;

  beforeEach(() => {
    interceptor = new ResponseInterceptor();
    vi.spyOn((interceptor as any).logger, 'error').mockImplementation(() => undefined);
  });

  // -------------------------------------------------------------------------
  // Plain value wrapping
  // -------------------------------------------------------------------------

  it('wraps a plain object in { success: true, data }', async () => {
    const payload = { id: 1, name: 'Торт' };
    const result = await lastValueFrom(
      interceptor.intercept(buildContext(), buildHandler(payload)),
    );

    expect(result).toEqual({ success: true, data: payload });
  });

  it('wraps a primitive string value in { success: true, data }', async () => {
    const result = await lastValueFrom(
      interceptor.intercept(buildContext(), buildHandler('hello')),
    );

    expect(result).toEqual({ success: true, data: 'hello' });
  });

  it('wraps a number value in { success: true, data }', async () => {
    const result = await lastValueFrom(
      interceptor.intercept(buildContext(), buildHandler(42)),
    );

    expect(result).toEqual({ success: true, data: 42 });
  });

  it('wraps an array in { success: true, data }', async () => {
    const list = [{ id: 1 }, { id: 2 }];
    const result = await lastValueFrom(
      interceptor.intercept(buildContext(), buildHandler(list)),
    );

    expect(result).toEqual({ success: true, data: list });
  });

  // -------------------------------------------------------------------------
  // Pre-shaped response pass-through (has BOTH data and meta keys)
  // -------------------------------------------------------------------------

  it('passes through a pre-shaped { data, meta } response without double-wrapping', async () => {
    const preshaped = {
      data: [{ id: 1 }],
      meta: { page: 1, limit: 10, total: 1 },
    };
    const result = await lastValueFrom(
      interceptor.intercept(buildContext(), buildHandler(preshaped)),
    );

    expect(result).toEqual({
      success: true,
      data: preshaped.data,
      meta: preshaped.meta,
    });
  });

  it('preserves all meta fields in the pass-through path', async () => {
    const preshaped = {
      data: [],
      meta: { page: 3, limit: 5, total: 100, extra: 'custom' },
    };
    const result = await lastValueFrom(
      interceptor.intercept(buildContext(), buildHandler(preshaped)),
    ) as any;

    expect(result.meta.page).toBe(3);
    expect(result.meta.total).toBe(100);
    expect(result.meta.extra).toBe('custom');
  });

  // -------------------------------------------------------------------------
  // Object with only 'data' key is NOT pre-shaped — gets wrapped
  // -------------------------------------------------------------------------

  it('wraps an object that only has a data key (no meta) as a plain value', async () => {
    const value = { data: [1, 2, 3] }; // missing 'meta' key
    const result = await lastValueFrom(
      interceptor.intercept(buildContext(), buildHandler(value)),
    );

    // The whole object becomes data; it should NOT be unwrapped
    expect(result).toEqual({ success: true, data: value });
  });

  // -------------------------------------------------------------------------
  // success flag is always boolean true
  // -------------------------------------------------------------------------

  it('always sets success to boolean true', async () => {
    const result = await lastValueFrom(
      interceptor.intercept(buildContext(), buildHandler(null)),
    ) as any;

    expect(result.success).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Error path — interceptor re-throws, does not swallow
  // -------------------------------------------------------------------------

  it('re-throws errors from the handler after logging', async () => {
    const error = new Error('handler blew up');
    const observable = interceptor.intercept(buildContext(), buildErrorHandler(error));

    await expect(lastValueFrom(observable)).rejects.toThrow('handler blew up');
  });

  it('logs the error before re-throwing', async () => {
    const logSpy = vi.spyOn((interceptor as any).logger, 'error');
    const error = new Error('boom');

    const observable = interceptor.intercept(buildContext('/api/fail', 'POST'), buildErrorHandler(error));

    await expect(lastValueFrom(observable)).rejects.toThrow();
    expect(logSpy).toHaveBeenCalledOnce();
  });
});
