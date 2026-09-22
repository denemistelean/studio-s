import { z } from 'zod';

export const listQrQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  activo: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
});

export const generateQrSchema = z.object({
  id_clienta: z.coerce.number().int().positive(),
  expira_en: z
    .string()
    .datetime()
    .optional()
    .nullable()
    .transform((v) => (v ? new Date(v) : null)),
  revocar_anteriores: z.boolean().default(true),
});

export const validateQrSchema = z.object({
  token: z.string().trim().min(16).max(200),
});
