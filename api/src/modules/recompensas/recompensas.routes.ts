import type { FastifyInstance } from 'fastify';
import { AppError } from '../../shared/errors/app-error';
import { requirePermission } from '../../shared/auth/guards';
import { PERMISOS } from '../../shared/auth/permisos';
import { idFromParams } from '../../shared/utils/parse-id';
import {
  createRecompensaSchema,
  listRecompensasQuerySchema,
  updateRecompensaEstadoSchema,
  updateRecompensaSchema,
} from './recompensas.schemas';
import { RecompensasService } from './recompensas.service';

export async function recompensasRoutes(app: FastifyInstance): Promise<void> {
  const service = new RecompensasService(app);

  app.get(
    '/recompensas',
    { preHandler: [requirePermission(PERMISOS.RECOMPENSAS_VER)] },
    async (request, reply) => {
      const parsed = listRecompensasQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        throw new AppError(400, 'Parámetros de consulta no válidos', parsed.error.issues);
      }
      const data = await service.list(parsed.data);
      return reply.send({ success: true, message: 'Listado de recompensas', data });
    },
  );

  app.get(
    '/recompensas/:id',
    { preHandler: [requirePermission(PERMISOS.RECOMPENSAS_VER)] },
    async (request, reply) => {
      const recompensa = await service.getById(idFromParams(request.params));
      return reply.send({ success: true, message: 'Recompensa', data: { recompensa } });
    },
  );

  app.post(
    '/recompensas',
    { preHandler: [requirePermission(PERMISOS.RECOMPENSAS_GESTIONAR)] },
    async (request, reply) => {
      const parsed = createRecompensaSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'Datos de entrada no válidos', parsed.error.issues);
      }
      const recompensa = await service.create(parsed.data, BigInt(request.user.sub));
      return reply.status(201).send({
        success: true,
        message: 'Recompensa creada',
        data: { recompensa },
      });
    },
  );

  app.patch(
    '/recompensas/:id',
    { preHandler: [requirePermission(PERMISOS.RECOMPENSAS_GESTIONAR)] },
    async (request, reply) => {
      const parsed = updateRecompensaSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'Datos de entrada no válidos', parsed.error.issues);
      }
      const recompensa = await service.update(
        idFromParams(request.params),
        parsed.data,
        BigInt(request.user.sub),
      );
      return reply.send({ success: true, message: 'Recompensa actualizada', data: { recompensa } });
    },
  );

  app.patch(
    '/recompensas/:id/estado',
    { preHandler: [requirePermission(PERMISOS.RECOMPENSAS_GESTIONAR)] },
    async (request, reply) => {
      const parsed = updateRecompensaEstadoSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'Datos de entrada no válidos', parsed.error.issues);
      }
      const recompensa = await service.updateEstado(
        idFromParams(request.params),
        parsed.data,
        BigInt(request.user.sub),
      );
      return reply.send({
        success: true,
        message: 'Estado de recompensa actualizado',
        data: { recompensa },
      });
    },
  );
}
