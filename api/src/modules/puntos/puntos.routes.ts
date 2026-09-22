import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AppError } from '../../shared/errors/app-error';
import { requirePermission } from '../../shared/auth/guards';
import { PERMISOS } from '../../shared/auth/permisos';
import { idFromParams } from '../../shared/utils/parse-id';
import { ajustarPuntosSchema, listMovimientosQuerySchema } from './puntos.schemas';
import { PuntosService } from './puntos.service';

const listGlobalQuerySchema = listMovimientosQuerySchema.extend({
  id_clienta: z.coerce.number().int().positive().optional(),
});

export async function puntosRoutes(app: FastifyInstance): Promise<void> {
  const service = new PuntosService(app);

  app.get(
    '/puntos',
    { preHandler: [requirePermission(PERMISOS.CLIENTAS_VER)] },
    async (request, reply) => {
      const parsed = listGlobalQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        throw new AppError(400, 'Parámetros de consulta no válidos', parsed.error.issues);
      }
      const data = await service.list(parsed.data);
      return reply.send({ success: true, message: 'Movimientos de puntos', data });
    },
  );

  app.get(
    '/clientas/:id/puntos',
    { preHandler: [requirePermission(PERMISOS.CLIENTAS_VER)] },
    async (request, reply) => {
      const data = await service.saldo(idFromParams(request.params));
      return reply.send({ success: true, message: 'Saldo de puntos', data });
    },
  );

  app.get(
    '/clientas/:id/movimientos-puntos',
    { preHandler: [requirePermission(PERMISOS.CLIENTAS_VER)] },
    async (request, reply) => {
      const parsed = listMovimientosQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        throw new AppError(400, 'Parámetros de consulta no válidos', parsed.error.issues);
      }
      const data = await service.historial(idFromParams(request.params), parsed.data);
      return reply.send({ success: true, message: 'Historial de puntos', data });
    },
  );

  app.post(
    '/puntos/otorgar',
    { preHandler: [requirePermission(PERMISOS.PUNTOS_AJUSTAR)] },
    async (request, reply) => {
      const parsed = ajustarPuntosSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'Datos de entrada no válidos', parsed.error.issues);
      }
      const movimiento = await service.ajustar(parsed.data, BigInt(request.user.sub));
      return reply.status(201).send({
        success: true,
        message: 'Ajuste de puntos registrado',
        data: { movimiento },
      });
    },
  );
}
