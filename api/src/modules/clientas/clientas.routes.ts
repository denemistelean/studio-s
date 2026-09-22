import type { FastifyInstance, FastifyRequest } from 'fastify';
import { AppError } from '../../shared/errors/app-error';
import { requirePermission } from '../../shared/auth/guards';
import { PERMISOS } from '../../shared/auth/permisos';
import { idFromParams } from '../../shared/utils/parse-id';
import {
  createClientaSchema,
  listClientasQuerySchema,
  updateClientaEstadoSchema,
  updateClientaSchema,
} from './clientas.schemas';
import { ClientasService } from './clientas.service';

function adminId(request: FastifyRequest): bigint {
  return BigInt(request.user.sub);
}

function reqMeta(request: FastifyRequest) {
  return { ip: request.ip, ua: request.headers['user-agent'] };
}

export async function clientasRoutes(app: FastifyInstance): Promise<void> {
  const service = new ClientasService(app);

  app.get(
    '/clientas',
    { preHandler: [requirePermission(PERMISOS.CLIENTAS_VER)] },
    async (request, reply) => {
      const parsed = listClientasQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        throw new AppError(400, 'Parámetros de consulta no válidos', parsed.error.issues);
      }
      const data = await service.list(parsed.data);
      return reply.send({ success: true, message: 'Listado de clientas', data });
    },
  );

  app.get(
    '/clientas/:id',
    { preHandler: [requirePermission(PERMISOS.CLIENTAS_VER)] },
    async (request, reply) => {
      const clienta = await service.getById(idFromParams(request.params));
      return reply.send({ success: true, message: 'Clienta', data: { clienta } });
    },
  );

  app.post(
    '/clientas',
    { preHandler: [requirePermission(PERMISOS.CLIENTAS_CREAR)] },
    async (request, reply) => {
      const parsed = createClientaSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'Datos de entrada no válidos', parsed.error.issues);
      }
      const clienta = await service.create(parsed.data, adminId(request), reqMeta(request));
      return reply.status(201).send({ success: true, message: 'Clienta creada', data: { clienta } });
    },
  );

  app.patch(
    '/clientas/:id',
    { preHandler: [requirePermission(PERMISOS.CLIENTAS_EDITAR)] },
    async (request, reply) => {
      const parsed = updateClientaSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'Datos de entrada no válidos', parsed.error.issues);
      }
      const clienta = await service.update(
        idFromParams(request.params),
        parsed.data,
        adminId(request),
        reqMeta(request),
      );
      return reply.send({ success: true, message: 'Clienta actualizada', data: { clienta } });
    },
  );

  app.patch(
    '/clientas/:id/estado',
    { preHandler: [requirePermission(PERMISOS.CLIENTAS_EDITAR)] },
    async (request, reply) => {
      const parsed = updateClientaEstadoSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'Datos de entrada no válidos', parsed.error.issues);
      }
      const clienta = await service.updateEstado(
        idFromParams(request.params),
        parsed.data,
        adminId(request),
        reqMeta(request),
      );
      return reply.send({ success: true, message: 'Estado de clienta actualizado', data: { clienta } });
    },
  );
}
