import type { FastifyInstance } from 'fastify';
import type { Prisma } from '../../generated/prisma/client';
import { AppError } from '../../shared/errors/app-error';
import { writeAuditoria } from '../../shared/services/auditoria.service';
import { toNumberId } from '../../shared/utils/ids';
import { paginationMeta, skipTake } from '../../shared/utils/pagination';
import type { z } from 'zod';
import type {
  createRecompensaSchema,
  listRecompensasQuerySchema,
  updateRecompensaEstadoSchema,
  updateRecompensaSchema,
} from './recompensas.schemas';

type ListQuery = z.infer<typeof listRecompensasQuerySchema>;
type CreateInput = z.infer<typeof createRecompensaSchema>;
type UpdateInput = z.infer<typeof updateRecompensaSchema>;
type EstadoInput = z.infer<typeof updateRecompensaEstadoSchema>;

function toPublic(row: {
  id_recompensa: bigint;
  nombre: string;
  descripcion: string | null;
  puntos_requeridos: number;
  stock: number | null;
  limite_por_clienta: number | null;
  estado: 'ACTIVA' | 'INACTIVA';
  creado_en: Date;
  actualizado_en: Date;
}) {
  return {
    id_recompensa: toNumberId(row.id_recompensa),
    nombre: row.nombre,
    descripcion: row.descripcion,
    puntos_requeridos: row.puntos_requeridos,
    stock: row.stock,
    limite_por_clienta: row.limite_por_clienta,
    estado: row.estado,
    creado_en: row.creado_en.toISOString(),
    actualizado_en: row.actualizado_en.toISOString(),
  };
}

export class RecompensasService {
  constructor(private readonly app: FastifyInstance) {}

  async list(query: ListQuery) {
    const where: Prisma.recompensasWhereInput = {};
    if (query.estado) where.estado = query.estado;
    if (query.q) {
      where.OR = [{ nombre: { contains: query.q } }, { descripcion: { contains: query.q } }];
    }
    const { skip, take } = skipTake(query.page, query.limit);
    const orderBy = { [query.sort]: query.order } as Prisma.recompensasOrderByWithRelationInput;
    const [total, rows] = await this.app.prisma.$transaction([
      this.app.prisma.recompensas.count({ where }),
      this.app.prisma.recompensas.findMany({ where, orderBy, skip, take }),
    ]);
    return { items: rows.map(toPublic), meta: paginationMeta(total, query.page, query.limit) };
  }

  async getById(id: bigint) {
    const row = await this.app.prisma.recompensas.findUnique({ where: { id_recompensa: id } });
    if (!row) throw new AppError(404, 'Recompensa no encontrada');
    return toPublic(row);
  }

  async create(input: CreateInput, adminId: bigint) {
    const created = await this.app.prisma.recompensas.create({
      data: {
        nombre: input.nombre,
        descripcion: input.descripcion ?? null,
        puntos_requeridos: input.puntos_requeridos,
        stock: input.stock ?? null,
        limite_por_clienta: input.limite_por_clienta ?? null,
        estado: input.estado,
      },
    });
    await writeAuditoria(this.app, {
      idUsuarioAdmin: adminId,
      accion: 'recompensas.crear',
      tablaAfectada: 'recompensas',
      registroId: created.id_recompensa,
      datosNuevos: toPublic(created),
    });
    return toPublic(created);
  }

  async update(id: bigint, input: UpdateInput, adminId: bigint) {
    const current = await this.app.prisma.recompensas.findUnique({ where: { id_recompensa: id } });
    if (!current) throw new AppError(404, 'Recompensa no encontrada');
    const updated = await this.app.prisma.recompensas.update({
      where: { id_recompensa: id },
      data: {
        ...(input.nombre !== undefined ? { nombre: input.nombre } : {}),
        ...(input.descripcion !== undefined ? { descripcion: input.descripcion } : {}),
        ...(input.puntos_requeridos !== undefined
          ? { puntos_requeridos: input.puntos_requeridos }
          : {}),
        ...(input.stock !== undefined ? { stock: input.stock } : {}),
        ...(input.limite_por_clienta !== undefined
          ? { limite_por_clienta: input.limite_por_clienta }
          : {}),
        actualizado_en: new Date(),
      },
    });
    await writeAuditoria(this.app, {
      idUsuarioAdmin: adminId,
      accion: 'recompensas.editar',
      tablaAfectada: 'recompensas',
      registroId: id,
      datosAnteriores: toPublic(current),
      datosNuevos: toPublic(updated),
    });
    return toPublic(updated);
  }

  async updateEstado(id: bigint, input: EstadoInput, adminId: bigint) {
    const current = await this.app.prisma.recompensas.findUnique({ where: { id_recompensa: id } });
    if (!current) throw new AppError(404, 'Recompensa no encontrada');
    if (current.estado === input.estado) throw new AppError(409, 'La recompensa ya tiene ese estado');
    const updated = await this.app.prisma.recompensas.update({
      where: { id_recompensa: id },
      data: { estado: input.estado, actualizado_en: new Date() },
    });
    await writeAuditoria(this.app, {
      idUsuarioAdmin: adminId,
      accion: 'recompensas.estado',
      tablaAfectada: 'recompensas',
      registroId: id,
      datosAnteriores: { estado: current.estado },
      datosNuevos: { estado: updated.estado },
    });
    return toPublic(updated);
  }
}
