import { z } from 'zod';

export const upsertCredencialSchema = z.object({
  email: z.string().trim().email().max(150),
  password: z.string().min(8).max(128),
  estado: z.enum(['ACTIVA', 'INACTIVA']).default('ACTIVA'),
});

export const updateCredencialEstadoSchema = z.object({
  estado: z.enum(['ACTIVA', 'INACTIVA']),
});

export const updateCredencialPasswordSchema = z.object({
  password: z.string().min(8).max(128),
});
