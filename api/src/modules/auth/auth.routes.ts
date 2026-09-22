import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../../shared/errors/app-error';
import { requireAuth } from '../../shared/auth/guards';
import { checkAuthRateLimit } from '../../plugins/rate-limit-auth';
import { loginBodySchema } from './auth.schemas';
import { AuthService } from './auth.service';

/**
 * Rutas:
 *   POST /api/auth/login
 *   GET  /api/auth/me
 */
export async function authRoutes(app: FastifyInstance): Promise<void> {
  const authService = new AuthService(app);

  app.post('/auth/login', async (request: FastifyRequest, reply: FastifyReply) => {
    checkAuthRateLimit(request, 'auth.login');
    const parsed = loginBodySchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(400, 'Datos de entrada no válidos', parsed.error.issues);
    }

    const result = await authService.login(parsed.data);

    return reply.status(200).send({
      success: true,
      message: 'Login exitoso',
      data: result,
    });
  });

  app.get(
    '/auth/me',
    { preHandler: [requireAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await authService.me(request.user);

      return reply.status(200).send({
        success: true,
        message: 'Usuario autenticado',
        data: { user },
      });
    },
  );
}
