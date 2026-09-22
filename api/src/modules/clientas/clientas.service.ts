import type { FastifyInstance } from 'fastify';
import type { Prisma } from '../../generated/prisma/client';
import { AppError } from '../../shared/errors/app-error';
import { writeAuditoria } from '../../shared/services/auditoria.service';
import { newUuid, toNumberId } from '../../shared/utils/ids';
import { paginationMeta, skipTake } from '../../shared/utils/pagination';
import type { z } from 'zod';
import type {
  createClientaSchema,
  listClientasQuerySchema,
  updateClientaEstadoSchema,
  updateClientaSchema,
} from './clientas.schemas';

type ListQuery = z.infer<typeof listClientasQuerySchema>;
type CreateInput = z.infer<typeof createClientaSchema>;
type UpdateInput = z.infer<typeof updateClientaSchema>;
type EstadoInput = z.infer<typeof updateClientaEstadoSchema>;

function toPublic(row: {
  id_clienta: bigint;
  public_id: string;
  nombres: string;
  apellidos: string;
  telefono: string | null;
  fecha_nacimiento: Date | null;
  puntos_saldo: number;
  estado: 'ACTIVA' | 'INACTIVA' | 'BLOQUEADA';
  creado_en: Date;
  actualizado_en: Date;
}) {
  return {
    id_clienta: toNumberId(row.id_clienta),
    public_id: row.public_id,
    nombres: row.nombres,
    apellidos: row.apellidos,
    telefono: row.telefono,
    fecha_nacimiento: row.fecha_nacimiento
      ? row.fecha_nacimiento.toISOString().slice(0, 10)
      : null,
    puntos_saldo: row.puntos_saldo,
    estado: row.estado,
    creado_en: row.creado_en.toISOString(),
    actualizado_en: row.actualizado_en.toISOString(),
  };
}

export class ClientasService {
  constructor(private readonly app: FastifyInstance) {}

  async list(query: ListQuery) {
    const where: Prisma.clientasWhereInput = {};
    if (query.estado) where.estado = query.estado;
    if (query.q) {
      where.OR = [
        { nombres: { contains: query.q } },
        { apellidos: { contains: query.q } },
        { telefono: { contains: query.q } },
        { public_id: { contains: query.q } },
      ];
    }

    const { skip, take } = skipTake(query.page, query.limit);
    const orderBy = { [query.sort]: query.order } as Prisma.clientasOrderByWithRelationInput;

    const [total, rows] = await this.app.prisma.$transaction([
      this.app.prisma.clientas.count({ where }),
      this.app.prisma.clientas.findMany({ where, orderBy, skip, take }),
    ]);

    return { items: rows.map(toPublic), meta: paginationMeta(total, query.page, query.limit) };
  }

  async getById(id: bigint) {
    const row = await this.app.prisma.clientas.findUnique({ where: { id_clienta: id } });
    if (!row) throw new AppError(404, 'Clienta no encontrada');
    return toPublic(row);
  }

  async create(input: CreateInput, adminId: bigint, meta?: { ip?: string; ua?: string }) {
    const created = await this.app.prisma.clientas.create({
      data: {
        public_id: newUuid(),
        nombres: input.nombres,
        apellidos: input.apellidos,
        telefono: input.telefono ?? null,
        fecha_nacimiento: input.fecha_nacimiento ? new Date(input.fecha_nacimiento) : null,
        estado: input.estado,
        puntos_saldo: 0,
      },
    });

    await writeAuditoria(this.app, {
      idUsuarioAdmin: adminId,
      accion: 'clientas.crear',
      tablaAfectada: 'clientas',
      registroId: created.id_clienta,
      datosNuevos: toPublic(created),
      ipAddress: meta?.ip,
      userAgent: meta?.ua,
    });

    return toPublic(created);
  }

  async update(id: bigint, input: UpdateInput, adminId: bigint, meta?: { ip?: string; ua?: string }) {
    const current = await this.app.prisma.clientas.findUnique({ where: { id_clienta: id } });
    if (!current) throw new AppError(404, 'Clienta no encontrada');

    const updated = await this.app.prisma.clientas.update({
      where: { id_clienta: id },
      data: {
        ...(input.nombres !== undefined ? { nombres: input.nombres } : {}),
        ...(input.apellidos !== undefined ? { apellidos: input.apellidos } : {}),
        ...(input.telefono !== undefined ? { telefono: input.telefono } : {}),
        ...(input.fecha_nacimiento !== undefined
          ? { fecha_nacimiento: input.fecha_nacimiento ? new Date(input.fecha_nacimiento) : null }
          : {}),
        actualizado_en: new Date(),
      },
    });

    await writeAuditoria(this.app, {
      idUsuarioAdmin: adminId,
      accion: 'clientas.editar',
      tablaAfectada: 'clientas',
      registroId: id,
      datosAnteriores: toPublic(current),
      datosNuevos: toPublic(updated),
      ipAddress: meta?.ip,
      userAgent: meta?.ua,
    });

    return toPublic(updated);
  }

  async updateEstado(
    id: bigint,
    input: EstadoInput,
    adminId: bigint,
    meta?: { ip?: string; ua?: string },
  ) {
    const current = await this.app.prisma.clientas.findUnique({ where: { id_clienta: id } });
    if (!current) throw new AppError(404, 'Clienta no encontrada');
    if (current.estado === input.estado) {
      throw new AppError(409, 'La clienta ya tiene ese estado');
    }

    const updated = await this.app.prisma.clientas.update({
      where: { id_clienta: id },
      data: { estado: input.estado, actualizado_en: new Date() },
    });

    await writeAuditoria(this.app, {
      idUsuarioAdmin: adminId,
      accion: 'clientas.estado',
      tablaAfectada: 'clientas',
      registroId: id,
      datosAnteriores: { estado: current.estado },
      datosNuevos: { estado: updated.estado },
      ipAddress: meta?.ip,
      userAgent: meta?.ua,
    });

    return toPublic(updated);
  }
}
