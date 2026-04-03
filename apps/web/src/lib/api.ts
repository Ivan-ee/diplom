const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown[];
  };
}

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | undefined>;
}

function buildUrl(path: string, params?: Record<string, string | number | undefined>): string {
  const url = new URL(`/api${path}`, API_BASE_URL);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

async function parseErrorResponse(res: Response): Promise<never> {
  const error = await res.json().catch(() => ({ error: { message: res.statusText } }));
  throw new Error(error.error?.message || `API error: ${res.status}`, { cause: error });
}

/**
 * Fetch for Server Components — direct to API
 */
export async function fetchServer<T>(
  path: string,
  options: FetchOptions = {},
): Promise<ApiResponse<T>> {
  const { params, ...fetchOptions } = options;
  const url = buildUrl(path, params);

  const res = await fetch(url, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
  });

  if (!res.ok) {
    await parseErrorResponse(res);
  }

  return res.json();
}

/**
 * Fetch for Client Components — goes through Next.js rewrites proxy
 */
export async function fetchClient<T>(
  path: string,
  options: FetchOptions = {},
): Promise<ApiResponse<T>> {
  const { params, ...fetchOptions } = options;

  const url = new URL(`/api${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }
  const clientUrl = url.toString();

  const res = await fetch(clientUrl, {
    ...fetchOptions,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
  });

  if (!res.ok) {
    await parseErrorResponse(res);
  }

  return res.json();
}
