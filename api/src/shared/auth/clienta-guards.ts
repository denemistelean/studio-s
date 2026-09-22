import type { FastifyRequest, preHandlerHookHandler } from 'fastify';
import { AppError } from '../errors/app-error';
import { sha256Hex } from '../utils/ids';

export type ClientaAuthContext = {
  id_clienta: bigint;
  id_sesion: bigint;
  token_hash: string;
  email: string;
};

declare module 'fastify' {
  interface FastifyRequest {
    clientaAuth?: ClientaAuthContext;
  }
}

function extractBearer(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  if (!header || typeof header !== 'string') return null;
  const [scheme, token] = header.split(' ');
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') return null;
  return token.trim() || null;
}

/**
 * Autenticación de clienta vía `sesiones_clientas.token_hash` (token opaco).
 * Independiente del JWT de usuarios_admin.
 */
export const requireClientaAuth: preHandlerHookHandler = async (request) => {
  const token = extractBearer(request);
  if (!token) {
    throw new AppError(401, 'No autenticado');
  }

  const tokenHash = sha256Hex(token);
  const sesion = await request.server.prisma.sesiones_clientas.findUnique({
    where: { token_hash: tokenHash },
    include: {
      clientas: {
        include: {
          credenciales_clientas: true,
        },
      },
    },
  });

  if (!sesion || sesion.revocada_en || sesion.expira_en.getTime() <= Date.now()) {
    throw new AppError(401, 'No autenticado');
  }

  const clienta = sesion.clientas;
  const credencial = clienta.credenciales_clientas;

  if (clienta.estado !== 'ACTIVA') {
    throw new AppError(401, 'No autenticado');
  }
  if (!credencial || credencial.estado !== 'ACTIVA') {
    throw new AppError(401, 'No autenticado');
  }

  request.clientaAuth = {
    id_clienta: clienta.id_clienta,
    id_sesion: sesion.id_sesion,
    token_hash: tokenHash,
    email: credencial.email,
  };
};
