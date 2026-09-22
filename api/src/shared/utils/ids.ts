import { createHash, randomBytes, randomUUID } from 'node:crypto';

export function newUuid(): string {
  return randomUUID();
}

/** Código de canje: exactamente 12 caracteres [A-Z0-9]. */
export function newCodigoCanje(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(12);
  let out = '';
  for (let i = 0; i < 12; i += 1) {
    out += alphabet[bytes[i]! % alphabet.length];
  }
  return out;
}

export function sha256Hex(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

/** Token opaco + hash SHA-256 (64 hex) para qr_clientas / sesiones_clientas. */
export function newOpaqueToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: sha256Hex(token) };
}

export function toNumberId(value: bigint | number): number {
  return typeof value === 'bigint' ? Number(value) : value;
}

export function decimalToString(value: { toString(): string } | string | number): string {
  return typeof value === 'string' ? value : value.toString();
}

/**
 * UUID determinista (v4-shaped) para cada línea de una atención multi-servicio.
 * Permite idempotencia sin tabla cabecera.
 */
export function attentionLineIdempotencyKey(
  attentionKey: string,
  index: number,
  idServicio: number,
): string {
  const digest = createHash('sha256')
    .update(`studios-atencion:${attentionKey}:${index}:${idServicio}`, 'utf8')
    .digest();
  const bytes = Buffer.from(digest.subarray(0, 16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

export function attentionMarker(attentionKey: string): string {
  return `[atencion:${attentionKey}]`;
}
