import type { FastifyInstance } from 'fastify';
import { AppError } from '../../shared/errors/app-error';
import { requirePermission } from '../../shared/auth/guards';
import { PERMISOS } from '../../shared/auth/permisos';
import { idFromParams } from '../../shared/utils/parse-id';
import { generateQrSchema, listQrQuerySchema, validateQrSchema } from './qr-clientas.schemas';
import { QrClientasService } from './qr-clientas.service';

export async function qrClientasRoutes(app: FastifyInstance): Promise<void> {
  const service = new QrClientasService(app);

  app.get(
    '/clientas/:id/qr',
    { preHandler: [requirePermission(PERMISOS.CLIENTAS_VER)] },
    async (request, reply) => {
      const parsed = listQrQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        throw new AppError(400, 'Parámetros de consulta no válidos', parsed.error.issues);
      }
      const data = await service.listByClienta(idFromParams(request.params), parsed.data);
      return reply.send({ success: true, message: 'QR de clienta', data });
    },
  );

  app.post(
    '/qr-clientas',
    { preHandler: [requirePermission(PERMISOS.CLIENTAS_EDITAR)] },
    async (request, reply) => {
      const parsed = generateQrSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'Datos de entrada no válidos', parsed.error.issues);
      }
      const data = await service.generate(parsed.data, BigInt(request.user.sub));
      return reply.status(201).send({
        success: true,
        message: 'QR generado',
        data,
      });
    },
  );

  app.post(
    '/qr-clientas/validar',
    {
      preHandler: [
        requirePermission(PERMISOS.CLIENTAS_VER, PERMISOS.SERVICIOS_REGISTRAR),
      ],
    },
    async (request, reply) => {
      const parsed = validateQrSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'Datos de entrada no válidos', parsed.error.issues);
      }
      const data = await service.validate(parsed.data);
      return reply.send({ success: true, message: 'QR válido', data });
    },
  );

  app.patch(
    '/qr-clientas/:id/revocar',
    { preHandler: [requirePermission(PERMISOS.CLIENTAS_EDITAR)] },
    async (request, reply) => {
      const qr = await service.revoke(idFromParams(request.params), BigInt(request.user.sub));
      return reply.send({ success: true, message: 'QR revocado', data: { qr } });
    },
  );
}
