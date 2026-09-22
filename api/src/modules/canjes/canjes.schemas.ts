import { z } from 'zod';

export const listCanjesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  id_clienta: z.coerce.number().int().positive().optional(),
  estado: z.enum(['SOLICITADO', 'ENTREGADO', 'ANULADO']).optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const createCanjeSchema = z.object({
  id_clienta: z.coerce.number().int().positive(),
  id_recompensa: z.coerce.number().int().positive(),
  observaciones: z.string().trim().max(500).optional().nullable(),
});
