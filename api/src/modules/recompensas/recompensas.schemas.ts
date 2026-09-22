import { z } from 'zod';

export const listRecompensasQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(150).optional(),
  estado: z.enum(['ACTIVA', 'INACTIVA']).optional(),
  sort: z.enum(['creado_en', 'nombre', 'puntos_requeridos']).default('creado_en'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const createRecompensaSchema = z.object({
  nombre: z.string().trim().min(1).max(150),
  descripcion: z.string().trim().max(5000).optional().nullable(),
  puntos_requeridos: z.coerce.number().int().positive(),
  stock: z.coerce.number().int().min(0).optional().nullable(),
  limite_por_clienta: z.coerce.number().int().min(1).optional().nullable(),
  estado: z.enum(['ACTIVA', 'INACTIVA']).default('ACTIVA'),
});

export const updateRecompensaSchema = z
  .object({
    nombre: z.string().trim().min(1).max(150).optional(),
    descripcion: z.string().trim().max(5000).optional().nullable(),
    puntos_requeridos: z.coerce.number().int().positive().optional(),
    stock: z.coerce.number().int().min(0).optional().nullable(),
    limite_por_clienta: z.coerce.number().int().min(1).optional().nullable(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Sin campos para actualizar' });

export const updateRecompensaEstadoSchema = z.object({
  estado: z.enum(['ACTIVA', 'INACTIVA']),
});
