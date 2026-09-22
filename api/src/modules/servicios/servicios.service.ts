import type { FastifyInstance } from 'fastify';
import type { Prisma } from '../../generated/prisma/client';
import { AppError } from '../../shared/errors/app-error';
import { writeAuditoria } from '../../shared/services/auditoria.service';
import { decimalToString, toNumberId } from '../../shared/utils/ids';
import { paginationMeta, skipTake } from '../../shared/utils/pagination';
import type { z } from 'zod';
import type {
  createServicioSchema,
  listServiciosQuerySchema,
  updateServicioEstadoSchema,
  updateServicioSchema,
} from './servicios.schemas';

type ListQuery = z.infer<typeof listServiciosQuerySchema>;
type CreateInput = z.infer<typeof createServicioSchema>;
type UpdateInput = z.infer<typeof updateServicioSchema>;
type EstadoInput = z.infer<typeof updateServicioEstadoSchema>;

function toPublic(row: {
  id_servicio: bigint;
  nombre: string;
  descripcion: string | null;
  precio: { toString(): string };
  puntos_otorgados: number;
  estado: 'ACTIVO' | 'INACTIVO';
  creado_en: Date;
  actualizado_en: Date;
}) {
  return {
    id_servicio: toNumberId(row.id_servicio),
    nombre: row.nombre,
    descripcion: row.descripcion,
    precio: decimalToString(row.precio),
    puntos_otorgados: row.puntos_otorgados,
    estado: row.estado,
    creado_en: row.creado_en.toISOString(),
    actualizado_en: row.actualizado_en.toISOString(),
  };
}

export class ServiciosService {
  constructor(private readonly app: FastifyInstance) {}

  async list(query: ListQuery) {
    const where: Prisma.serviciosWhereInput = {};
    if (query.estado) where.estado = query.estado;
    if (query.q) {
      where.OR = [{ nombre: { contains: query.q } }, { descripcion: { contains: query.q } }];
    }
    const { skip, take } = skipTake(query.page, query.limit);
    const orderBy = { [query.sort]: query.order } as Prisma.serviciosOrderByWithRelationInput;
    const [total, rows] = await this.app.prisma.$transaction([
      this.app.prisma.servicios.count({ where }),
      this.app.prisma.servicios.findMany({ where, orderBy, skip, take }),
    ]);
    return { items: rows.map(toPublic), meta: paginationMeta(total, query.page, query.limit) };
  }

  async getById(id: bigint) {
    const row = await this.app.prisma.servicios.findUnique({ where: { id_servicio: id } });
    if (!row) throw new AppError(404, 'Servicio no encontrado');
    return toPublic(row);
  }

  async create(input: CreateInput, adminId: bigint) {
    const created = await this.app.prisma.servicios.create({
      data: {
        nombre: input.nombre,
        descripcion: input.descripcion ?? null,
        precio: input.precio,
        puntos_otorgados: input.puntos_otorgados,
        estado: input.estado,
      },
    });
    await writeAuditoria(this.app, {
      idUsuarioAdmin: adminId,
      accion: 'servicios.crear',
      tablaAfectada: 'servicios',
      registroId: created.id_servicio,
      datosNuevos: toPublic(created),
    });
    return toPublic(created);
  }

  async update(id: bigint, input: UpdateInput, adminId: bigint) {
    const current = await this.app.prisma.servicios.findUnique({ where: { id_servicio: id } });
    if (!current) throw new AppError(404, 'Servicio no encontrado');
    const updated = await this.app.prisma.servicios.update({
      where: { id_servicio: id },
      data: {
        ...(input.nombre !== undefined ? { nombre: input.nombre } : {}),
        ...(input.descripcion !== undefined ? { descripcion: input.descripcion } : {}),
        ...(input.precio !== undefined ? { precio: input.precio } : {}),
        ...(input.puntos_otorgados !== undefined ? { puntos_otorgados: input.puntos_otorgados } : {}),
        actualizado_en: new Date(),
      },
    });
    await writeAuditoria(this.app, {
      idUsuarioAdmin: adminId,
      accion: 'servicios.editar',
      tablaAfectada: 'servicios',
      registroId: id,
      datosAnteriores: toPublic(current),
      datosNuevos: toPublic(updated),
    });
    return toPublic(updated);
  }

  async updateEstado(id: bigint, input: EstadoInput, adminId: bigint) {
    const current = await this.app.prisma.servicios.findUnique({ where: { id_servicio: id } });
    if (!current) throw new AppError(404, 'Servicio no encontrado');
    if (current.estado === input.estado) throw new AppError(409, 'El servicio ya tiene ese estado');
    const updated = await this.app.prisma.servicios.update({
      where: { id_servicio: id },
      data: { estado: input.estado, actualizado_en: new Date() },
    });
    await writeAuditoria(this.app, {
      idUsuarioAdmin: adminId,
      accion: 'servicios.estado',
      tablaAfectada: 'servicios',
      registroId: id,
      datosAnteriores: { estado: current.estado },
      datosNuevos: { estado: updated.estado },
    });
    return toPublic(updated);
  }
}
