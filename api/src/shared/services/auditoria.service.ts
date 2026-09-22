import type { FastifyInstance } from 'fastify';

type AuditInput = {
  idUsuarioAdmin: bigint | null;
  accion: string;
  tablaAfectada?: string | null;
  registroId?: bigint | null;
  datosAnteriores?: unknown;
  datosNuevos?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
};

const SENSITIVE_KEY = /password|password_hash|passwordHash|token|secret|authorization|jwt/i;

function scrub(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(scrub);
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      out[key] = SENSITIVE_KEY.test(key) ? '[redacted]' : scrub(nested);
    }
    return out;
  }
  return value;
}

function asJsonText(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  return JSON.stringify(scrub(value));
}

/** Registra en `auditoria` sin secretos/password/JWT. */
export async function writeAuditoria(
  app: FastifyInstance,
  input: AuditInput,
): Promise<void> {
  await app.prisma.auditoria.create({
    data: {
      id_usuario_admin: input.idUsuarioAdmin,
      accion: input.accion.slice(0, 100),
      tabla_afectada: input.tablaAfectada ?? null,
      registro_id: input.registroId ?? null,
      datos_anteriores: asJsonText(input.datosAnteriores),
      datos_nuevos: asJsonText(input.datosNuevos),
      ip_address: input.ipAddress?.slice(0, 45) ?? null,
      user_agent: input.userAgent?.slice(0, 500) ?? null,
    },
  });
}
