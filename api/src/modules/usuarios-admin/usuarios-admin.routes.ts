import type { FastifyInstance, FastifyReply } from 'fastify';
import { AppError } from '../../shared/errors/app-error';
import { requirePermission } from '../../shared/auth/guards';
import { PERMISOS } from '../../shared/auth/permisos';
import { idFromParams } from '../../shared/utils/parse-id';
import {
  createUsuarioAdminSchema,
  listUsuariosAdminQuerySchema,
  updateUsuarioAdminEstadoSchema,
  updateUsuarioAdminSchema,
} from './usuarios-admin.schemas';
import { UsuariosAdminService } from './usuarios-admin.service';

export async function usuariosAdminRoutes(app: FastifyInstance): Promise<void> {
  const service = new UsuariosAdminService(app);

  app.addHook('preHandler', requirePermission(PERMISOS.USUARIOS_GESTIONAR));

  app.get('/usuarios-admin', async (request, reply) => {
    const parsed = listUsuariosAdminQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      throw new AppError(400, 'Parámetros de consulta no válidos', parsed.error.issues);
    }

    const data = await service.list(parsed.data);
    return reply.send({
      success: true,
      message: 'Listado de usuarios administrativos',
      data,
    });
  });

  app.get('/usuarios-admin/:id', async (request, reply) => {
    const id = idFromParams(request.params);
    const user = await service.getById(id);
    return reply.send({
      success: true,
      message: 'Usuario administrativo',
      data: { user },
    });
  });

  app.post('/usuarios-admin', async (request, reply: FastifyReply) => {
    const parsed = createUsuarioAdminSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(400, 'Datos de entrada no válidos', parsed.error.issues);
    }

    const user = await service.create(parsed.data);
    return reply.status(201).send({
      success: true,
      message: 'Usuario administrativo creado',
      data: { user },
    });
  });

  app.patch('/usuarios-admin/:id', async (request, reply) => {
    const id = idFromParams(request.params);
    const parsed = updateUsuarioAdminSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(400, 'Datos de entrada no válidos', parsed.error.issues);
    }

    const user = await service.update(id, parsed.data);
    return reply.send({
      success: true,
      message: 'Usuario administrativo actualizado',
      data: { user },
    });
  });

  app.patch('/usuarios-admin/:id/estado', async (request, reply) => {
    const id = idFromParams(request.params);
    const parsed = updateUsuarioAdminEstadoSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(400, 'Datos de entrada no válidos', parsed.error.issues);
    }

    const user = await service.updateEstado(id, parsed.data);
    return reply.send({
      success: true,
      message: 'Estado de usuario actualizado',
      data: { user },
    });
  });
}
