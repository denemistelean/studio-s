import type { FastifyInstance } from 'fastify';
import { AppError } from '../../shared/errors/app-error';
import { requireClientaAuth } from '../../shared/auth/clienta-guards';
import { checkAuthRateLimit } from '../../plugins/rate-limit-auth';
import { QrClientasService } from '../qr-clientas/qr-clientas.service';
import {
  loginClientaSchema,
  portalListQuerySchema,
  registroClientaSchema,
} from './auth-clienta.schemas';
import { AuthClientaService } from './auth-clienta.service';

/**
 * Auth y portal de clientas (sesiones_clientas + token opaco).
 * No usa JWT de usuarios_admin.
 */
export async function authClientaRoutes(app: FastifyInstance): Promise<void> {
  const service = new AuthClientaService(app);
  const qrService = new QrClientasService(app);

  app.post('/auth/clienta/registro', async (request, reply) => {
    checkAuthRateLimit(request, 'auth.clienta.registro');
    const parsed = registroClientaSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(400, 'Datos de entrada no válidos', parsed.error.issues);
    }
    const data = await service.registro(parsed.data, {
      ip: request.ip,
      ua: request.headers['user-agent'],
    });
    return reply.status(201).send({
      success: true,
      message: 'Registro exitoso. Ya podés iniciar sesión.',
      data,
    });
  });

  app.post('/auth/clienta/login', async (request, reply) => {
    checkAuthRateLimit(request, 'auth.clienta.login');
    const parsed = loginClientaSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(400, 'Datos de entrada no válidos', parsed.error.issues);
    }
    const data = await service.login(parsed.data, {
      ip: request.ip,
      ua: request.headers['user-agent'],
    });
    return reply.send({
      success: true,
      message: 'Login exitoso',
      data,
    });
  });

  app.get(
    '/auth/clienta/me',
    { preHandler: [requireClientaAuth] },
    async (request, reply) => {
      const data = await service.me(request.clientaAuth!.id_clienta);
      return reply.send({
        success: true,
        message: 'Clienta autenticada',
        data,
      });
    },
  );

  app.post(
    '/auth/clienta/logout',
    { preHandler: [requireClientaAuth] },
    async (request, reply) => {
      const data = await service.logout(request.clientaAuth!.id_sesion);
      return reply.send({
        success: true,
        message: 'Sesión cerrada',
        data,
      });
    },
  );

  app.post(
    '/auth/clienta/logout-todas',
    { preHandler: [requireClientaAuth] },
    async (request, reply) => {
      const data = await service.logoutTodas(request.clientaAuth!.id_clienta);
      return reply.send({
        success: true,
        message: 'Sesiones cerradas',
        data,
      });
    },
  );

  app.get(
    '/clienta/movimientos-puntos',
    { preHandler: [requireClientaAuth] },
    async (request, reply) => {
      const parsed = portalListQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        throw new AppError(400, 'Parámetros de consulta no válidos', parsed.error.issues);
      }
      const data = await service.listMovimientos(
        request.clientaAuth!.id_clienta,
        parsed.data,
      );
      return reply.send({
        success: true,
        message: 'Historial de puntos',
        data,
      });
    },
  );

  app.get(
    '/clienta/servicios-realizados',
    { preHandler: [requireClientaAuth] },
    async (request, reply) => {
      const parsed = portalListQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        throw new AppError(400, 'Parámetros de consulta no válidos', parsed.error.issues);
      }
      const data = await service.listServiciosRealizados(
        request.clientaAuth!.id_clienta,
        parsed.data,
      );
      return reply.send({
        success: true,
        message: 'Servicios realizados',
        data,
      });
    },
  );

  app.get(
    '/clienta/recompensas',
    { preHandler: [requireClientaAuth] },
    async (request, reply) => {
      const parsed = portalListQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        throw new AppError(400, 'Parámetros de consulta no válidos', parsed.error.issues);
      }
      const data = await service.listRecompensasActivas(parsed.data);
      return reply.send({
        success: true,
        message: 'Recompensas disponibles',
        data,
      });
    },
  );

  app.get(
    '/clienta/canjes',
    { preHandler: [requireClientaAuth] },
    async (request, reply) => {
      const parsed = portalListQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        throw new AppError(400, 'Parámetros de consulta no válidos', parsed.error.issues);
      }
      const data = await service.listCanjesPropios(
        request.clientaAuth!.id_clienta,
        parsed.data,
      );
      return reply.send({
        success: true,
        message: 'Mis canjes',
        data,
      });
    },
  );

  /**
   * Emite (rota) el QR personal de la clienta autenticada.
   * Solo se guarda token_hash; el token en claro se devuelve una vez.
   */
  app.post(
    '/clienta/qr',
    { preHandler: [requireClientaAuth] },
    async (request, reply) => {
      const data = await qrService.ensureForSelf(request.clientaAuth!.id_clienta);
      return reply.status(201).send({
        success: true,
        message: 'QR listo',
        data: {
          qr: data.qr,
          qr_payload: data.qr_payload,
        },
      });
    },
  );
}
