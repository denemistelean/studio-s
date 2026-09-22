import type { FastifyInstance } from 'fastify';
import type { Prisma } from '../../generated/prisma/client';
import { toNumberId } from '../../shared/utils/ids';
import { paginationMeta, skipTake } from '../../shared/utils/pagination';
import type { z } from 'zod';
import type { listAuditoriaQuerySchema } from './auditoria.schemas';

type ListQuery = z.infer<typeof listAuditoriaQuerySchema>;

function parseJsonSafe(value: string | null): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export class AuditoriaService {
  constructor(private readonly app: FastifyInstance) {}

  async list(query: ListQuery) {
    const where: Prisma.auditoriaWhereInput = {};
    if (query.accion) where.accion = { contains: query.accion };
    if (query.tabla_afectada) where.tabla_afectada = query.tabla_afectada;
    if (query.id_usuario_admin) where.id_usuario_admin = BigInt(query.id_usuario_admin);

    const { skip, take } = skipTake(query.page, query.limit);
    const [total, rows] = await this.app.prisma.$transaction([
      this.app.prisma.auditoria.count({ where }),
      this.app.prisma.auditoria.findMany({
        where,
        orderBy: { creado_en: query.order },
        skip,
        take,
      }),
    ]);

    return {
      items: rows.map((row) => ({
        id_auditoria: toNumberId(row.id_auditoria),
        id_usuario_admin: row.id_usuario_admin ? toNumberId(row.id_usuario_admin) : null,
        accion: row.accion,
        tabla_afectada: row.tabla_afectada,
        registro_id: row.registro_id ? toNumberId(row.registro_id) : null,
        datos_anteriores: parseJsonSafe(row.datos_anteriores),
        datos_nuevos: parseJsonSafe(row.datos_nuevos),
        ip_address: row.ip_address,
        user_agent: row.user_agent,
        creado_en: row.creado_en.toISOString(),
      })),
      meta: paginationMeta(total, query.page, query.limit),
    };
  }
}
