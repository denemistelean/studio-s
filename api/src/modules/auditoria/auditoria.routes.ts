import type { FastifyInstance } from 'fastify';
import { AppError } from '../../shared/errors/app-error';
import { requirePermission } from '../../shared/auth/guards';
import { PERMISOS } from '../../shared/auth/permisos';
import { listAuditoriaQuerySchema } from './auditoria.schemas';
import { AuditoriaService } from './auditoria.service';

export async function auditoriaRoutes(app: FastifyInstance): Promise<void> {
  const service = new AuditoriaService(app);

  app.get(
    '/auditoria',
    { preHandler: [requirePermission(PERMISOS.AUDITORIA_VER)] },
    async (request, reply) => {
      const parsed = listAuditoriaQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        throw new AppError(400, 'Parámetros de consulta no válidos', parsed.error.issues);
      }
      const data = await service.list(parsed.data);
      return reply.send({ success: true, message: 'Auditoría', data });
    },
  );
}
