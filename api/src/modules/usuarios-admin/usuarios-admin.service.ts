import bcrypt from 'bcryptjs';
import type { FastifyInstance } from 'fastify';
import type { Prisma } from '../../generated/prisma/client';
import { AppError } from '../../shared/errors/app-error';
import { paginationMeta, skipTake } from '../../shared/utils/pagination';
import type {
  createUsuarioAdminSchema,
  listUsuariosAdminQuerySchema,
  updateUsuarioAdminEstadoSchema,
  updateUsuarioAdminSchema,
} from './usuarios-admin.schemas';
import type { UsuarioAdminPublic } from './usuarios-admin.types';
import type { z } from 'zod';

const BCRYPT_ROUNDS = 12;

const publicSelect = {
  idUsuario: true,
  idRol: true,
  nombres: true,
  apellidos: true,
  email: true,
  estado: true,
  ultimoAccesoEn: true,
  creadoEn: true,
  actualizadoEn: true,
} as const;

type CreateInput = z.infer<typeof createUsuarioAdminSchema>;
type UpdateInput = z.infer<typeof updateUsuarioAdminSchema>;
type EstadoInput = z.infer<typeof updateUsuarioAdminEstadoSchema>;
type ListQuery = z.infer<typeof listUsuariosAdminQuerySchema>;

function toPublic(user: {
  idUsuario: bigint;
  idRol: bigint;
  nombres: string;
  apellidos: string;
  email: string;
  estado: UsuarioAdminPublic['estado'];
  ultimoAccesoEn: Date | null;
  creadoEn: Date;
  actualizadoEn: Date;
}): UsuarioAdminPublic {
  return {
    id_usuario: Number(user.idUsuario),
    id_rol: Number(user.idRol),
    nombres: user.nombres,
    apellidos: user.apellidos,
    email: user.email,
    estado: user.estado,
    ultimo_acceso_en: user.ultimoAccesoEn?.toISOString() ?? null,
    creado_en: user.creadoEn.toISOString(),
    actualizado_en: user.actualizadoEn.toISOString(),
  };
}

export class UsuariosAdminService {
  constructor(private readonly app: FastifyInstance) {}

  async list(query: ListQuery) {
    const where: Prisma.UsuariosAdminWhereInput = {};

    if (query.estado) {
      where.estado = query.estado;
    }

    if (query.q) {
      where.OR = [
        { email: { contains: query.q } },
        { nombres: { contains: query.q } },
        { apellidos: { contains: query.q } },
      ];
    }

    const { skip, take } = skipTake(query.page, query.limit);
    const orderBy = { [query.sort]: query.order } as Prisma.UsuariosAdminOrderByWithRelationInput;

    const [total, rows] = await this.app.prisma.$transaction([
      this.app.prisma.usuariosAdmin.count({ where }),
      this.app.prisma.usuariosAdmin.findMany({
        where,
        select: publicSelect,
        orderBy,
        skip,
        take,
      }),
    ]);

    return {
      items: rows.map(toPublic),
      meta: paginationMeta(total, query.page, query.limit),
    };
  }

  async getById(idUsuario: bigint): Promise<UsuarioAdminPublic> {
    const user = await this.app.prisma.usuariosAdmin.findUnique({
      where: { idUsuario },
      select: publicSelect,
    });

    if (!user) {
      throw new AppError(404, 'Usuario administrativo no encontrado');
    }

    return toPublic(user);
  }

  async create(input: CreateInput): Promise<UsuarioAdminPublic> {
    const existing = await this.app.prisma.usuariosAdmin.findUnique({
      where: { email: input.email },
      select: { idUsuario: true },
    });

    if (existing) {
      throw new AppError(409, 'Ya existe un usuario con ese email');
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    const created = await this.app.prisma.usuariosAdmin.create({
      data: {
        email: input.email,
        nombres: input.nombres,
        apellidos: input.apellidos,
        idRol: BigInt(input.id_rol),
        passwordHash,
        estado: input.estado,
        ultimoAccesoEn: null,
      },
      select: publicSelect,
    });

    return toPublic(created);
  }

  async update(idUsuario: bigint, input: UpdateInput): Promise<UsuarioAdminPublic> {
    const current = await this.app.prisma.usuariosAdmin.findUnique({
      where: { idUsuario },
      select: { idUsuario: true, email: true },
    });

    if (!current) {
      throw new AppError(404, 'Usuario administrativo no encontrado');
    }

    if (input.email && input.email !== current.email) {
      const conflict = await this.app.prisma.usuariosAdmin.findUnique({
        where: { email: input.email },
        select: { idUsuario: true },
      });
      if (conflict) {
        throw new AppError(409, 'Ya existe un usuario con ese email');
      }
    }

    const data: Prisma.UsuariosAdminUncheckedUpdateInput = {};
    if (input.email !== undefined) data.email = input.email;
    if (input.nombres !== undefined) data.nombres = input.nombres;
    if (input.apellidos !== undefined) data.apellidos = input.apellidos;
    if (input.id_rol !== undefined) {
      data.idRol = BigInt(input.id_rol);
    }
    if (input.password !== undefined) {
      data.passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    }

    const updated = await this.app.prisma.usuariosAdmin.update({
      where: { idUsuario },
      data,
      select: publicSelect,
    });

    return toPublic(updated);
  }

  async updateEstado(idUsuario: bigint, input: EstadoInput): Promise<UsuarioAdminPublic> {
    const current = await this.app.prisma.usuariosAdmin.findUnique({
      where: { idUsuario },
      select: { idUsuario: true, estado: true },
    });

    if (!current) {
      throw new AppError(404, 'Usuario administrativo no encontrado');
    }

    if (current.estado === input.estado) {
      throw new AppError(409, 'El usuario ya tiene ese estado');
    }

    const updated = await this.app.prisma.usuariosAdmin.update({
      where: { idUsuario },
      data: { estado: input.estado },
      select: publicSelect,
    });

    return toPublic(updated);
  }
}
