import type { FastifyInstance } from 'fastify';
import type { Prisma } from '../../generated/prisma/client';
import { AppError } from '../../shared/errors/app-error';
import { writeAuditoria } from '../../shared/services/auditoria.service';
import {
  attentionLineIdempotencyKey,
  attentionMarker,
  decimalToString,
  toNumberId,
} from '../../shared/utils/ids';
import { paginationMeta, skipTake } from '../../shared/utils/pagination';
import type { z } from 'zod';
import type {
  createAtencionSchema,
  createServicioRealizadoSchema,
  listServiciosRealizadosQuerySchema,
} from './servicios-realizados.schemas';

type ListQuery = z.infer<typeof listServiciosRealizadosQuerySchema>;
type CreateInput = z.infer<typeof createServicioRealizadoSchema>;
type AtencionInput = z.infer<typeof createAtencionSchema>;

function toPublic(row: {
  id_servicio_realizado: bigint;
  id_clienta: bigint;
  id_servicio: bigint;
  id_usuario_admin: bigint;
  cantidad: number;
  precio_unitario: { toString(): string };
  puntos_otorgados: number;
  idempotency_key: string;
  observaciones: string | null;
  estado: 'REGISTRADO' | 'ANULADO';
  realizado_en: Date;
  creado_en: Date;
}) {
  return {
    id_servicio_realizado: toNumberId(row.id_servicio_realizado),
    id_clienta: toNumberId(row.id_clienta),
    id_servicio: toNumberId(row.id_servicio),
    id_usuario_admin: toNumberId(row.id_usuario_admin),
    cantidad: row.cantidad,
    precio_unitario: decimalToString(row.precio_unitario),
    puntos_otorgados: row.puntos_otorgados,
    idempotency_key: row.idempotency_key,
    observaciones: row.observaciones,
    estado: row.estado,
    realizado_en: row.realizado_en.toISOString(),
    creado_en: row.creado_en.toISOString(),
  };
}

export class ServiciosRealizadosService {
  constructor(private readonly app: FastifyInstance) {}

  async list(query: ListQuery) {
    const where: Prisma.servicios_realizadosWhereInput = {};
    if (query.id_clienta) where.id_clienta = BigInt(query.id_clienta);
    if (query.id_servicio) where.id_servicio = BigInt(query.id_servicio);
    if (query.estado) where.estado = query.estado;
    const { skip, take } = skipTake(query.page, query.limit);
    const [total, rows] = await this.app.prisma.$transaction([
      this.app.prisma.servicios_realizados.count({ where }),
      this.app.prisma.servicios_realizados.findMany({
        where,
        orderBy: { realizado_en: query.order },
        skip,
        take,
      }),
    ]);
    return { items: rows.map(toPublic), meta: paginationMeta(total, query.page, query.limit) };
  }

  async getById(id: bigint) {
    const row = await this.app.prisma.servicios_realizados.findUnique({
      where: { id_servicio_realizado: id },
    });
    if (!row) throw new AppError(404, 'Servicio realizado no encontrado');
    return toPublic(row);
  }

