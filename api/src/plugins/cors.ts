import cors from '@fastify/cors';
import type { FastifyCorsOptions } from '@fastify/cors';
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { allowedOrigins, env } from '../config/env';
import { isCorsOriginAllowed } from '../shared/utils/cors-origins';

export const CORS_METHODS = [
  'GET',
  'HEAD',
  'PUT',
  'PATCH',
  'POST',
  'DELETE',
  'OPTIONS',
] as const;

export const CORS_ALLOWED_HEADERS = ['Content-Type', 'Authorization'] as const;

export function buildCorsOptions(
  origins: string[],
  options?: { allowPrivateLanInDev?: boolean },
): FastifyCorsOptions {
  return {
    credentials: true,
    methods: [...CORS_METHODS],
    allowedHeaders: [...CORS_ALLOWED_HEADERS],
    origin(origin, callback) {
      if (isCorsOriginAllowed(origin, origins, options)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
  };
}

async function corsPlugin(app: FastifyInstance): Promise<void> {
  const origins = allowedOrigins();
  const allowPrivateLanInDev = env.NODE_ENV === 'development';

  app.log.info(
    { allowedOriginCount: origins.length, allowPrivateLanInDev },
    'CORS configurado',
  );

  await app.register(cors, buildCorsOptions(origins, { allowPrivateLanInDev }));
}

export default fp(corsPlugin, { name: 'cors' });
