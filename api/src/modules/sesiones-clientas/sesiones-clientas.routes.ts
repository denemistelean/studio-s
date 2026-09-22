import type { FastifyInstance } from 'fastify';
import { AppError } from '../../shared/errors/app-error';
import { requirePermission } from '../../shared/auth/guards';
import { PERMISOS } from '../../shared/auth/permisos';
import { idFromParams } from '../../shared/utils/parse-id';
import { createSesionSchema, listSesionesQuerySchema } from './sesiones-clientas.schemas';
import { SesionesClientasService } from './sesiones-clientas.service';

export async function sesionesClientasRoutes(app: FastifyInstance): Promise<void> {
  const service = new SesionesClientasService(app);

  app.get(
    '/clientas/:id/sesiones',
    { preHandler: [requirePermission(PERMISOS.CLIENTAS_VER)] },
    async (request, reply) => {
      const parsed = listSesionesQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        throw new AppError(400, 'Parámetros de consulta no válidos', parsed.error.issues);
      }
      const data = await service.listByClienta(idFromParams(request.params), parsed.data);
      return reply.send({ success: true, message: 'Sesiones de clienta', data });
    },
  );

  app.post(
    '/sesiones-clientas',
    { preHandler: [requirePermission(PERMISOS.CLIENTAS_EDITAR)] },
    async (request, reply) => {
      const parsed = createSesionSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'Datos de entrada no válidos', parsed.error.issues);
      }
      const data = await service.create(parsed.data, BigInt(request.user.sub));
      return reply.status(201).send({
        success: true,
        message: 'Sesión creada',
        data,
      });
    },
  );

  app.patch(
    '/sesiones-clientas/:id/revocar',
    { preHandler: [requirePermission(PERMISOS.CLIENTAS_EDITAR)] },
    async (request, reply) => {
      const sesion = await service.revoke(
        idFromParams(request.params),
        BigInt(request.user.sub),
      );
      return reply.send({ success: true, message: 'Sesión revocada', data: { sesion } });
    },
  );

  app.post(
    '/clientas/:id/sesiones/revocar-todas',
    { preHandler: [requirePermission(PERMISOS.CLIENTAS_EDITAR)] },
    async (request, reply) => {
      const data = await service.revokeAllByClienta(
        idFromParams(request.params),
        BigInt(request.user.sub),
      );
      return reply.send({
        success: true,
        message: 'Sesiones revocadas',
        data,
      });
    },
  );
}