  async create(input: CreateInput, adminId: bigint) {
    const existing = await this.app.prisma.servicios_realizados.findUnique({
      where: { idempotency_key: input.idempotency_key },
    });
    if (existing) {
      return { servicio_realizado: toPublic(existing), duplicated: true };
    }

    const result = await this.app.prisma.$transaction(async (tx) => {
      const clienta = await tx.clientas.findUnique({ where: { id_clienta: BigInt(input.id_clienta) } });
      if (!clienta) throw new AppError(404, 'Clienta no encontrada');
      if (clienta.estado !== 'ACTIVA') throw new AppError(409, 'La clienta no está activa');

      const servicio = await tx.servicios.findUnique({
        where: { id_servicio: BigInt(input.id_servicio) },
      });
      if (!servicio) throw new AppError(404, 'Servicio no encontrado');
      if (servicio.estado !== 'ACTIVO') throw new AppError(409, 'El servicio no está activo');

      const puntos = servicio.puntos_otorgados * input.cantidad;
      const saldoAnterior = clienta.puntos_saldo;
      const saldoPosterior = saldoAnterior + puntos;

      let created;
      try {
        created = await tx.servicios_realizados.create({
          data: {
            id_clienta: BigInt(input.id_clienta),
            id_servicio: BigInt(input.id_servicio),
            id_usuario_admin: adminId,
            cantidad: input.cantidad,
            precio_unitario: servicio.precio,
            puntos_otorgados: puntos,
            idempotency_key: input.idempotency_key,
            observaciones: input.observaciones ?? null,
            estado: 'REGISTRADO',
            realizado_en: input.realizado_en ? new Date(input.realizado_en) : new Date(),
          },
        });
      } catch (error) {
        // Carrera en idempotency_key único
        const again = await tx.servicios_realizados.findUnique({
          where: { idempotency_key: input.idempotency_key },
        });
        if (again) return { row: again, duplicated: true as const };
        throw error;
      }

      if (puntos > 0) {
        await tx.clientas.update({
          where: { id_clienta: clienta.id_clienta },
          data: { puntos_saldo: saldoPosterior, actualizado_en: new Date() },
        });
        await tx.movimientos_puntos.create({
          data: {
            id_clienta: clienta.id_clienta,
            id_servicio_realizado: created.id_servicio_realizado,
            id_usuario_admin: adminId,
            tipo: 'ACUMULACION',
            puntos,
            saldo_anterior: saldoAnterior,
            saldo_posterior: saldoPosterior,
            descripcion: `Servicio: ${servicio.nombre} x${input.cantidad}`,
          },
        });
      }

      return { row: created, duplicated: false as const };
    });

    const publicRow = toPublic(result.row);
    if (!result.duplicated) {
      await writeAuditoria(this.app, {
        idUsuarioAdmin: adminId,
        accion: 'servicios_realizados.crear',
        tablaAfectada: 'servicios_realizados',
        registroId: result.row.id_servicio_realizado,
        datosNuevos: publicRow,
      });
    }

    return { servicio_realizado: publicRow, duplicated: result.duplicated };
  }

  /**
   * Registra N servicios en una sola transacción (atención).
   * Sin tabla cabecera: agrupa por marcador en observaciones + keys deterministas.
   */
  async createAtencion(input: AtencionInput, adminId: bigint) {
    const marker = attentionMarker(input.idempotency_key);
    const lineKeys = input.items.map((item, index) =>
      attentionLineIdempotencyKey(input.idempotency_key, index, item.id_servicio),
    );

    const existingFirst = await this.app.prisma.servicios_realizados.findUnique({
      where: { idempotency_key: lineKeys[0]! },
    });
    if (existingFirst) {
      const rows = await this.app.prisma.servicios_realizados.findMany({
        where: {
          id_clienta: BigInt(input.id_clienta),
          observaciones: { startsWith: marker },
        },
        orderBy: { id_servicio_realizado: 'asc' },
      });
      const items = (rows.length > 0 ? rows : [existingFirst]).map(toPublic);
      const puntos_otorgados = items.reduce((acc, row) => acc + row.puntos_otorgados, 0);
      const clienta = await this.app.prisma.clientas.findUnique({
        where: { id_clienta: BigInt(input.id_clienta) },
        select: { puntos_saldo: true },
      });
      return {
        duplicated: true,
        servicios_realizados: items,
        resumen: {
          cantidad_servicios: items.length,
          puntos_otorgados,
          nuevo_saldo: clienta?.puntos_saldo ?? null,
        },
      };
    }

    const result = await this.app.prisma.$transaction(async (tx) => {
      const clienta = await tx.clientas.findUnique({
        where: { id_clienta: BigInt(input.id_clienta) },
      });
      if (!clienta) throw new AppError(404, 'Clienta no encontrada');
      if (clienta.estado !== 'ACTIVA') throw new AppError(409, 'La clienta no está activa');

      const realizadoEn = input.realizado_en ? new Date(input.realizado_en) : new Date();
      const noteTail = input.observaciones?.trim()
        ? ` ${input.observaciones.trim()}`
        : '';
      const obs = `${marker}${noteTail}`.slice(0, 500);

      let saldo = clienta.puntos_saldo;
      const createdRows: Array<Parameters<typeof toPublic>[0]> = [];
      let puntosTotales = 0;

      for (let i = 0; i < input.items.length; i += 1) {
        const item = input.items[i]!;
        const lineKey = lineKeys[i]!;

        const again = await tx.servicios_realizados.findUnique({
          where: { idempotency_key: lineKey },
        });
        if (again) {
          throw new AppError(409, 'Atención parcialmente registrada; reintente con nueva clave');
        }

        const servicio = await tx.servicios.findUnique({
          where: { id_servicio: BigInt(item.id_servicio) },
        });
        if (!servicio) throw new AppError(404, `Servicio no encontrado: ${item.id_servicio}`);
        if (servicio.estado !== 'ACTIVO') {
          throw new AppError(409, `El servicio no está activo: ${servicio.nombre}`);
        }

        const puntos = servicio.puntos_otorgados * item.cantidad;
        const created = await tx.servicios_realizados.create({
          data: {
            id_clienta: clienta.id_clienta,
            id_servicio: servicio.id_servicio,
            id_usuario_admin: adminId,
            cantidad: item.cantidad,
            precio_unitario: servicio.precio,
            puntos_otorgados: puntos,
            idempotency_key: lineKey,
            observaciones: obs,
            estado: 'REGISTRADO',
            realizado_en: realizadoEn,
          },
        });

        if (puntos > 0) {
          const saldoAnterior = saldo;
          saldo += puntos;
          puntosTotales += puntos;
          await tx.movimientos_puntos.create({
            data: {
              id_clienta: clienta.id_clienta,
              id_servicio_realizado: created.id_servicio_realizado,
              id_usuario_admin: adminId,
              tipo: 'ACUMULACION',
              puntos,
              saldo_anterior: saldoAnterior,
              saldo_posterior: saldo,
              descripcion: `Servicio: ${servicio.nombre} x${item.cantidad}`,
            },
          });
        }

        createdRows.push(created);
      }

      if (puntosTotales > 0) {
        await tx.clientas.update({
          where: { id_clienta: clienta.id_clienta },
          data: { puntos_saldo: saldo, actualizado_en: new Date() },
        });
      }

      return {
        rows: createdRows,
        puntos_otorgados: puntosTotales,
        nuevo_saldo: saldo,
      };
    });

    const items = result.rows.map(toPublic);
    await writeAuditoria(this.app, {
      idUsuarioAdmin: adminId,
      accion: 'servicios_realizados.atencion',
      tablaAfectada: 'servicios_realizados',
      registroId: result.rows[0]?.id_servicio_realizado ?? null,
      datosNuevos: {
        idempotency_key: input.idempotency_key,
        id_clienta: input.id_clienta,
        cantidad_servicios: items.length,
        puntos_otorgados: result.puntos_otorgados,
        ids: items.map((row) => row.id_servicio_realizado),
      },
    });

    return {
      duplicated: false,
      servicios_realizados: items,
      resumen: {
        cantidad_servicios: items.length,
        puntos_otorgados: result.puntos_otorgados,
        nuevo_saldo: result.nuevo_saldo,
      },
    };
  }

