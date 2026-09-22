import type { FastifyInstance } from 'fastify';
import { checkDatabase } from './health.service';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async (request, reply) => {
    try {
      const database = await checkDatabase(app.prisma);
      return {
        success: true,
        message: 'Studio S API funcionando',
        data: {
          database,
          service: 'studio-s-api',
        },
      };
    } catch (error) {
      request.log.warn(
        { name: error instanceof Error ? error.name : 'UnknownError' },
        'Comprobación de MariaDB fallida',
      );

      return reply.status(503).send({
        success: false,
        message: 'Studio S API en ejecución, pero MariaDB no está disponible',
        errors: [],
        data: {
          database: 'disconnected',
          service: 'studio-s-api',
        },
      });
    }
  });
}
