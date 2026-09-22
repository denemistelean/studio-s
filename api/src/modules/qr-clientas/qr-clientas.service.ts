import type { FastifyInstance } from 'fastify';
import type { Prisma } from '../../generated/prisma/client';
import { AppError } from '../../shared/errors/app-error';
import { writeAuditoria } from '../../shared/services/auditoria.service';
import { newOpaqueToken, sha256Hex, toNumberId } from '../../shared/utils/ids';
import { paginationMeta, skipTake } from '../../shared/utils/pagination';
import type { z } from 'zod';
import type { generateQrSchema, listQrQuerySchema, validateQrSchema } from './qr-clientas.schemas';

type ListQuery = z.infer<typeof listQrQuerySchema>;
type GenerateInput = z.infer<typeof generateQrSchema>;
type ValidateInput = z.infer<typeof validateQrSchema>;

const QR_PREFIX = 'studios:qr:';

export function buildQrPayload(token: string): string {
  return `${QR_PREFIX}${token}`;
}

/** Acepta token crudo o payload `studios:qr:<token>`. */
export function normalizeQrToken(raw: string): string {
  const value = raw.trim();
  if (value.startsWith(QR_PREFIX)) {
    return value.slice(QR_PREFIX.length).trim();
  }
  return value;
}

function toPublic(row: {
  id_qr: bigint;
  id_clienta: bigint;
  activo: boolean;
  expira_en: Date | null;
  ultimo_uso_en: Date | null;
  creado_en: Date;
  revocado_en: Date | null;
}) {
  return {
    id_qr: toNumberId(row.id_qr),
    id_clienta: toNumberId(row.id_clienta),
    activo: row.activo,
    expira_en: row.expira_en?.toISOString() ?? null,
    ultimo_uso_en: row.ultimo_uso_en?.toISOString() ?? null,
    creado_en: row.creado_en.toISOString(),
    revocado_en: row.revocado_en?.toISOString() ?? null,
  };
}

export class QrClientasService {
  constructor(private readonly app: FastifyInstance) {}

  async listByClienta(idClienta: bigint, query: ListQuery) {
    const exists = await this.app.prisma.clientas.findUnique({
      where: { id_clienta: idClienta },
      select: { id_clienta: true },
    });
    if (!exists) throw new AppError(404, 'Clienta no encontrada');

    const where: Prisma.qr_clientasWhereInput = { id_clienta: idClienta };
    if (query.activo !== undefined) where.activo = query.activo;
    const { skip, take } = skipTake(query.page, query.limit);
    const [total, rows] = await this.app.prisma.$transaction([
      this.app.prisma.qr_clientas.count({ where }),
      this.app.prisma.qr_clientas.findMany({
        where,
        orderBy: { creado_en: 'desc' },
        skip,
        take,
      }),
    ]);
    return { items: rows.map(toPublic), meta: paginationMeta(total, query.page, query.limit) };
  }

  /**
   * Genera token opaco; solo se guarda SHA-256 en `token_hash`.
   * El payload del QR no incluye datos personales.
   */
  async generate(input: GenerateInput, adminId: bigint | null) {
    const clienta = await this.app.prisma.clientas.findUnique({
      where: { id_clienta: BigInt(input.id_clienta) },
    });
    if (!clienta) throw new AppError(404, 'Clienta no encontrada');
    if (clienta.estado !== 'ACTIVA') throw new AppError(409, 'La clienta no está activa');

    const { token, tokenHash } = newOpaqueToken();

    const created = await this.app.prisma.$transaction(async (tx) => {
      if (input.revocar_anteriores) {
        await tx.qr_clientas.updateMany({
          where: { id_clienta: clienta.id_clienta, activo: true },
          data: { activo: false, revocado_en: new Date() },
        });
      }
      return tx.qr_clientas.create({
        data: {
          id_clienta: clienta.id_clienta,
          token_hash: tokenHash,
          activo: true,
          expira_en: input.expira_en ?? null,
        },
      });
    });

    const publicRow = toPublic(created);
    await writeAuditoria(this.app, {
      idUsuarioAdmin: adminId,
      accion: 'qr.generar',
      tablaAfectada: 'qr_clientas',
      registroId: created.id_qr,
      datosNuevos: publicRow,
    });

    return {
      qr: publicRow,
      /** Token en claro solo en esta respuesta; no se vuelve a exponer. */
      token,
      /** Payload sugerido para el código QR (sin PII). */
      qr_payload: buildQrPayload(token),
    };
  }

  /** La clienta solicita su propio QR (rota el anterior). */
  async ensureForSelf(idClienta: bigint) {
    return this.generate(
      {
        id_clienta: toNumberId(idClienta),
        expira_en: null,
        revocar_anteriores: true,
      },
      null,
    );
  }

  async validate(input: ValidateInput) {
    const token = normalizeQrToken(input.token);
    const hash = sha256Hex(token);
    const row = await this.app.prisma.qr_clientas.findUnique({
      where: { token_hash: hash },
      include: {
        clientas: {
          select: {
            id_clienta: true,
            public_id: true,
            nombres: true,
            apellidos: true,
            telefono: true,
            estado: true,
            puntos_saldo: true,
          },
        },
      },
    });
    if (!row) throw new AppError(404, 'QR no válido');
    if (!row.activo || row.revocado_en) throw new AppError(409, 'QR revocado o inactivo');
    if (row.expira_en && row.expira_en.getTime() < Date.now()) {
      throw new AppError(409, 'QR expirado');
    }
    if (row.clientas.estado !== 'ACTIVA') {
      throw new AppError(409, 'La clienta asociada no está activa');
    }

    await this.app.prisma.qr_clientas.update({
      where: { id_qr: row.id_qr },
      data: { ultimo_uso_en: new Date() },
    });

    return {
      qr: toPublic(row),
      clienta: {
        id_clienta: toNumberId(row.clientas.id_clienta),
        public_id: row.clientas.public_id,
        nombres: row.clientas.nombres,
        apellidos: row.clientas.apellidos,
        telefono: row.clientas.telefono,
        estado: row.clientas.estado,
        puntos_saldo: row.clientas.puntos_saldo,
      },
    };
  }

  async revoke(idQr: bigint, adminId: bigint) {
    const current = await this.app.prisma.qr_clientas.findUnique({ where: { id_qr: idQr } });
    if (!current) throw new AppError(404, 'QR no encontrado');
    if (!current.activo) throw new AppError(409, 'El QR ya está inactivo');
    const updated = await this.app.prisma.qr_clientas.update({
      where: { id_qr: idQr },
      data: { activo: false, revocado_en: new Date() },
    });
    const publicRow = toPublic(updated);
    await writeAuditoria(this.app, {
      idUsuarioAdmin: adminId,
      accion: 'qr.revocar',
      tablaAfectada: 'qr_clientas',
      registroId: idQr,
      datosNuevos: publicRow,
    });
    return publicRow;
  }
}
