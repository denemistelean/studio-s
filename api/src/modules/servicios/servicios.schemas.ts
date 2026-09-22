import { z } from 'zod';

export const listServiciosQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(150).optional(),
  estado: z.enum(['ACTIVO', 'INACTIVO']).optional(),
  sort: z.enum(['creado_en', 'nombre', 'precio', 'puntos_otorgados']).default('creado_en'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const createServicioSchema = z.object({
  nombre: z.string().trim().min(1).max(150),
  descripcion: z.string().trim().max(5000).optional().nullable(),
  precio: z.coerce.number().min(0),
  puntos_otorgados: z.coerce.number().int().min(0).default(0),
  estado: z.enum(['ACTIVO', 'INACTIVO']).default('ACTIVO'),
});

export const updateServicioSchema = z
  .object({
    nombre: z.string().trim().min(1).max(150).optional(),
    descripcion: z.string().trim().max(5000).optional().nullable(),
    precio: z.coerce.number().min(0).optional(),
    puntos_otorgados: z.coerce.number().int().min(0).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Sin campos para actualizar' });

export const updateServicioEstadoSchema = z.object({
  estado: z.enum(['ACTIVO', 'INACTIVO']),
});
