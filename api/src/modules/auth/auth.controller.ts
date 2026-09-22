import type { FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../../shared/errors/app-error';
import { loginBodySchema } from './auth.schemas';
import { AuthService } from './auth.service';

/** Controlador opcional; las rutas también pueden invocar AuthService directamente. */
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async login(request: FastifyRequest, reply: FastifyReply) {
    const parsed = loginBodySchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(400, 'Datos de entrada no válidos');
    }

    const result = await this.authService.login(parsed.data);

    return reply.status(200).send({
      success: true,
      message: 'Login exitoso',
      data: result,
    });
  }

  async me(request: FastifyRequest, reply: FastifyReply) {
    const user = await this.authService.me(request.user);

    return reply.status(200).send({
      success: true,
      message: 'Usuario autenticado',
      data: { user },
    });
  }
}
