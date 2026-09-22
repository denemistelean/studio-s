import { z } from 'zod';

export const listServiciosRealizadosQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  id_clienta: z.coerce.number().int().positive().optional(),
  id_servicio: z.coerce.number().int().positive().optional(),
  estado: z.enum(['REGISTRADO', 'ANULADO']).optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const createServicioRealizadoSchema = z.object({
  id_clienta: z.coerce.number().int().positive(),
  id_servicio: z.coerce.number().int().positive(),
  cantidad: z.coerce.number().int().min(1).default(1),
  idempotency_key: z.string().uuid(),
  observaciones: z.string().trim().max(500).optional().nullable(),
  realizado_en: z.string().datetime().optional(),
});

/** Atención = N líneas en servicios_realizados (sin tabla cabecera). */
export const createAtencionSchema = z
  .object({
    id_clienta: z.coerce.number().int().positive(),
    idempotency_key: z.string().uuid(),
    items: z
      .array(
        z.object({
          id_servicio: z.coerce.number().int().positive(),
          cantidad: z.coerce.number().int().min(1).default(1),
        }),
      )
      .min(1)
      .max(30),
    observaciones: z.string().trim().max(400).optional().nullable(),
    realizado_en: z.string().datetime().optional(),
  })
  .superRefine((value, ctx) => {
    const seen = new Set<number>();
    for (const item of value.items) {
      if (seen.has(item.id_servicio)) {
        ctx.addIssue({
          code: 'custom',
          path: ['items'],
          message:
            'No se permiten servicios duplicados en la misma atención. Usá un solo ítem por servicio.',
        });
        return;
      }
      seen.add(item.id_servicio);
    }
  });
