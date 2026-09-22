import type { FastifyInstance } from 'fastify';
import { AppError } from '../../shared/errors/app-error';
import { requirePermission } from '../../shared/auth/guards';
import { PERMISOS } from '../../shared/auth/permisos';
import { idFromParams } from '../../shared/utils/parse-id';
import {
  createAtencionSchema,
  createServicioRealizadoSchema,
  listServiciosRealizadosQuerySchema,
} from './servicios-realizados.schemas';
import { ServiciosRealizadosService } from './servicios-realizados.service';

export async function serviciosRealizadosRoutes(app: FastifyInstance): Promise<void> {
  const service = new ServiciosRealizadosService(app);

  app.get(
    '/servicios-realizados',
    { preHandler: [requirePermission(PERMISOS.SERVICIOS_VER)] },
    async (request, reply) => {
      const parsed = listServiciosRealizadosQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        throw new AppError(400, 'Parámetros de consulta no válidos', parsed.error.issues);
      }
      const data = await service.list(parsed.data);
      return reply.send({ success: true, message: 'Servicios realizados', data });
    },
  );

  app.get(
    '/servicios-realizados/:id',
    { preHandler: [requirePermission(PERMISOS.SERVICIOS_VER)] },
    async (request, reply) => {
      const row = await service.getById(idFromParams(request.params));
      return reply.send({
        success: true,
        message: 'Servicio realizado',
        data: { servicio_realizado: row },
      });
    },
  );

  app.post(
    '/servicios-realizados',
    { preHandler: [requirePermission(PERMISOS.SERVICIOS_REGISTRAR)] },
    async (request, reply) => {
      const parsed = createServicioRealizadoSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'Datos de entrada no válidos', parsed.error.issues);
      }
      const data = await service.create(parsed.data, BigInt(request.user.sub));
      return reply.status(data.duplicated ? 200 : 201).send({
        success: true,
        message: data.duplicated
          ? 'Operación idempotente: registro existente'
          : 'Servicio realizado registrado',
        data,
      });
    },
  );

  app.post(
    '/servicios-realizados/atencion',
    { preHandler: [requirePermission(PERMISOS.SERVICIOS_REGISTRAR)] },
    async (request, reply) => {
      const parsed = createAtencionSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'Datos de entrada no válidos', parsed.error.issues);
      }
      const data = await service.createAtencion(parsed.data, BigInt(request.user.sub));
      return reply.status(data.duplicated ? 200 : 201).send({
        success: true,
        message: data.duplicated
          ? 'Operación idempotente: atención existente'
          : 'Atención registrada',
        data,
      });
    },
  );

  app.patch(
    '/servicios-realizados/:id/anular',
    { preHandler: [requirePermission(PERMISOS.SERVICIOS_REGISTRAR)] },
    async (request, reply) => {
      const row = await service.anular(idFromParams(request.params), BigInt(request.user.sub));
      return reply.send({
        success: true,
        message: 'Servicio realizado anulado',
        data: { servicio_realizado: row },
      });
    },
  );
}
