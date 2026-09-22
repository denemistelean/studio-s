import type { FastifyInstance } from 'fastify';
import { AppError } from '../../shared/errors/app-error';
import { requirePermission } from '../../shared/auth/guards';
import { PERMISOS } from '../../shared/auth/permisos';
import { idFromParams } from '../../shared/utils/parse-id';
import { createCanjeSchema, listCanjesQuerySchema } from './canjes.schemas';
import { CanjesService } from './canjes.service';

export async function canjesRoutes(app: FastifyInstance): Promise<void> {
  const service = new CanjesService(app);

  app.get(
    '/canjes',
    { preHandler: [requirePermission(PERMISOS.CLIENTAS_VER)] },
    async (request, reply) => {
      const parsed = listCanjesQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        throw new AppError(400, 'Parámetros de consulta no válidos', parsed.error.issues);
      }
      const data = await service.list(parsed.data);
      return reply.send({ success: true, message: 'Listado de canjes', data });
    },
  );

  app.get(
    '/clientas/:id/canjes',
    { preHandler: [requirePermission(PERMISOS.CLIENTAS_VER)] },
    async (request, reply) => {
      const parsed = listCanjesQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        throw new AppError(400, 'Parámetros de consulta no válidos', parsed.error.issues);
      }
      const data = await service.listByClienta(idFromParams(request.params), parsed.data);
      return reply.send({ success: true, message: 'Canjes de clienta', data });
    },
  );

  app.post(
    '/canjes',
    { preHandler: [requirePermission(PERMISOS.CANJES_REGISTRAR)] },
    async (request, reply) => {
      const parsed = createCanjeSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'Datos de entrada no válidos', parsed.error.issues);
      }
      const canje = await service.create(parsed.data, BigInt(request.user.sub));
      return reply.status(201).send({
        success: true,
        message: 'Canje registrado',
        data: { canje },
      });
    },
  );

  app.patch(
    '/canjes/:id/entregar',
    { preHandler: [requirePermission(PERMISOS.CANJES_REGISTRAR)] },
    async (request, reply) => {
      const canje = await service.entregar(idFromParams(request.params), BigInt(request.user.sub));
      return reply.send({ success: true, message: 'Canje entregado', data: { canje } });
    },
  );

  app.patch(
    '/canjes/:id/anular',
    { preHandler: [requirePermission(PERMISOS.CANJES_REGISTRAR)] },
    async (request, reply) => {
      const canje = await service.anular(idFromParams(request.params), BigInt(request.user.sub));
      return reply.send({ success: true, message: 'Canje anulado', data: { canje } });
    },
  );
}
