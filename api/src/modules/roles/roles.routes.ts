import type { FastifyInstance } from 'fastify';
import { AppError } from '../../shared/errors/app-error';
import { requirePermission } from '../../shared/auth/guards';
import { PERMISOS } from '../../shared/auth/permisos';
import { idFromParams } from '../../shared/utils/parse-id';
import { updateRolEstadoSchema, updateRolPermisosSchema } from './roles.schemas';
import { RolesService } from './roles.service';

export async function rolesRoutes(app: FastifyInstance): Promise<void> {
  const service = new RolesService(app);

  app.get(
    '/roles',
    { preHandler: [requirePermission(PERMISOS.ROLES_GESTIONAR)] },
    async (_request, reply) => {
      const roles = await service.listRoles();
      return reply.send({ success: true, message: 'Listado de roles', data: { roles } });
    },
  );

  app.get(
    '/permisos',
    { preHandler: [requirePermission(PERMISOS.ROLES_GESTIONAR)] },
    async (_request, reply) => {
      const permisos = await service.listPermisos();
      return reply.send({ success: true, message: 'Listado de permisos', data: { permisos } });
    },
  );

  app.get(
    '/roles/:id',
    { preHandler: [requirePermission(PERMISOS.ROLES_GESTIONAR)] },
    async (request, reply) => {
      const rol = await service.getRol(idFromParams(request.params));
      return reply.send({ success: true, message: 'Rol', data: { rol } });
    },
  );

  app.put(
    '/roles/:id/permisos',
    { preHandler: [requirePermission(PERMISOS.ROLES_GESTIONAR)] },
    async (request, reply) => {
      const parsed = updateRolPermisosSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'Datos de entrada no válidos', parsed.error.issues);
      }
      const rol = await service.setPermisos(
        idFromParams(request.params),
        parsed.data,
        BigInt(request.user.sub),
      );
      return reply.send({
        success: true,
        message: 'Permisos del rol actualizados',
        data: { rol },
      });
    },
  );

  app.patch(
    '/roles/:id/estado',
    { preHandler: [requirePermission(PERMISOS.ROLES_GESTIONAR)] },
    async (request, reply) => {
      const parsed = updateRolEstadoSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'Datos de entrada no válidos', parsed.error.issues);
      }
      const rol = await service.updateEstado(
        idFromParams(request.params),
        parsed.data,
        BigInt(request.user.sub),
      );
      return reply.send({
        success: true,
        message: 'Estado de rol actualizado',
        data: { rol },
      });
    },
  );
}
