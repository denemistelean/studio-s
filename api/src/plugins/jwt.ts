import fjwt from '@fastify/jwt';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { env } from '../config/env';
import { AppError } from '../shared/errors/app-error';
import type { AdminJwtPayload } from '../modules/auth/auth.types';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AdminJwtPayload;
    user: AdminJwtPayload;
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

async function jwtPlugin(app: FastifyInstance): Promise<void> {
  await app.register(fjwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: env.JWT_EXPIRES_IN,
    },
  });

  app.decorate('authenticate', async (request: FastifyRequest, _reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch {
      throw new AppError(401, 'No autenticado');
    }
  });
}

export default fp(jwtPlugin, { name: 'jwt' });
