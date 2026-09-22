import { z } from 'zod';
import { AppError } from '../errors/app-error';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(150).optional(),
  sort: z.enum(['creadoEn', 'actualizadoEn', 'email', 'nombres', 'apellidos']).default('creadoEn'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export function parsePagination(query: unknown): PaginationQuery {
  const parsed = paginationQuerySchema.safeParse(query);
  if (!parsed.success) {
    throw new AppError(400, 'Parámetros de paginación no válidos', parsed.error.issues);
  }
  return parsed.data;
}

export function paginationMeta(total: number, page: number, limit: number) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

export function skipTake(page: number, limit: number) {
  return { skip: (page - 1) * limit, take: limit };
}
