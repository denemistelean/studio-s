import Fastify, { type FastifyError } from 'fastify';
import { env } from './config/env';
import { auditoriaRoutes } from './modules/auditoria/auditoria.routes';
import { authRoutes } from './modules/auth/auth.routes';
import { authClientaRoutes } from './modules/auth-clienta/auth-clienta.routes';
import { canjesRoutes } from './modules/canjes/canjes.routes';
import { clientasRoutes } from './modules/clientas/clientas.routes';
import { credencialesClientasRoutes } from './modules/credenciales-clientas/credenciales-clientas.routes';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes';
import { healthRoutes } from './modules/health/health.routes';
import { puntosRoutes } from './modules/puntos/puntos.routes';
import { qrClientasRoutes } from './modules/qr-clientas/qr-clientas.routes';
import { recompensasRoutes } from './modules/recompensas/recompensas.routes';
import { rolesRoutes } from './modules/roles/roles.routes';
import { serviciosRoutes } from './modules/servicios/servicios.routes';
import { serviciosRealizadosRoutes } from './modules/servicios-realizados/servicios-realizados.routes';
import { sesionesClientasRoutes } from './modules/sesiones-clientas/sesiones-clientas.routes';
import { usuariosAdminRoutes } from './modules/usuarios-admin/usuarios-admin.routes';
import { AppError } from './shared/errors/app-error';
import corsPlugin from './plugins/cors';
import jwtPlugin from './plugins/jwt';
import prismaPlugin from './plugins/prisma';
import securityPlugin from './plugins/security';

export async function buildApp() {
  const app = Fastify({
    pluginTimeout: 15000,
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      redact: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.body.password',
        'body.password',
        'req.body.passwordHash',
        'data.accessToken',
      ],
    },
  });

  await app.register(securityPlugin);
  await app.register(corsPlugin);
  await app.register(prismaPlugin);
  await app.register(jwtPlugin);

  await app.register(healthRoutes, { prefix: '/api' });
  await app.register(authRoutes, { prefix: '/api' });
  await app.register(authClientaRoutes, { prefix: '/api' });
  await app.register(usuariosAdminRoutes, { prefix: '/api' });
  await app.register(dashboardRoutes, { prefix: '/api' });
  await app.register(clientasRoutes, { prefix: '/api' });
  await app.register(serviciosRoutes, { prefix: '/api' });
  await app.register(puntosRoutes, { prefix: '/api' });
  await app.register(serviciosRealizadosRoutes, { prefix: '/api' });
  await app.register(recompensasRoutes, { prefix: '/api' });
  await app.register(canjesRoutes, { prefix: '/api' });
  await app.register(qrClientasRoutes, { prefix: '/api' });
  await app.register(credencialesClientasRoutes, { prefix: '/api' });
  await app.register(sesionesClientasRoutes, { prefix: '/api' });
  await app.register(rolesRoutes, { prefix: '/api' });
  await app.register(auditoriaRoutes, { prefix: '/api' });

  app.setNotFoundHandler((_request, reply) => {
    return reply.status(404).send({
      success: false,
      message: 'Ruta no encontrada',
      errors: [],
    });
  });

  app.setErrorHandler((error: FastifyError | AppError, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        success: false,
        message: error.message,
        errors: error.errors,
      });
    }

    const statusCode = error.statusCode ?? 500;
    request.log.error({ name: error.name, statusCode }, 'Error no controlado');

    if (statusCode >= 500) {
      return reply.status(500).send({
        success: false,
        message: 'Error interno del servidor',
        errors: [],
      });
    }

    return reply.status(statusCode).send({
      success: false,
      message: 'Solicitud no válida',
      errors: [],
    });
  });

  return app;
}
