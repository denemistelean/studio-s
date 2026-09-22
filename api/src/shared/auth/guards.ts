import type { FastifyRequest, preHandlerHookHandler } from 'fastify';
import { AppError } from '../errors/app-error';
import { isPermissionAllowed } from './permisos';

async function loadPermisosCodigos(
  request: FastifyRequest,
  idRol: bigint,
): Promise<string[]> {
  const rows = await request.server.prisma.rol_permisos.findMany({
    where: { id_rol: idRol },
    select: {
      permisos: { select: { codigo: true } },
    },
  });
  return rows.map((row) => row.permisos.codigo);
}

export const requireAuth: preHandlerHookHandler = async (request) => {
  try {
    await request.jwtVerify();
  } catch {
    throw new AppError(401, 'No autenticado');
  }
};

export function requireRoles(...allowedRoleIds: number[]): preHandlerHookHandler {
  return async (request) => {
    try {
      await request.jwtVerify();
    } catch {
      throw new AppError(401, 'No autenticado');
    }

    if (!allowedRoleIds.includes(request.user.rol)) {
      throw new AppError(403, 'No autorizado');
    }
  };
}

/**
 * Autorización por `permisos.codigo` EXACTO vía `rol_permisos`.
 *
 * ## Modo bootstrap (documentado; no eliminar aún)
 * Si el rol **no tiene ninguna fila** en `rol_permisos` (`assigned.length === 0`),
 * se permite el acceso a cualquier ruta autenticada. Sirve para entornos donde
 * la matriz aún no está asignada al rol del administrador inicial.
 *
 * Cuando el rol **sí** tiene permisos asignados, exige que al menos uno de
 * `codigos` coincida literalmente con `permisos.codigo` (ej. `CLIENTAS_VER`).
 */
export function requirePermission(...codigos: string[]): preHandlerHookHandler {
  return async (request) => {
    try {
      await request.jwtVerify();
    } catch {
      throw new AppError(401, 'No autenticado');
    }

    const assigned = await loadPermisosCodigos(request, BigInt(request.user.rol));
    if (!isPermissionAllowed(assigned, codigos)) {
      throw new AppError(403, 'No autorizado');
    }
  };
}

export async function getPermisosForRequest(request: FastifyRequest): Promise<string[]> {
  await request.jwtVerify();
  return loadPermisosCodigos(request, BigInt(request.user.rol));
}
