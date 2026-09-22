import { z } from 'zod';

export const registroClientaSchema = z.object({
  nombres: z.string().trim().min(1).max(100),
  apellidos: z.string().trim().min(1).max(100),
  telefono: z.string().trim().max(20).optional().nullable(),
  fecha_nacimiento: z.string().date().optional().nullable(),
  email: z.string().trim().email().max(150),
  password: z.string().min(8).max(128),
});

export const loginClientaSchema = z.object({
  email: z.string().trim().email().max(150),
  password: z.string().min(1).max(128),
});

export const portalListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
