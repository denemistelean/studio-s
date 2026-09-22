import bcrypt from 'bcryptjs';
import type { FastifyInstance } from 'fastify';
import { AppError } from '../../shared/errors/app-error';
import { writeAuditoria } from '../../shared/services/auditoria.service';
import { toNumberId } from '../../shared/utils/ids';
import type { z } from 'zod';
import type {
  updateCredencialEstadoSchema,
  updateCredencialPasswordSchema,
  upsertCredencialSchema,
} from './credenciales-clientas.schemas';

type UpsertInput = z.infer<typeof upsertCredencialSchema>;
type EstadoInput = z.infer<typeof updateCredencialEstadoSchema>;
type PasswordInput = z.infer<typeof updateCredencialPasswordSchema>;

function toPublic(row: {
  id_credencial: bigint;
  id_clienta: bigint;
  email: string;
  email_verificado_en: Date | null;
  ultimo_acceso_en: Date | null;
  estado: 'ACTIVA' | 'INACTIVA';
  creado_en: Date;
  actualizado_en: Date;
}) {
  return {
    id_credencial: toNumberId(row.id_credencial),
    id_clienta: toNumberId(row.id_clienta),
    email: row.email,
    email_verificado_en: row.email_verificado_en?.toISOString() ?? null,
    ultimo_acceso_en: row.ultimo_acceso_en?.toISOString() ?? null,
    estado: row.estado,
    creado_en: row.creado_en.toISOString(),
    actualizado_en: row.actualizado_en.toISOString(),
  };
}

export class CredencialesClientasService {
  constructor(private readonly app: FastifyInstance) {}

  async getByClienta(idClienta: bigint) {
    const clienta = await this.app.prisma.clientas.findUnique({
      where: { id_clienta: idClienta },
      select: { id_clienta: true },
    });
    if (!clienta) throw new AppError(404, 'Clienta no encontrada');

    const row = await this.app.prisma.credenciales_clientas.findUnique({
      where: { id_clienta: idClienta },
    });
    if (!row) throw new AppError(404, 'Credenciales no encontradas');
    return toPublic(row);
  }

  async upsert(idClienta: bigint, input: UpsertInput, adminId: bigint) {
    const clienta = await this.app.prisma.clientas.findUnique({
      where: { id_clienta: idClienta },
    });
    if (!clienta) throw new AppError(404, 'Clienta no encontrada');

    const emailTaken = await this.app.prisma.credenciales_clientas.findFirst({
      where: {
        email: input.email,
        NOT: { id_clienta: idClienta },
      },
      select: { id_credencial: true },
    });
    if (emailTaken) throw new AppError(409, 'El email ya está en uso');

    const passwordHash = await bcrypt.hash(input.password, 12);
    const existing = await this.app.prisma.credenciales_clientas.findUnique({
      where: { id_clienta: idClienta },
    });

    const row = existing
      ? await this.app.prisma.credenciales_clientas.update({
          where: { id_clienta: idClienta },
          data: {
            email: input.email,
            password_hash: passwordHash,
            estado: input.estado,
            actualizado_en: new Date(),
          },
        })
      : await this.app.prisma.credenciales_clientas.create({
          data: {
            id_clienta: idClienta,
            email: input.email,
            password_hash: passwordHash,
            estado: input.estado,
          },
        });

    const publicRow = toPublic(row);
    await writeAuditoria(this.app, {
      idUsuarioAdmin: adminId,
      accion: existing ? 'credenciales.actualizar' : 'credenciales.crear',
      tablaAfectada: 'credenciales_clientas',
      registroId: row.id_credencial,
      datosNuevos: publicRow,
    });
    return publicRow;
  }

  async updateEstado(idClienta: bigint, input: EstadoInput, adminId: bigint) {
    const current = await this.app.prisma.credenciales_clientas.findUnique({
      where: { id_clienta: idClienta },
    });
    if (!current) throw new AppError(404, 'Credenciales no encontradas');
    if (current.estado === input.estado) {
      throw new AppError(409, 'Las credenciales ya tienen ese estado');
    }
    const updated = await this.app.prisma.credenciales_clientas.update({
      where: { id_clienta: idClienta },
      data: { estado: input.estado, actualizado_en: new Date() },
    });
    const publicRow = toPublic(updated);
    await writeAuditoria(this.app, {
      idUsuarioAdmin: adminId,
      accion: 'credenciales.estado',
      tablaAfectada: 'credenciales_clientas',
      registroId: updated.id_credencial,
      datosAnteriores: { estado: current.estado },
      datosNuevos: { estado: updated.estado },
    });
    return publicRow;
  }

  async updatePassword(idClienta: bigint, input: PasswordInput, adminId: bigint) {
    const current = await this.app.prisma.credenciales_clientas.findUnique({
      where: { id_clienta: idClienta },
    });
    if (!current) throw new AppError(404, 'Credenciales no encontradas');
    const passwordHash = await bcrypt.hash(input.password, 12);
    const updated = await this.app.prisma.credenciales_clientas.update({
      where: { id_clienta: idClienta },
      data: { password_hash: passwordHash, actualizado_en: new Date() },
    });
    const publicRow = toPublic(updated);
    await writeAuditoria(this.app, {
      idUsuarioAdmin: adminId,
      accion: 'credenciales.password',
      tablaAfectada: 'credenciales_clientas',
      registroId: updated.id_credencial,
      datosNuevos: { id_credencial: publicRow.id_credencial, actualizado: true },
    });
    return publicRow;
  }
}
