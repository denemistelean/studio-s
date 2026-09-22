import { z } from 'zod';

export const updateRolPermisosSchema = z.object({
  codigos: z.array(z.string().trim().min(1).max(100)).max(200),
});

export const updateRolEstadoSchema = z.object({
  estado: z.enum(['ACTIVO', 'INACTIVO']),
});
