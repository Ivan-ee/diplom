import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchServer } from '@/lib/api';

// ── Helpers ────────────────────────────────────────────────────────────────────

function mockFetch(response: Partial<Response> & { body?: unknown }): void {
  const { body, ...rest } = response;
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve(body),
      ...rest,
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

// ── buildUrl (tested indirectly via fetchServer) ───────────────────────────────

describe('buildUrl', () => {
  it('builds a URL that includes the path under /api', async () => {
    mockFetch({ body: { success: true, data: [] } });
    await fetchServer('/products');
    const calledUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain('/api/products');
  });

  it('appends params as a query string', async () => {
    mockFetch({ body: { success: true, data: [] } });
    await fetchServer('/products', { params: { page: 2, limit: 10 } });
    const calledUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain('page=2');
    expect(calledUrl).toContain('limit=10');
  });

  it('filters out undefined params', async () => {
    mockFetch({ body: { success: true, data: [] } });
    await fetchServer('/products', { params: { page: 1, category: undefined } });
    const calledUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).not.toContain('category');
    expect(calledUrl).toContain('page=1');
  });

  it('filters out empty-string params', async () => {
    mockFetch({ body: { success: true, data: [] } });
    await fetchServer('/products', { params: { search: '' as unknown as undefined, page: 1 } });
    const calledUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).not.toContain('search');
  });

  it('numeric params are converted to strings in the URL', async () => {
    mockFetch({ body: { success: true, data: [] } });
    await fetchServer('/products', { params: { limit: 5 } });
    const calledUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain('limit=5');
  });
});

// ── parseErrorResponse / error handling ───────────────────────────────────────

describe('fetchServer error handling', () => {
  it('throws an Error with the message from the API error body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () =>
          Promise.resolve({ error: { code: 'NOT_FOUND', message: 'Product not found' } }),
      }),
    );

    await expect(fetchServer('/products/999')).rejects.toThrow('Product not found');
  });

  it('attaches the parsed body as error.cause', async () => {
    const apiBody = { error: { code: 'NOT_FOUND', message: 'Product not found' } };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve(apiBody),
      }),
    );

    let caught: Error | null = null;
    try {
      await fetchServer('/products/999');
    } catch (e) {
      caught = e as Error;
    }

    expect(caught).not.toBeNull();
    expect((caught as Error & { cause: unknown }).cause).toEqual(apiBody);
  });

  it('falls back to statusText when the response body is not valid JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: () => Promise.reject(new SyntaxError('Unexpected token')),
      }),
    );

    await expect(fetchServer('/products')).rejects.toThrow('Service Unavailable');
  });

  it('falls back to a generic message when statusText and body message are both absent', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: '',
        json: () => Promise.resolve({}),
      }),
    );

    await expect(fetchServer('/products')).rejects.toThrow('API error: 500');
  });

  it('returns parsed data on a successful response', async () => {
    const payload = { success: true, data: { id: '1', name: 'Торт' } };
    mockFetch({ body: payload });

    const result = await fetchServer<{ id: string; name: string }>('/products/1');
    expect(result.data.name).toBe('Торт');
  });
});
