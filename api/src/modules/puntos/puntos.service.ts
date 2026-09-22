import type { FastifyInstance } from 'fastify';
import type { Prisma } from '../../generated/prisma/client';
import { AppError } from '../../shared/errors/app-error';
import { writeAuditoria } from '../../shared/services/auditoria.service';
import { toNumberId } from '../../shared/utils/ids';
import { paginationMeta, skipTake } from '../../shared/utils/pagination';
import type { z } from 'zod';
import type { ajustarPuntosSchema, listMovimientosQuerySchema } from './puntos.schemas';

type ListQuery = z.infer<typeof listMovimientosQuerySchema>;
type AjusteInput = z.infer<typeof ajustarPuntosSchema>;

function toMovimiento(row: {
  id_movimiento: bigint;
  id_clienta: bigint;
  id_servicio_realizado: bigint | null;
  id_canje: bigint | null;
  id_usuario_admin: bigint | null;
  tipo: string;
  puntos: number;
  saldo_anterior: number;
  saldo_posterior: number;
  descripcion: string | null;
  creado_en: Date;
}) {
  return {
    id_movimiento: toNumberId(row.id_movimiento),
    id_clienta: toNumberId(row.id_clienta),
    id_servicio_realizado: row.id_servicio_realizado
      ? toNumberId(row.id_servicio_realizado)
      : null,
    id_canje: row.id_canje ? toNumberId(row.id_canje) : null,
    id_usuario_admin: row.id_usuario_admin ? toNumberId(row.id_usuario_admin) : null,
    tipo: row.tipo,
    puntos: row.puntos,
    saldo_anterior: row.saldo_anterior,
    saldo_posterior: row.saldo_posterior,
    descripcion: row.descripcion,
    creado_en: row.creado_en.toISOString(),
  };
}

export class PuntosService {
  constructor(private readonly app: FastifyInstance) {}

  async saldo(idClienta: bigint) {
    const clienta = await this.app.prisma.clientas.findUnique({
      where: { id_clienta: idClienta },
      select: { id_clienta: true, puntos_saldo: true, estado: true, nombres: true, apellidos: true },
    });
    if (!clienta) throw new AppError(404, 'Clienta no encontrada');
    return {
      id_clienta: toNumberId(clienta.id_clienta),
      nombres: clienta.nombres,
      apellidos: clienta.apellidos,
      estado: clienta.estado,
      puntos_saldo: clienta.puntos_saldo,
    };
  }

  async historial(idClienta: bigint, query: ListQuery) {
    const exists = await this.app.prisma.clientas.findUnique({
      where: { id_clienta: idClienta },
      select: { id_clienta: true },
    });
    if (!exists) throw new AppError(404, 'Clienta no encontrada');

    const where: Prisma.movimientos_puntosWhereInput = { id_clienta: idClienta };
    if (query.tipo) where.tipo = query.tipo;
    const { skip, take } = skipTake(query.page, query.limit);
    const [total, rows] = await this.app.prisma.$transaction([
      this.app.prisma.movimientos_puntos.count({ where }),
      this.app.prisma.movimientos_puntos.findMany({
        where,
        orderBy: { creado_en: query.order },
        skip,
        take,
      }),
    ]);
    return { items: rows.map(toMovimiento), meta: paginationMeta(total, query.page, query.limit) };
  }

  async list(query: ListQuery & { id_clienta?: number }) {
    const where: Prisma.movimientos_puntosWhereInput = {};
    if (query.tipo) where.tipo = query.tipo;
    if (query.id_clienta) where.id_clienta = BigInt(query.id_clienta);
    const { skip, take } = skipTake(query.page, query.limit);
    const [total, rows] = await this.app.prisma.$transaction([
      this.app.prisma.movimientos_puntos.count({ where }),
      this.app.prisma.movimientos_puntos.findMany({
        where,
        orderBy: { creado_en: query.order },
        skip,
        take,
      }),
    ]);
    return { items: rows.map(toMovimiento), meta: paginationMeta(total, query.page, query.limit) };
  }

  /**
   * Ajuste manual de puntos (AJUSTE_POSITIVO / AJUSTE_NEGATIVO).
   * Actualiza `clientas.puntos_saldo` y crea fila en `movimientos_puntos`.
   */
  async ajustar(input: AjusteInput, adminId: bigint) {
    const idClienta = BigInt(input.id_clienta);

    return this.app.prisma.$transaction(async (tx) => {
      const clienta = await tx.clientas.findUnique({ where: { id_clienta: idClienta } });
      if (!clienta) throw new AppError(404, 'Clienta no encontrada');
      if (clienta.estado !== 'ACTIVA') {
        throw new AppError(409, 'La clienta no está activa');
      }

      const delta = input.tipo === 'AJUSTE_POSITIVO' ? input.puntos : -input.puntos;
      const saldoAnterior = clienta.puntos_saldo;
      const saldoPosterior = saldoAnterior + delta;
      if (saldoPosterior < 0) {
        throw new AppError(409, 'Saldo insuficiente para el ajuste');
      }

      await tx.clientas.update({
        where: { id_clienta: idClienta },
        data: { puntos_saldo: saldoPosterior, actualizado_en: new Date() },
      });

      const movimiento = await tx.movimientos_puntos.create({
        data: {
          id_clienta: idClienta,
          id_usuario_admin: adminId,
          tipo: input.tipo,
          puntos: delta,
          saldo_anterior: saldoAnterior,
          saldo_posterior: saldoPosterior,
          descripcion: input.descripcion ?? null,
        },
      });

      return toMovimiento(movimiento);
    }).then(async (movimiento) => {
      await writeAuditoria(this.app, {
        idUsuarioAdmin: adminId,
        accion: 'puntos.ajustar',
        tablaAfectada: 'movimientos_puntos',
        registroId: BigInt(movimiento.id_movimiento),
        datosNuevos: movimiento,
      });
      return movimiento;
    });
  }
}
