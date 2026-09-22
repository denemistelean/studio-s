import { z } from 'zod';

export const createUsuarioAdminSchema = z.object({
  email: z.string().trim().email().max(150),
  password: z.string().min(12).max(128),
  nombres: z.string().trim().min(1).max(100),
  apellidos: z.string().trim().min(1).max(100),
  id_rol: z.coerce.number().int().positive(),
  estado: z.enum(['ACTIVO', 'INACTIVO', 'BLOQUEADO']).default('ACTIVO'),
});

export const updateUsuarioAdminSchema = z
  .object({
    email: z.string().trim().email().max(150).optional(),
    password: z.string().min(12).max(128).optional(),
    nombres: z.string().trim().min(1).max(100).optional(),
    apellidos: z.string().trim().min(1).max(100).optional(),
    id_rol: z.coerce.number().int().positive().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar',
  });

export const updateUsuarioAdminEstadoSchema = z.object({
  estado: z.enum(['ACTIVO', 'INACTIVO', 'BLOQUEADO']),
});

export const listUsuariosAdminQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(150).optional(),
  estado: z.enum(['ACTIVO', 'INACTIVO', 'BLOQUEADO']).optional(),
  sort: z.enum(['creadoEn', 'actualizadoEn', 'email', 'nombres', 'apellidos']).default('creadoEn'),
  order: z.enum(['asc', 'desc']).default('desc'),
});
