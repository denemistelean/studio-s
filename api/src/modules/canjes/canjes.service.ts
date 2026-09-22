import type { FastifyInstance } from 'fastify';
import type { Prisma } from '../../generated/prisma/client';
import { AppError } from '../../shared/errors/app-error';
import { writeAuditoria } from '../../shared/services/auditoria.service';
import { newCodigoCanje, toNumberId } from '../../shared/utils/ids';
import { paginationMeta, skipTake } from '../../shared/utils/pagination';
import type { z } from 'zod';
import type { createCanjeSchema, listCanjesQuerySchema } from './canjes.schemas';

type ListQuery = z.infer<typeof listCanjesQuerySchema>;
type CreateInput = z.infer<typeof createCanjeSchema>;

function toPublic(row: {
  id_canje: bigint;
  id_clienta: bigint;
  id_recompensa: bigint;
  id_usuario_admin: bigint;
  puntos_utilizados: number;
  codigo_canje: string;
  estado: 'SOLICITADO' | 'ENTREGADO' | 'ANULADO';
  solicitado_en: Date;
  entregado_en: Date | null;
  observaciones: string | null;
}) {
  return {
    id_canje: toNumberId(row.id_canje),
    id_clienta: toNumberId(row.id_clienta),
    id_recompensa: toNumberId(row.id_recompensa),
    id_usuario_admin: toNumberId(row.id_usuario_admin),
    puntos_utilizados: row.puntos_utilizados,
    codigo_canje: row.codigo_canje,
    estado: row.estado,
    solicitado_en: row.solicitado_en.toISOString(),
    entregado_en: row.entregado_en?.toISOString() ?? null,
    observaciones: row.observaciones,
  };
}

export class CanjesService {
  constructor(private readonly app: FastifyInstance) {}

  async list(query: ListQuery) {
    const where: Prisma.canjes_recompensasWhereInput = {};
    if (query.id_clienta) where.id_clienta = BigInt(query.id_clienta);
    if (query.estado) where.estado = query.estado;
    const { skip, take } = skipTake(query.page, query.limit);
    const [total, rows] = await this.app.prisma.$transaction([
      this.app.prisma.canjes_recompensas.count({ where }),
      this.app.prisma.canjes_recompensas.findMany({
        where,
        orderBy: { solicitado_en: query.order },
        skip,
        take,
      }),
    ]);
    return { items: rows.map(toPublic), meta: paginationMeta(total, query.page, query.limit) };
  }

  async listByClienta(idClienta: bigint, query: ListQuery) {
    const exists = await this.app.prisma.clientas.findUnique({
      where: { id_clienta: idClienta },
      select: { id_clienta: true },
    });
    if (!exists) throw new AppError(404, 'Clienta no encontrada');
    return this.list({ ...query, id_clienta: Number(idClienta) });
  }

  async create(input: CreateInput, adminId: bigint) {
    const canje = await this.app.prisma.$transaction(async (tx) => {
      const clienta = await tx.clientas.findUnique({
        where: { id_clienta: BigInt(input.id_clienta) },
      });
      if (!clienta) throw new AppError(404, 'Clienta no encontrada');
      if (clienta.estado !== 'ACTIVA') throw new AppError(409, 'La clienta no está activa');

      const recompensa = await tx.recompensas.findUnique({
        where: { id_recompensa: BigInt(input.id_recompensa) },
      });
      if (!recompensa) throw new AppError(404, 'Recompensa no encontrada');
      if (recompensa.estado !== 'ACTIVA') throw new AppError(409, 'La recompensa no está activa');

      if (recompensa.limite_por_clienta !== null) {
        const previos = await tx.canjes_recompensas.count({
          where: {
            id_clienta: clienta.id_clienta,
            id_recompensa: recompensa.id_recompensa,
            estado: { in: ['SOLICITADO', 'ENTREGADO'] },
          },
        });
        if (previos >= recompensa.limite_por_clienta) {
          throw new AppError(409, 'Límite de canjes por clienta alcanzado');
        }
      }

      const puntos = recompensa.puntos_requeridos;

      /**
       * Decremento condicional: evita doble canje concurrente que deje
       * saldo inconsistente (read-check-write clásico).
       * No requiere columna nueva.
       */
      const saldoUpdate = await tx.clientas.updateMany({
        where: {
          id_clienta: clienta.id_clienta,
          estado: 'ACTIVA',
          puntos_saldo: { gte: puntos },
        },
        data: {
          puntos_saldo: { decrement: puntos },
          actualizado_en: new Date(),
        },
      });
      if (saldoUpdate.count !== 1) {
        throw new AppError(409, 'Puntos insuficientes');
      }

      if (recompensa.stock !== null) {
        const stockUpdate = await tx.recompensas.updateMany({
          where: {
            id_recompensa: recompensa.id_recompensa,
            estado: 'ACTIVA',
            stock: { gte: 1 },
          },
          data: {
            stock: { decrement: 1 },
            actualizado_en: new Date(),
          },
        });
        if (stockUpdate.count !== 1) {
          throw new AppError(409, 'Sin stock disponible');
        }
      }

      const clientaAfter = await tx.clientas.findUnique({
        where: { id_clienta: clienta.id_clienta },
        select: { puntos_saldo: true },
      });
      if (!clientaAfter) throw new AppError(404, 'Clienta no encontrada');
      const saldoPosterior = clientaAfter.puntos_saldo;
      const saldoAnterior = saldoPosterior + puntos;

      let codigo = newCodigoCanje();
      for (let i = 0; i < 5; i += 1) {
        const clash = await tx.canjes_recompensas.findUnique({
          where: { codigo_canje: codigo },
          select: { id_canje: true },
        });
        if (!clash) break;
        codigo = newCodigoCanje();
      }

      const created = await tx.canjes_recompensas.create({
        data: {
          id_clienta: clienta.id_clienta,
          id_recompensa: recompensa.id_recompensa,
          id_usuario_admin: adminId,
          puntos_utilizados: puntos,
          codigo_canje: codigo,
          estado: 'SOLICITADO',
          observaciones: input.observaciones ?? null,
        },
      });

      await tx.movimientos_puntos.create({
        data: {
          id_clienta: clienta.id_clienta,
          id_canje: created.id_canje,
          id_usuario_admin: adminId,
          tipo: 'CANJE',
          puntos: -puntos,
          saldo_anterior: saldoAnterior,
          saldo_posterior: saldoPosterior,
          descripcion: `Canje: ${recompensa.nombre}`,
        },
      });

      return created;
    });

    const publicRow = toPublic(canje);
    await writeAuditoria(this.app, {
      idUsuarioAdmin: adminId,
      accion: 'canjes.crear',
      tablaAfectada: 'canjes_recompensas',
      registroId: canje.id_canje,
      datosNuevos: publicRow,
    });
    return publicRow;
  }

