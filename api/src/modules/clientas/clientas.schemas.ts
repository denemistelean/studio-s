import { z } from 'zod';

export const listClientasQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(150).optional(),
  estado: z.enum(['ACTIVA', 'INACTIVA', 'BLOQUEADA']).optional(),
  sort: z.enum(['creado_en', 'apellidos', 'nombres', 'puntos_saldo']).default('creado_en'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const createClientaSchema = z.object({
  nombres: z.string().trim().min(1).max(100),
  apellidos: z.string().trim().min(1).max(100),
  telefono: z.string().trim().max(20).optional().nullable(),
  fecha_nacimiento: z.string().date().optional().nullable(),
  estado: z.enum(['ACTIVA', 'INACTIVA', 'BLOQUEADA']).default('ACTIVA'),
});

export const updateClientaSchema = z
  .object({
    nombres: z.string().trim().min(1).max(100).optional(),
    apellidos: z.string().trim().min(1).max(100).optional(),
    telefono: z.string().trim().max(20).optional().nullable(),
    fecha_nacimiento: z.string().date().optional().nullable(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Sin campos para actualizar' });

export const updateClientaEstadoSchema = z.object({
  estado: z.enum(['ACTIVA', 'INACTIVA', 'BLOQUEADA']),
});
