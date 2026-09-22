import bcrypt from 'bcryptjs';
import type { FastifyInstance } from 'fastify';
import { env } from '../../config/env';
import { AppError } from '../../shared/errors/app-error';
import type { AdminJwtPayload, AuthUserPublic, LoginBody, LoginResult } from './auth.types';

function toPublicUser(user: {
  idUsuario: bigint;
  email: string;
  nombres: string;
  apellidos: string;
  idRol: bigint;
}): AuthUserPublic {
  return {
    id_usuario: Number(user.idUsuario),
    email: user.email,
    nombres: user.nombres,
    apellidos: user.apellidos,
    id_rol: Number(user.idRol),
  };
}

function toJwtPayload(user: AuthUserPublic): AdminJwtPayload {
  return {
    sub: String(user.id_usuario),
    id: user.id_usuario,
    email: user.email,
    rol: user.id_rol,
  };
}

/**
 * Autenticación administrativa sobre UsuariosAdmin (tabla usuarios_admin).
 */
export class AuthService {
  constructor(private readonly app: FastifyInstance) {}

  async login(credentials: LoginBody): Promise<LoginResult> {
    const user = await this.app.prisma.usuariosAdmin.findUnique({
      where: { email: credentials.email },
      select: {
        idUsuario: true,
        idRol: true,
        email: true,
        nombres: true,
        apellidos: true,
        passwordHash: true,
        estado: true,
      },
    });

    if (!user || user.estado !== 'ACTIVO') {
      throw new AppError(401, 'Credenciales inválidas');
    }

    const passwordOk = await bcrypt.compare(credentials.password, user.passwordHash);
    if (!passwordOk) {
      throw new AppError(401, 'Credenciales inválidas');
    }

    await this.app.prisma.usuariosAdmin.update({
      where: { idUsuario: user.idUsuario },
      data: { ultimoAccesoEn: new Date() },
      select: { idUsuario: true },
    });

    const publicUser = toPublicUser(user);
    const accessToken = await this.app.jwt.sign(toJwtPayload(publicUser));

    return {
      accessToken,
      expiresIn: env.JWT_EXPIRES_IN,
      user: publicUser,
    };
  }

  async me(payload: AdminJwtPayload): Promise<AuthUserPublic> {
    const idUsuario = BigInt(payload.sub);

    const user = await this.app.prisma.usuariosAdmin.findUnique({
      where: { idUsuario },
      select: {
        idUsuario: true,
        idRol: true,
        email: true,
        nombres: true,
        apellidos: true,
        estado: true,
      },
    });

    if (!user || user.estado !== 'ACTIVO') {
      throw new AppError(401, 'Credenciales inválidas');
    }

    return toPublicUser(user);
  }
}