  async entregar(id: bigint, adminId: bigint) {
    const updated = await this.app.prisma.$transaction(async (tx) => {
      const current = await tx.canjes_recompensas.findUnique({
        where: { id_canje: id },
      });
      if (!current) throw new AppError(404, 'Canje no encontrado');
      if (current.estado !== 'SOLICITADO') {
        throw new AppError(409, 'Solo se pueden entregar canjes en estado SOLICITADO');
      }

      const result = await tx.canjes_recompensas.updateMany({
        where: { id_canje: id, estado: 'SOLICITADO' },
        data: { estado: 'ENTREGADO', entregado_en: new Date() },
      });
      if (result.count !== 1) {
        throw new AppError(409, 'Solo se pueden entregar canjes en estado SOLICITADO');
      }

      return tx.canjes_recompensas.findUniqueOrThrow({ where: { id_canje: id } });
    });

    const publicRow = toPublic(updated);
    await writeAuditoria(this.app, {
      idUsuarioAdmin: adminId,
      accion: 'canjes.entregar',
      tablaAfectada: 'canjes_recompensas',
      registroId: id,
      datosNuevos: publicRow,
    });
    return publicRow;
  }

  async anular(id: bigint, adminId: bigint) {
    const updated = await this.app.prisma.$transaction(async (tx) => {
      const current = await tx.canjes_recompensas.findUnique({ where: { id_canje: id } });
      if (!current) throw new AppError(404, 'Canje no encontrado');
      if (current.estado === 'ANULADO') throw new AppError(409, 'El canje ya está anulado');
      if (current.estado === 'ENTREGADO') {
        throw new AppError(409, 'No se puede anular un canje ya entregado');
      }

      const clienta = await tx.clientas.findUnique({ where: { id_clienta: current.id_clienta } });
      if (!clienta) throw new AppError(404, 'Clienta no encontrada');

      const puntos = current.puntos_utilizados;
      const saldoAnterior = clienta.puntos_saldo;
      const saldoPosterior = saldoAnterior + puntos;

      const row = await tx.canjes_recompensas.update({
        where: { id_canje: id },
        data: { estado: 'ANULADO' },
      });

      await tx.clientas.update({
        where: { id_clienta: clienta.id_clienta },
        data: { puntos_saldo: saldoPosterior, actualizado_en: new Date() },
      });

      const recompensa = await tx.recompensas.findUnique({
        where: { id_recompensa: current.id_recompensa },
      });
      if (recompensa?.stock !== null && recompensa) {
        await tx.recompensas.update({
          where: { id_recompensa: recompensa.id_recompensa },
          data: { stock: recompensa.stock + 1, actualizado_en: new Date() },
        });
      }

      await tx.movimientos_puntos.create({
        data: {
          id_clienta: clienta.id_clienta,
          id_canje: id,
          id_usuario_admin: adminId,
          tipo: 'REVERSO',
          puntos,
          saldo_anterior: saldoAnterior,
          saldo_posterior: saldoPosterior,
          descripcion: 'Reverso por anulación de canje',
        },
      });

      return row;
    });

    const publicRow = toPublic(updated);
    await writeAuditoria(this.app, {
      idUsuarioAdmin: adminId,
      accion: 'canjes.anular',
      tablaAfectada: 'canjes_recompensas',
      registroId: id,
      datosNuevos: publicRow,
    });
    return publicRow;
  }
}
