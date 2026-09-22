import bcrypt from 'bcryptjs';
import type { FastifyInstance } from 'fastify';
import { AppError } from '../../shared/errors/app-error';
import { writeAuditoria } from '../../shared/services/auditoria.service';
import { newOpaqueToken, newUuid, sha256Hex, toNumberId } from '../../shared/utils/ids';
import { paginationMeta, skipTake } from '../../shared/utils/pagination';
import type { z } from 'zod';
import type {
  loginClientaSchema,
  portalListQuerySchema,
  registroClientaSchema,
} from './auth-clienta.schemas';

type RegistroInput = z.infer<typeof registroClientaSchema>;
type LoginInput = z.infer<typeof loginClientaSchema>;
type ListQuery = z.infer<typeof portalListQuerySchema>;

const SESSION_TTL_MINUTES = 60 * 24 * 30;

function toClientaPublic(row: {
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

export class AuthClientaService {
  constructor(private readonly app: FastifyInstance) {}

  async registro(input: RegistroInput, meta?: { ip?: string; ua?: string }) {
    const email = input.email.toLowerCase();

    const emailTaken = await this.app.prisma.credenciales_clientas.findUnique({
      where: { email },
      select: { id_credencial: true },
    });
    if (emailTaken) {
      throw new AppError(409, 'El email ya está registrado');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const result = await this.app.prisma.$transaction(async (tx) => {
      const clienta = await tx.clientas.create({
        data: {
          public_id: newUuid(),
          nombres: input.nombres,
          apellidos: input.apellidos,
          telefono: input.telefono ?? null,
          fecha_nacimiento: input.fecha_nacimiento
            ? new Date(input.fecha_nacimiento)
            : null,
          estado: 'ACTIVA',
          puntos_saldo: 0,
        },
      });

      await tx.credenciales_clientas.create({
        data: {
          id_clienta: clienta.id_clienta,
          email,
          password_hash: passwordHash,
          estado: 'ACTIVA',
        },
      });

      return clienta;
    });

    await writeAuditoria(this.app, {
      idUsuarioAdmin: null,
      accion: 'clienta.registro',
      tablaAfectada: 'clientas',
      registroId: result.id_clienta,
      datosNuevos: {
        id_clienta: toNumberId(result.id_clienta),
        email,
      },
      ipAddress: meta?.ip,
      userAgent: meta?.ua,
    });

    return {
      clienta: toClientaPublic(result),
      email,
    };
  }

  async login(input: LoginInput, meta?: { ip?: string; ua?: string }) {
    const email = input.email.toLowerCase();

    const credencial = await this.app.prisma.credenciales_clientas.findUnique({
      where: { email },
      include: { clientas: true },
    });

    if (!credencial || credencial.estado !== 'ACTIVA') {
      throw new AppError(401, 'Credenciales inválidas');
    }
    if (credencial.clientas.estado !== 'ACTIVA') {
      throw new AppError(401, 'Credenciales inválidas');
    }

    const passwordOk = await bcrypt.compare(input.password, credencial.password_hash);
    if (!passwordOk) {
      throw new AppError(401, 'Credenciales inválidas');
    }

    const { token, tokenHash } = newOpaqueToken();
    const expira = new Date(Date.now() + SESSION_TTL_MINUTES * 60_000);

    const [sesion] = await this.app.prisma.$transaction([
      this.app.prisma.sesiones_clientas.create({
        data: {
          id_clienta: credencial.id_clienta,
          token_hash: tokenHash,
          expira_en: expira,
        },
      }),
      this.app.prisma.credenciales_clientas.update({
        where: { id_credencial: credencial.id_credencial },
        data: { ultimo_acceso_en: new Date(), actualizado_en: new Date() },
      }),
    ]);

    await writeAuditoria(this.app, {
      idUsuarioAdmin: null,
      accion: 'clienta.login',
      tablaAfectada: 'sesiones_clientas',
      registroId: sesion.id_sesion,
      datosNuevos: {
        id_clienta: toNumberId(credencial.id_clienta),
        id_sesion: toNumberId(sesion.id_sesion),
      },
      ipAddress: meta?.ip,
      userAgent: meta?.ua,
    });

    return {
      accessToken: token,
      expiresAt: expira.toISOString(),
      clienta: toClientaPublic(credencial.clientas),
      email: credencial.email,
    };
  }

  async me(idClienta: bigint) {
    const clienta = await this.app.prisma.clientas.findUnique({
      where: { id_clienta: idClienta },
      include: { credenciales_clientas: true },
    });
    if (!clienta || clienta.estado !== 'ACTIVA') {
      throw new AppError(401, 'No autenticado');
    }
    if (!clienta.credenciales_clientas || clienta.credenciales_clientas.estado !== 'ACTIVA') {
      throw new AppError(401, 'No autenticado');
    }

    return {
      clienta: toClientaPublic(clienta),
      email: clienta.credenciales_clientas.email,
    };
  }

  async logout(idSesion: bigint) {
    const current = await this.app.prisma.sesiones_clientas.findUnique({
      where: { id_sesion: idSesion },
    });
    if (!current) throw new AppError(401, 'No autenticado');
    if (!current.revocada_en) {
      await this.app.prisma.sesiones_clientas.update({
        where: { id_sesion: idSesion },
        data: { revocada_en: new Date() },
      });
    }
    return { revocada: true };
  }

  async logoutTodas(idClienta: bigint) {
    const result = await this.app.prisma.sesiones_clientas.updateMany({
      where: { id_clienta: idClienta, revocada_en: null },
      data: { revocada_en: new Date() },
    });
    return { revocadas: result.count };
  }

  async listMovimientos(idClienta: bigint, query: ListQuery) {
    const { skip, take } = skipTake(query.page, query.limit);
    const where = { id_clienta: idClienta };
    const [total, rows] = await this.app.prisma.$transaction([
      this.app.prisma.movimientos_puntos.count({ where }),
      this.app.prisma.movimientos_puntos.findMany({
        where,
        orderBy: { creado_en: 'desc' },
        skip,
        take,
      }),
    ]);

    return {
      items: rows.map((row) => ({
        id_movimiento: toNumberId(row.id_movimiento),
        tipo: row.tipo,
        puntos: row.puntos,
        saldo_anterior: row.saldo_anterior,
        saldo_posterior: row.saldo_posterior,
        descripcion: row.descripcion,
        creado_en: row.creado_en.toISOString(),
      })),
      meta: paginationMeta(total, query.page, query.limit),
    };
  }

  async listServiciosRealizados(idClienta: bigint, query: ListQuery) {
    const { skip, take } = skipTake(query.page, query.limit);
    const where = { id_clienta: idClienta };
    const [total, rows] = await this.app.prisma.$transaction([
      this.app.prisma.servicios_realizados.count({ where }),
      this.app.prisma.servicios_realizados.findMany({
        where,
        orderBy: { realizado_en: 'desc' },
        skip,
        take,
        include: { servicios: { select: { nombre: true } } },
      }),
    ]);

    return {
      items: rows.map((row) => ({
        id_servicio_realizado: toNumberId(row.id_servicio_realizado),
        id_servicio: toNumberId(row.id_servicio),
        servicio_nombre: row.servicios.nombre,
        cantidad: row.cantidad,
        precio_unitario: row.precio_unitario.toString(),
        puntos_otorgados: row.puntos_otorgados,
        estado: row.estado,
        realizado_en: row.realizado_en.toISOString(),
      })),
      meta: paginationMeta(total, query.page, query.limit),
    };
  }

  async listRecompensasActivas(query: ListQuery) {
    const { skip, take } = skipTake(query.page, query.limit);
    const where = { estado: 'ACTIVA' as const };
    const [total, rows] = await this.app.prisma.$transaction([
      this.app.prisma.recompensas.count({ where }),
      this.app.prisma.recompensas.findMany({
        where,
        orderBy: { puntos_requeridos: 'asc' },
        skip,
        take,
      }),
    ]);

    return {
      items: rows.map((row) => ({
        id_recompensa: toNumberId(row.id_recompensa),
        nombre: row.nombre,
        descripcion: row.descripcion,
        puntos_requeridos: row.puntos_requeridos,
        stock: row.stock,
        limite_por_clienta: row.limite_por_clienta,
        estado: row.estado,
      })),
      meta: paginationMeta(total, query.page, query.limit),
    };
  }

  async listCanjesPropios(idClienta: bigint, query: ListQuery) {
    const { skip, take } = skipTake(query.page, query.limit);
    const where = { id_clienta: idClienta };
    const [total, rows] = await this.app.prisma.$transaction([
      this.app.prisma.canjes_recompensas.count({ where }),
      this.app.prisma.canjes_recompensas.findMany({
        where,
        orderBy: { solicitado_en: 'desc' },
        skip,
        take,
        include: { recompensas: { select: { nombre: true } } },
      }),
    ]);

    return {
      items: rows.map((row) => ({
        id_canje: toNumberId(row.id_canje),
        codigo_canje: row.codigo_canje,
        recompensa_nombre: row.recompensas.nombre,
        puntos_utilizados: row.puntos_utilizados,
        estado: row.estado,
        solicitado_en: row.solicitado_en.toISOString(),
        entregado_en: row.entregado_en?.toISOString() ?? null,
      })),
      meta: paginationMeta(total, query.page, query.limit),
    };
  }
}

/** Exportado para tests unitarios de hash de token. */
export function hashClientaToken(token: string): string {
  return sha256Hex(token);
}
