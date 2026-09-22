const OPEN_ORIGIN = /^(true|\*)$/i;

export function splitOrigins(value: string): string[] {
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

export function resolveCorsOrigins(input: {
  CORS_ORIGINS?: string | undefined;
  CORS_ORIGIN?: string | undefined;
}): string[] {
  const preferred = input.CORS_ORIGINS?.trim();
  const fallback = input.CORS_ORIGIN?.trim();
  const raw = preferred && preferred.length > 0 ? preferred : fallback;

  if (!raw) {
    return [];
  }

  return splitOrigins(raw);
}

export function hasOpenCorsOrigin(origins: readonly string[]): boolean {
  return origins.some((origin) => OPEN_ORIGIN.test(origin));
}

/** Origen del frontend en LAN privada (solo puerto 3001, sin wildcard). */
export function isPrivateLanDevWebOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    if (url.port !== '3001') return false;
    const host = url.hostname;
    return (
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(host) ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) ||
      /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host)
    );
  } catch {
    return false;
  }
}

/**
 * Sin cabecera Origin (curl, health checks, tools) se permite.
 * Con Origin, solo pasa si está en la lista exacta.
 * Nunca acepta '*': incompatible con credentials.
 * En development también permite orígenes LAN privados en :3001 (pruebas en celular).
 */
export function isCorsOriginAllowed(
  origin: string | undefined,
  allowedOrigins: readonly string[],
  options?: { allowPrivateLanInDev?: boolean },
): boolean {
  if (origin === undefined || origin === '') {
    return true;
  }

  if (origin === '*' || OPEN_ORIGIN.test(origin)) {
    return false;
  }

  if (allowedOrigins.includes(origin)) {
    return true;
  }

  if (options?.allowPrivateLanInDev && isPrivateLanDevWebOrigin(origin)) {
    return true;
  }

  return false;
}
