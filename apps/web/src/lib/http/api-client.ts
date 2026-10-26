import type { ApiError } from '@rms/contracts/public';

export class ApiException extends Error implements ApiError {
  public readonly code: string;
  public readonly fieldErrors?: Record<string, string[]>;
  public readonly traceId: string;
  public readonly status: number;

  constructor(status: number, error: Partial<ApiError>) {
    super(error.message ?? `HTTP error ${status}`);
    this.name = 'ApiException';
    this.status = status;
    this.code = error.code ?? 'UNKNOWN_ERROR';
    this.fieldErrors = error.fieldErrors;
    this.traceId = error.traceId ?? '';
  }

  public static isApiError(err: unknown): err is ApiException {
    return err instanceof ApiException;
  }
}

export function isApiException(err: unknown): err is ApiException {
  return err instanceof ApiException;
}

export const isApiError = isApiException;

export interface RequestOptions extends RequestInit {
  idempotencyKey?: string;
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiClient {
  private csrfToken: string | null = null;
  private baseUrl: string = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

  public setCsrfToken(token: string | null): void {
    this.csrfToken = token;
  }

  public getCsrfToken(): string | null {
    return this.csrfToken;
  }

  public setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { idempotencyKey, params, headers, ...customConfig } = options;

    const baseUrl = this.baseUrl.replace(/\/$/, '').replace(/\/api$/, '');
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const apiPath = path === '/api' || path.startsWith('/api/') ? path : `/api${path}`;
    let url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${apiPath}`;

    if (params) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      }
      const query = searchParams.toString();
      if (query) {
        url += (url.includes('?') ? '&' : '?') + query;
      }
    }

    const requestHeaders: Record<string, string> = {
      Accept: 'application/json',
      ...((headers as Record<string, string>) || {}),
    };

    if (customConfig.body && !(customConfig.body instanceof FormData)) {
      requestHeaders['Content-Type'] = 'application/json';
    }

    // Attach CSRF token for mutating methods
    const method = customConfig.method?.toUpperCase() ?? 'GET';
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && this.csrfToken) {
      requestHeaders['X-CSRF-Token'] = this.csrfToken;
    }

    // Attach Idempotency-Key if provided
    if (idempotencyKey) {
      requestHeaders['Idempotency-Key'] = idempotencyKey;
    }

    const response = await fetch(url, {
      ...customConfig,
      headers: requestHeaders,
      credentials: 'include',
    });

    if (response.status === 204) {
      return undefined as unknown as T;
    }

    let data: unknown;
    const contentType = response.headers?.get?.('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else if (typeof response.text === 'function') {
      data = await response.text();
    } else {
      data = null;
    }

    if (!response.ok) {
      const errPayload =
        typeof data === 'object' && data !== null ? (data as Partial<ApiError>) : {};
      throw new ApiException(response.status, errPayload);
    }

    // Single resources use { data: resource }; pages already contain data + meta.
    if (
      typeof data === 'object' &&
      data !== null &&
      Object.keys(data).length === 1 &&
      'data' in data
    ) {
      return (data as { data: T }).data;
    }
    return data as T;
  }

  public get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  public patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  public put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  public delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
