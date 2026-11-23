/** Minimal fetch wrapper: base URL, bearer token, JSON, and friendly errors. */

export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5001').replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

/** Called when the server rejects our token (expired / revoked) so the app can log out. */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'DELETE';
  json?: unknown;
  form?: FormData;
};

export async function request<T>(path: string, { method = 'GET', json, form }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  if (json !== undefined) headers['Content-Type'] = 'application/json';
  // For FormData, let fetch set the multipart boundary itself.

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: form ?? (json !== undefined ? JSON.stringify(json) : undefined),
    });
  } catch {
    throw new ApiError("We couldn't reach Memoria. Please check your internet connection and try again.", 0);
  }

  if (response.status === 204) return undefined as T;

  let data: Record<string, unknown> = {};
  try {
    data = await response.json();
  } catch {
    // Non-JSON body (e.g. a proxy error page) — fall through with empty data.
  }

  if (!response.ok) {
    if (response.status === 401 && authToken) onUnauthorized?.();
    const message = typeof data.error === 'string' ? data.error : 'Something went wrong. Please try again.';
    throw new ApiError(message, response.status, data);
  }
  return data as T;
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong. Please try again.';
}
