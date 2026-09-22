import { z } from 'zod';

export const listAuditoriaQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  accion: z.string().trim().max(100).optional(),
  tabla_afectada: z.string().trim().max(100).optional(),
  id_usuario_admin: z.coerce.number().int().positive().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});
