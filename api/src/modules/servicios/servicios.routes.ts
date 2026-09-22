import type { FastifyInstance } from 'fastify';
import { AppError } from '../../shared/errors/app-error';
import { requirePermission } from '../../shared/auth/guards';
import { PERMISOS } from '../../shared/auth/permisos';
import { idFromParams } from '../../shared/utils/parse-id';
import {
  createServicioSchema,
  listServiciosQuerySchema,
  updateServicioEstadoSchema,
  updateServicioSchema,
} from './servicios.schemas';
import { ServiciosService } from './servicios.service';

export async function serviciosRoutes(app: FastifyInstance): Promise<void> {
  const service = new ServiciosService(app);

  app.get(
    '/servicios',
    { preHandler: [requirePermission(PERMISOS.SERVICIOS_VER)] },
    async (request, reply) => {
      const parsed = listServiciosQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        throw new AppError(400, 'Parámetros de consulta no válidos', parsed.error.issues);
      }
      const data = await service.list(parsed.data);
      return reply.send({ success: true, message: 'Listado de servicios', data });
    },
  );

  app.get(
    '/servicios/:id',
    { preHandler: [requirePermission(PERMISOS.SERVICIOS_VER)] },
    async (request, reply) => {
      const servicio = await service.getById(idFromParams(request.params));
      return reply.send({ success: true, message: 'Servicio', data: { servicio } });
    },
  );

  app.post(
    '/servicios',
    { preHandler: [requirePermission(PERMISOS.SERVICIOS_GESTIONAR)] },
    async (request, reply) => {
      const parsed = createServicioSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'Datos de entrada no válidos', parsed.error.issues);
      }
      const servicio = await service.create(parsed.data, BigInt(request.user.sub));
      return reply.status(201).send({ success: true, message: 'Servicio creado', data: { servicio } });
    },
  );

  app.patch(
    '/servicios/:id',
    { preHandler: [requirePermission(PERMISOS.SERVICIOS_GESTIONAR)] },
    async (request, reply) => {
      const parsed = updateServicioSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'Datos de entrada no válidos', parsed.error.issues);
      }
      const servicio = await service.update(
        idFromParams(request.params),
        parsed.data,
        BigInt(request.user.sub),
      );
      return reply.send({ success: true, message: 'Servicio actualizado', data: { servicio } });
    },
  );

  app.patch(
    '/servicios/:id/estado',
    { preHandler: [requirePermission(PERMISOS.SERVICIOS_GESTIONAR)] },
    async (request, reply) => {
      const parsed = updateServicioEstadoSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'Datos de entrada no válidos', parsed.error.issues);
      }
      const servicio = await service.updateEstado(
        idFromParams(request.params),
        parsed.data,
        BigInt(request.user.sub),
      );
      return reply.send({ success: true, message: 'Estado de servicio actualizado', data: { servicio } });
    },
  );
}
