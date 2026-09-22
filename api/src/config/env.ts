import 'dotenv/config';
import { z } from 'zod';
import {
  hasOpenCorsOrigin,
  resolveCorsOrigins,
  splitOrigins,
} from '../shared/utils/cors-origins';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    HOST: z.string().min(1).default('0.0.0.0'),
    DATABASE_URL: z.string().min(1),
    DB_HOST: z.string().min(1),
    DB_PORT: z.coerce.number().int().positive(),
    DB_NAME: z.string().min(1),
    DB_USER: z.string().min(1),
    DB_PASSWORD: z.string().min(1),
    CORS_ORIGIN: z.string().optional(),
    CORS_ORIGINS: z.string().optional(),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
    JWT_EXPIRES_IN: z.string().min(1).default('8h'),
  })
  .superRefine((value, ctx) => {
    const origins = resolveCorsOrigins({
      CORS_ORIGINS: value.CORS_ORIGINS,
      CORS_ORIGIN: value.CORS_ORIGIN,
    });

    if (origins.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['CORS_ORIGINS'],
        message: 'Define CORS_ORIGINS o, como respaldo, CORS_ORIGIN.',
      });
      return;
    }

    if (hasOpenCorsOrigin(origins)) {
      ctx.addIssue({
        code: 'custom',
        path: value.CORS_ORIGINS?.trim() ? ['CORS_ORIGINS'] : ['CORS_ORIGIN'],
        message: 'CORS no admite "*" ni "true" cuando se usan credenciales.',
      });
    }
  });

export type AppEnv = z.infer<typeof envSchema>;

function loadEnv(): AppEnv {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const fields = parsed.error.issues
      .map((issue) => issue.path.join('.') || 'entorno')
      .join(', ');
    throw new Error(`Variables de entorno inválidas: ${fields}`);
  }

  return parsed.data;
}

export const env = loadEnv();

export function allowedOrigins(config: AppEnv = env): string[] {
  return resolveCorsOrigins({
    CORS_ORIGINS: config.CORS_ORIGINS,
    CORS_ORIGIN: config.CORS_ORIGIN,
  });
}

export { splitOrigins };
