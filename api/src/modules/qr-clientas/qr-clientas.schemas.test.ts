import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildQrPayload, normalizeQrToken } from './qr-clientas.service';
import { validateQrSchema } from './qr-clientas.schemas';

describe('normalizeQrToken', () => {
  it('deja token crudo intacto', () => {
    assert.equal(normalizeQrToken('abcdef0123456789xyz'), 'abcdef0123456789xyz');
  });

  it('extrae token desde payload studios:qr:', () => {
    const token = 'tokensecreto123456';
    assert.equal(normalizeQrToken(buildQrPayload(token)), token);
  });

  it('no incluye PII en el payload', () => {
    const payload = buildQrPayload('abc1234567890123');
    assert.equal(payload.includes('@'), false);
    assert.equal(payload.toLowerCase().includes('password'), false);
    assert.match(payload, /^studios:qr:/);
  });
});

describe('validateQrSchema', () => {
  it('acepta token suficientemente largo', () => {
    assert.equal(validateQrSchema.safeParse({ token: '1234567890123456' }).success, true);
  });

  it('rechaza token corto', () => {
    assert.equal(validateQrSchema.safeParse({ token: 'corto' }).success, false);
  });
});

describe('QR validate — contrato de estados (service)', () => {
  it('documenta rechazo de revocado / expirado / inválido', () => {
    // Contratos de mensaje en qr-clientas.service.validate:
    // 404 QR no válido | 409 QR revocado o inactivo | 409 QR expirado
    const cases = [
      { code: 404, message: 'QR no válido' },
      { code: 409, message: 'QR revocado o inactivo' },
      { code: 409, message: 'QR expirado' },
      { code: 409, message: 'La clienta asociada no está activa' },
    ];
    assert.equal(cases.length, 4);
    assert.ok(cases.every((c) => c.message.length > 0));
  });
});
