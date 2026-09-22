import type { FastifyInstance } from 'fastify';
import { AppError } from '../../shared/errors/app-error';
import { writeAuditoria } from '../../shared/services/auditoria.service';
import { toNumberId } from '../../shared/utils/ids';
import type { z } from 'zod';
import type { updateRolEstadoSchema, updateRolPermisosSchema } from './roles.schemas';

type PermisosInput = z.infer<typeof updateRolPermisosSchema>;
type EstadoInput = z.infer<typeof updateRolEstadoSchema>;

export class RolesService {
  constructor(private readonly app: FastifyInstance) {}

  async listRoles() {
    const rows = await this.app.prisma.roles.findMany({
      orderBy: { nombre: 'asc' },
      include: {
        rol_permisos: {
          include: { permisos: { select: { codigo: true, nombre: true } } },
        },
      },
    });
    return rows.map((row) => ({
      id_rol: toNumberId(row.id_rol),
      nombre: row.nombre,
      descripcion: row.descripcion,
      estado: row.estado,
      creado_en: row.creado_en.toISOString(),
      actualizado_en: row.actualizado_en.toISOString(),
      permisos: row.rol_permisos.map((rp) => ({
        codigo: rp.permisos.codigo,
        nombre: rp.permisos.nombre,
      })),
    }));
  }

  async listPermisos() {
    const rows = await this.app.prisma.permisos.findMany({
      orderBy: { codigo: 'asc' },
    });
    return rows.map((row) => ({
      id_permiso: toNumberId(row.id_permiso),
      codigo: row.codigo,
      nombre: row.nombre,
      descripcion: row.descripcion,
    }));
  }

  async getRol(id: bigint) {
    const row = await this.app.prisma.roles.findUnique({
      where: { id_rol: id },
      include: {
        rol_permisos: {
          include: { permisos: true },
        },
      },
    });
    if (!row) throw new AppError(404, 'Rol no encontrado');
    return {
      id_rol: toNumberId(row.id_rol),
      nombre: row.nombre,
      descripcion: row.descripcion,
      estado: row.estado,
      creado_en: row.creado_en.toISOString(),
      actualizado_en: row.actualizado_en.toISOString(),
      permisos: row.rol_permisos.map((rp) => ({
        id_permiso: toNumberId(rp.permisos.id_permiso),
        codigo: rp.permisos.codigo,
        nombre: rp.permisos.nombre,
        descripcion: rp.permisos.descripcion,
      })),
    };
  }

  async setPermisos(idRol: bigint, input: PermisosInput, adminId: bigint) {
    const rol = await this.app.prisma.roles.findUnique({ where: { id_rol: idRol } });
    if (!rol) throw new AppError(404, 'Rol no encontrado');

    const unique = [...new Set(input.codigos)];
    const permisos = await this.app.prisma.permisos.findMany({
      where: { codigo: { in: unique } },
    });
    if (permisos.length !== unique.length) {
      const found = new Set(permisos.map((p) => p.codigo));
      const missing = unique.filter((c) => !found.has(c));
      throw new AppError(400, 'Códigos de permiso desconocidos', missing);
    }

    await this.app.prisma.$transaction(async (tx) => {
      await tx.rol_permisos.deleteMany({ where: { id_rol: idRol } });
      if (permisos.length > 0) {
        await tx.rol_permisos.createMany({
          data: permisos.map((p) => ({
            id_rol: idRol,
            id_permiso: p.id_permiso,
          })),
        });
      }
      await tx.roles.update({
        where: { id_rol: idRol },
        data: { actualizado_en: new Date() },
      });
    });

    const updated = await this.getRol(idRol);
    await writeAuditoria(this.app, {
      idUsuarioAdmin: adminId,
      accion: 'roles.permisos',
      tablaAfectada: 'rol_permisos',
      registroId: idRol,
      datosNuevos: { codigos: unique },
    });
    return updated;
  }

  async updateEstado(idRol: bigint, input: EstadoInput, adminId: bigint) {
    const current = await this.app.prisma.roles.findUnique({ where: { id_rol: idRol } });
    if (!current) throw new AppError(404, 'Rol no encontrado');
    if (current.estado === input.estado) {
      throw new AppError(409, 'El rol ya tiene ese estado');
    }
    const updated = await this.app.prisma.roles.update({
      where: { id_rol: idRol },
      data: { estado: input.estado, actualizado_en: new Date() },
    });
    await writeAuditoria(this.app, {
      idUsuarioAdmin: adminId,
      accion: 'roles.estado',
      tablaAfectada: 'roles',
      registroId: idRol,
      datosAnteriores: { estado: current.estado },
      datosNuevos: { estado: updated.estado },
    });
    return {
      id_rol: toNumberId(updated.id_rol),
      nombre: updated.nombre,
      descripcion: updated.descripcion,
      estado: updated.estado,
      creado_en: updated.creado_en.toISOString(),
      actualizado_en: updated.actualizado_en.toISOString(),
    };
  }
}