  async anular(id: bigint, adminId: bigint) {
    const result = await this.app.prisma.$transaction(async (tx) => {
      const current = await tx.servicios_realizados.findUnique({
        where: { id_servicio_realizado: id },
      });
      if (!current) throw new AppError(404, 'Servicio realizado no encontrado');
      if (current.estado === 'ANULADO') throw new AppError(409, 'El registro ya está anulado');

      const clienta = await tx.clientas.findUnique({ where: { id_clienta: current.id_clienta } });
      if (!clienta) throw new AppError(404, 'Clienta no encontrada');

      const puntos = current.puntos_otorgados;
      const saldoAnterior = clienta.puntos_saldo;
      const saldoPosterior = saldoAnterior - puntos;
      if (saldoPosterior < 0) {
        throw new AppError(409, 'No se puede anular: el saldo quedaría negativo');
      }

      const updated = await tx.servicios_realizados.update({
        where: { id_servicio_realizado: id },
        data: { estado: 'ANULADO' },
      });

      if (puntos > 0) {
        await tx.clientas.update({
          where: { id_clienta: clienta.id_clienta },
          data: { puntos_saldo: saldoPosterior, actualizado_en: new Date() },
        });
        await tx.movimientos_puntos.create({
          data: {
            id_clienta: clienta.id_clienta,
            id_servicio_realizado: id,
            id_usuario_admin: adminId,
            tipo: 'REVERSO',
            puntos: -puntos,
            saldo_anterior: saldoAnterior,
            saldo_posterior: saldoPosterior,
            descripcion: 'Reverso por anulación de servicio realizado',
          },
        });
      }

      return updated;
    });

    const publicRow = toPublic(result);
    await writeAuditoria(this.app, {
      idUsuarioAdmin: adminId,
      accion: 'servicios_realizados.anular',
      tablaAfectada: 'servicios_realizados',
      registroId: id,
      datosNuevos: publicRow,
    });
    return publicRow;
  }
}
