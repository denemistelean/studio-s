import { z } from 'zod';

export const listMovimientosQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  tipo: z
    .enum(['ACUMULACION', 'CANJE', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO', 'REVERSO'])
    .optional(),
  sort: z.enum(['creado_en']).default('creado_en'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const ajustarPuntosSchema = z.object({
  id_clienta: z.coerce.number().int().positive(),
  tipo: z.enum(['AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO']),
  puntos: z.coerce.number().int().positive(),
  descripcion: z.string().trim().max(255).optional().nullable(),
});
