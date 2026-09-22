import { z } from 'zod';

export const listSesionesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  activas: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
});

export const createSesionSchema = z.object({
  id_clienta: z.coerce.number().int().positive(),
  /** Minutos hasta expiración (default 30 días). */
  ttl_minutos: z.coerce.number().int().min(5).max(60 * 24 * 90).default(60 * 24 * 30),
});
