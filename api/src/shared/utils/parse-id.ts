import { AppError } from '../errors/app-error';

/** Convierte un param de ruta a BigInt de forma segura. */
export function parseBigIntId(raw: string | undefined, fieldName = 'id'): bigint {
  if (!raw || !/^\d+$/.test(raw)) {
    throw new AppError(400, `${fieldName} no válido`);
  }

  try {
    return BigInt(raw);
  } catch {
    throw new AppError(400, `${fieldName} no válido`);
  }
}

/** Lee `params.id` (u otro campo) sin forzar genéricos de FastifyRequest. */
export function idFromParams(params: unknown, fieldName = 'id'): bigint {
  const value = (params as Record<string, string | undefined>)[fieldName];
  return parseBigIntId(value, fieldName);
}
