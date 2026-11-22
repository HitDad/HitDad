import type {
  AuthTokens,
  ErrorResponse,
  MembershipErrorResponse,
  ValidationErrorItem,
  ValidationErrorResponse,
} from '@/types';

import { API_BASE_URL, API_ENDPOINTS } from './endpoints';

export type QueryParams = Record<string, string | number | boolean | undefined | null>;

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: QueryParams;
  body?: unknown;
  headers?: Record<string, string>;
  /** Attach Bearer accessToken when available (default: true). */
  auth?: boolean;
  signal?: AbortSignal;
}

/** Structured error thrown by `apiRequest` for non-2xx HTTP responses. */
export class ApiClientError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly validationErrors?: ValidationErrorItem[];
  readonly raw?: unknown;

  constructor(
    message: string,
    status: number,
    options?: {
      code?: string;
      validationErrors?: ValidationErrorItem[];
      raw?: unknown;
    },
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = options?.code;
    this.validationErrors = options?.validationErrors;
    this.raw = options?.raw;
  }
}

let currentTokens: AuthTokens | null = null;
let onAuthFailureHandler: (() => void) | null = null;
let onTokensRefreshedHandler: ((tokens: AuthTokens) => void) | null = null;
let inflightRefresh: Promise<AuthTokens | null> | null = null;

/** Stores Bearer tokens in memory (hydrate from secure storage in auth flow). */
export function setAuthTokens(tokens: AuthTokens | null): void {
  currentTokens = tokens;
}

/** Returns currently stored Bearer tokens, if any. */
export function getAuthTokens(): AuthTokens | null {
  return currentTokens;
}

/** Clears in-memory Bearer tokens on logout or failed refresh. */
export function clearAuthTokens(): void {
  currentTokens = null;
}

/** Registers a callback invoked when a 401 refresh fails (e.g. redirect to Login). */
export function setOnAuthFailure(handler: (() => void) | null): void {
  onAuthFailureHandler = handler;
}

/** Registers a callback invoked whenever tokens are rotated via refresh endpoint. */
export function setOnTokensRefreshed(handler: ((tokens: AuthTokens) => void) | null): void {
  onTokensRefreshedHandler = handler;
}

function buildUrl(path: string, query?: QueryParams): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const base = `${API_BASE_URL}${normalizedPath}`;
  if (!query) return base;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

async function parseJsonSafe(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function toApiError(status: number, payload: unknown, fallbackText: string): ApiClientError {
  if (payload && typeof payload === 'object') {
    const asMembership = payload as Partial<MembershipErrorResponse>;
    if (typeof asMembership.error === 'string') {
      return new ApiClientError(asMembership.error, status, {
        code: typeof asMembership.code === 'string' ? asMembership.code : undefined,
        raw: payload,
      });
    }

    const asValidation = payload as Partial<ValidationErrorResponse>;
    if (Array.isArray(asValidation.errors) && asValidation.errors.length > 0) {
      const firstMsg = asValidation.errors[0]?.msg || 'Dữ liệu đầu vào không hợp lệ';
      return new ApiClientError(firstMsg, status, {
        validationErrors: asValidation.errors,
        raw: payload,
      });
    }

    const asError = payload as Partial<ErrorResponse> & { message?: string };
    if (typeof asError.message === 'string') {
      return new ApiClientError(asError.message, status, { raw: payload });
    }
  }

  return new ApiClientError(fallbackText || `HTTP ${status}`, status, { raw: payload });
}

function shouldSkipRefresh(path: string): boolean {
  return (
    path.startsWith(API_ENDPOINTS.auth.login) ||
    path.startsWith(API_ENDPOINTS.auth.refresh) ||
    path.startsWith(API_ENDPOINTS.auth.register)
  );
}

async function refreshAccessToken(): Promise<AuthTokens | null> {
  const refreshToken = currentTokens?.refreshToken;
  if (!refreshToken) return null;

  if (!inflightRefresh) {
    inflightRefresh = (async () => {
      try {
        const res = await fetch(buildUrl(API_ENDPOINTS.auth.refresh), {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });

        if (!res.ok) {
          clearAuthTokens();
          onAuthFailureHandler?.();
          return null;
        }

        const data = (await parseJsonSafe(res)) as Partial<AuthTokens> | undefined;
        if (data?.accessToken && data?.refreshToken) {
          const nextTokens: AuthTokens = {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          };
          setAuthTokens(nextTokens);
          onTokensRefreshedHandler?.(nextTokens);
          return nextTokens;
        }

        clearAuthTokens();
        onAuthFailureHandler?.();
        return null;
      } catch {
        clearAuthTokens();
        onAuthFailureHandler?.();
        return null;
      } finally {
        inflightRefresh = null;
      }
    })();
  }

  return inflightRefresh;
}

async function executeFetch(
  path: string,
  options: ApiRequestOptions,
  accessToken?: string,
): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...options.headers,
  };

  let bodyPayload: string | undefined;
  if (options.body !== undefined) {
    headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
    bodyPayload = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }

  if (options.auth !== false && accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    headers,
    body: bodyPayload,
    signal: options.signal,
  });
}

/**
 * Executes a typed request against the CSE HitDad API with Bearer auth and
 * single-flight 401 refresh-token retry.
 */
export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const useAuth = options.auth !== false;
  let response = await executeFetch(
    path,
    options,
    useAuth ? currentTokens?.accessToken : undefined,
  );

  if (response.status === 401 && useAuth && !shouldSkipRefresh(path)) {
    const refreshed = await refreshAccessToken();
    if (refreshed?.accessToken) {
      response = await executeFetch(path, options, refreshed.accessToken);
    }
  }

  const payload = await parseJsonSafe(response);
  if (!response.ok) {
    throw toApiError(response.status, payload, response.statusText);
  }

  return payload as T;
}

export const apiClient = {
  get: <T>(path: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),

  put: <T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'PUT', body }),

  patch: <T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'PATCH', body }),

  delete: <T>(path: string, options?: Omit<ApiRequestOptions, 'method'>) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
};
