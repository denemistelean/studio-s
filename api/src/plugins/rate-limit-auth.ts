import type { FastifyInstance, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { AppError } from '../shared/errors/app-error';

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Límites documentados para auth público (anti fuerza bruta). */
export const AUTH_RATE_LIMIT = {
  max: 20,
  windowMs: 15 * 60 * 1000,
} as const;

function clientKey(request: FastifyRequest, suffix: string): string {
  const ip = request.ip || 'unknown';
  return `${ip}:${suffix}`;
}

export function checkAuthRateLimit(request: FastifyRequest, routeKey: string): void {
  const key = clientKey(request, routeKey);
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + AUTH_RATE_LIMIT.windowMs });
    return;
  }
  if (entry.count >= AUTH_RATE_LIMIT.max) {
    throw new AppError(
      429,
      'Demasiados intentos. Esperá unos minutos e intentá de nuevo.',
    );
  }
  entry.count += 1;
}

/** Solo para tests. */
export function resetAuthRateLimitBuckets(): void {
  buckets.clear();
}

async function rateLimitAuthPlugin(_app: FastifyInstance): Promise<void> {
  // Plugin marker: la lógica se aplica vía preHandler en rutas auth.
}

export default fp(rateLimitAuthPlugin, { name: 'rate-limit-auth' });
