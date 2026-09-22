import type { ApiErrorBody, ApiSuccess } from '@/types/api';
import { clearClientaStoredToken, getClientaStoredToken } from './clienta-token';

const TOKEN_KEY = 'studios_admin_token';

export function getApiBaseUrl() {
  const configured =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ||
    'https://api.automotorestrujillo.com';

  // Desde el celular (misma WiFi): localhost apuntaría al teléfono.
  // Usamos el mismo host de la página y el puerto de la API local.
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const isPrivateLan =
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(host) ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) ||
      /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host);

    if (isPrivateLan) {
      return `http://${host}:3000`;
    }
  }

  return configured;
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

export class ApiClientError extends Error {
  status: number;
  errors: unknown[];

  constructor(status: number, message: string, errors: unknown[] = []) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.errors = errors;
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Evita redirect en login/registro (401 esperado). */
  skipAuthRedirect?: boolean;
};

function buildUrl(path: string, query?: RequestOptions['query']) {
  const url = new URL(path.startsWith('http') ? path : `${getApiBaseUrl()}${path}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      url.searchParams.set(key, String(value));
    });
  }
  return url.toString();
}

function handleUnauthorized(token: string | null | undefined, skip?: boolean) {
  if (skip || typeof window === 'undefined' || !token) return;

  const clientaToken = getClientaStoredToken();
  const adminToken = getStoredToken();

  if (clientaToken && token === clientaToken) {
    clearClientaStoredToken();
    if (!window.location.pathname.startsWith('/clienta/login')) {
      window.location.assign('/clienta/login');
    }
    return;
  }

  if (adminToken && token === adminToken) {
    clearStoredToken();
    if (!window.location.pathname.startsWith('/login')) {
      window.location.assign('/login');
    }
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const token = options.token === undefined ? getStoredToken() : options.token;
  const headers: HeadersInit = {
    Accept: 'application/json',
  };
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(buildUrl(path, options.query), {
    method: options.method || 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    credentials: 'include',
  });

  let json: ApiSuccess<T> | ApiErrorBody | null = null;
  try {
    json = (await res.json()) as ApiSuccess<T> | ApiErrorBody;
  } catch {
    throw new ApiClientError(res.status, 'Respuesta no válida del servidor');
  }

  if (!res.ok || !json || json.success !== true) {
    if (res.status === 401) {
      handleUnauthorized(token, options.skipAuthRedirect);
    }
    const err = json as ApiErrorBody | null;
    const message =
      res.status === 429
        ? err?.message || 'Demasiados intentos. Esperá unos minutos e intentá de nuevo.'
        : res.status >= 500
          ? 'Ocurrió un error inesperado. Intenta nuevamente.'
          : err?.message || 'Error en la solicitud';
    throw new ApiClientError(res.status, message, err?.errors || []);
  }

  return json.data;
}
