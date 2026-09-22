import type { FastifyInstance } from 'fastify';
import type { Prisma } from '../../generated/prisma/client';
import { AppError } from '../../shared/errors/app-error';
import { writeAuditoria } from '../../shared/services/auditoria.service';
import { newOpaqueToken, toNumberId } from '../../shared/utils/ids';
import { paginationMeta, skipTake } from '../../shared/utils/pagination';
import type { z } from 'zod';
import type { createSesionSchema, listSesionesQuerySchema } from './sesiones-clientas.schemas';

type ListQuery = z.infer<typeof listSesionesQuerySchema>;
type CreateInput = z.infer<typeof createSesionSchema>;

function toPublic(row: {
  id_sesion: bigint;
  id_clienta: bigint;
  expira_en: Date;
  revocada_en: Date | null;
  creado_en: Date;
}) {
  return {
    id_sesion: toNumberId(row.id_sesion),
    id_clienta: toNumberId(row.id_clienta),
    expira_en: row.expira_en.toISOString(),
    revocada_en: row.revocada_en?.toISOString() ?? null,
    creado_en: row.creado_en.toISOString(),
    vigente:
      !row.revocada_en && row.expira_en.getTime() > Date.now(),
  };
}

export class SesionesClientasService {
  constructor(private readonly app: FastifyInstance) {}

  async listByClienta(idClienta: bigint, query: ListQuery) {
    const exists = await this.app.prisma.clientas.findUnique({
      where: { id_clienta: idClienta },
      select: { id_clienta: true },
    });
    if (!exists) throw new AppError(404, 'Clienta no encontrada');

    const where: Prisma.sesiones_clientasWhereInput = { id_clienta: idClienta };
    if (query.activas === true) {
      where.revocada_en = null;
      where.expira_en = { gt: new Date() };
    } else if (query.activas === false) {
      where.OR = [{ revocada_en: { not: null } }, { expira_en: { lte: new Date() } }];
    }

    const { skip, take } = skipTake(query.page, query.limit);
    const [total, rows] = await this.app.prisma.$transaction([
      this.app.prisma.sesiones_clientas.count({ where }),
      this.app.prisma.sesiones_clientas.findMany({
        where,
        orderBy: { creado_en: 'desc' },
        skip,
        take,
      }),
    ]);
    return { items: rows.map(toPublic), meta: paginationMeta(total, query.page, query.limit) };
  }

  async create(input: CreateInput, adminId: bigint) {
    const clienta = await this.app.prisma.clientas.findUnique({
      where: { id_clienta: BigInt(input.id_clienta) },
    });
    if (!clienta) throw new AppError(404, 'Clienta no encontrada');
    if (clienta.estado !== 'ACTIVA') throw new AppError(409, 'La clienta no está activa');

    const credencial = await this.app.prisma.credenciales_clientas.findUnique({
      where: { id_clienta: clienta.id_clienta },
    });
    if (!credencial || credencial.estado !== 'ACTIVA') {
      throw new AppError(409, 'La clienta no tiene credenciales activas');
    }

    const { token, tokenHash } = newOpaqueToken();
    const expira = new Date(Date.now() + input.ttl_minutos * 60_000);

    const created = await this.app.prisma.sesiones_clientas.create({
      data: {
        id_clienta: clienta.id_clienta,
        token_hash: tokenHash,
        expira_en: expira,
      },
    });

    const publicRow = toPublic(created);
    await writeAuditoria(this.app, {
      idUsuarioAdmin: adminId,
      accion: 'sesiones.crear',
      tablaAfectada: 'sesiones_clientas',
      registroId: created.id_sesion,
      datosNuevos: publicRow,
    });

    return { sesion: publicRow, token };
  }

  async revoke(idSesion: bigint, adminId: bigint) {
    const current = await this.app.prisma.sesiones_clientas.findUnique({
      where: { id_sesion: idSesion },
    });
    if (!current) throw new AppError(404, 'Sesión no encontrada');
    if (current.revocada_en) throw new AppError(409, 'La sesión ya está revocada');

    const updated = await this.app.prisma.sesiones_clientas.update({
      where: { id_sesion: idSesion },
      data: { revocada_en: new Date() },
    });
    const publicRow = toPublic(updated);
    await writeAuditoria(this.app, {
      idUsuarioAdmin: adminId,
      accion: 'sesiones.revocar',
      tablaAfectada: 'sesiones_clientas',
      registroId: idSesion,
      datosNuevos: publicRow,
    });
    return publicRow;
  }

  async revokeAllByClienta(idClienta: bigint, adminId: bigint) {
    const exists = await this.app.prisma.clientas.findUnique({
      where: { id_clienta: idClienta },
      select: { id_clienta: true },
    });
    if (!exists) throw new AppError(404, 'Clienta no encontrada');

    const result = await this.app.prisma.sesiones_clientas.updateMany({
      where: { id_clienta: idClienta, revocada_en: null },
      data: { revocada_en: new Date() },
    });

    await writeAuditoria(this.app, {
      idUsuarioAdmin: adminId,
      accion: 'sesiones.revocar_todas',
      tablaAfectada: 'sesiones_clientas',
      registroId: idClienta,
      datosNuevos: { revocadas: result.count },
    });

    return { revocadas: result.count };
  }
}
