import type { FastifyInstance } from 'fastify';
import { requirePermission } from '../../shared/auth/guards';
import { PERMISOS } from '../../shared/auth/permisos';
import { DashboardService } from './dashboard.service';

export async function dashboardRoutes(app: FastifyInstance): Promise<void> {
  const service = new DashboardService(app);

  app.get(
    '/dashboard/resumen',
    { preHandler: [requirePermission(PERMISOS.DASHBOARD_VER)] },
    async (_request, reply) => {
      const data = await service.resumen();
      return reply.send({
        success: true,
        message: 'Resumen administrativo',
        data,
      });
    },
  );
}
