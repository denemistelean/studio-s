import type { FastifyInstance } from 'fastify';
import { AppError } from '../../shared/errors/app-error';
import { requirePermission } from '../../shared/auth/guards';
import { PERMISOS } from '../../shared/auth/permisos';
import { idFromParams } from '../../shared/utils/parse-id';
import {
  updateCredencialEstadoSchema,
  updateCredencialPasswordSchema,
  upsertCredencialSchema,
} from './credenciales-clientas.schemas';
import { CredencialesClientasService } from './credenciales-clientas.service';

export async function credencialesClientasRoutes(app: FastifyInstance): Promise<void> {
  const service = new CredencialesClientasService(app);

  app.get(
    '/clientas/:id/credenciales',
    { preHandler: [requirePermission(PERMISOS.CLIENTAS_VER)] },
    async (request, reply) => {
      const credencial = await service.getByClienta(idFromParams(request.params));
      return reply.send({ success: true, message: 'Credenciales', data: { credencial } });
    },
  );

  app.put(
    '/clientas/:id/credenciales',
    { preHandler: [requirePermission(PERMISOS.CLIENTAS_EDITAR)] },
    async (request, reply) => {
      const parsed = upsertCredencialSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'Datos de entrada no válidos', parsed.error.issues);
      }
      const credencial = await service.upsert(
        idFromParams(request.params),
        parsed.data,
        BigInt(request.user.sub),
      );
      return reply.send({
        success: true,
        message: 'Credenciales guardadas',
        data: { credencial },
      });
    },
  );

  app.patch(
    '/clientas/:id/credenciales/estado',
    { preHandler: [requirePermission(PERMISOS.CLIENTAS_EDITAR)] },
    async (request, reply) => {
      const parsed = updateCredencialEstadoSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'Datos de entrada no válidos', parsed.error.issues);
      }
      const credencial = await service.updateEstado(
        idFromParams(request.params),
        parsed.data,
        BigInt(request.user.sub),
      );
      return reply.send({
        success: true,
        message: 'Estado de credenciales actualizado',
        data: { credencial },
      });
    },
  );

  app.patch(
    '/clientas/:id/credenciales/password',
    { preHandler: [requirePermission(PERMISOS.CLIENTAS_EDITAR)] },
    async (request, reply) => {
      const parsed = updateCredencialPasswordSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'Datos de entrada no válidos', parsed.error.issues);
      }
      const credencial = await service.updatePassword(
        idFromParams(request.params),
        parsed.data,
        BigInt(request.user.sub),
      );
      return reply.send({
        success: true,
        message: 'Contraseña actualizada',
        data: { credencial },
      });
    },
  );
}
