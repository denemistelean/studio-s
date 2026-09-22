import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Contrato documentado: canjes_recompensas NO tiene idempotency_key.
 * La protección concurrente de saldo/stock usa updateMany condicional.
 */
describe('canjes — concurrencia e idempotencia (contrato código)', () => {
  const src = readFileSync(
    join(__dirname, 'canjes.service.ts'),
    'utf8',
  );

  it('create usa $transaction', () => {
    assert.ok(src.includes('$transaction'));
  });

  it('decrementa puntos con condición gte (anti carrera)', () => {
    assert.ok(src.includes('puntos_saldo: { gte: puntos }'));
    assert.ok(src.includes('puntos_saldo: { decrement: puntos }'));
  });

  it('decrementa stock con condición gte cuando aplica', () => {
    assert.ok(src.includes('stock: { gte: 1 }'));
    assert.ok(src.includes('stock: { decrement: 1 }'));
  });

  it('entregar solo actualiza si estado SOLICITADO', () => {
    assert.ok(src.includes("estado: 'SOLICITADO'"));
    assert.ok(src.includes('updateMany'));
  });

  it('documenta: idempotency de canje requiere cambio de schema', () => {
    // Sin columna idempotency_key en canjes_recompensas no hay dedupe HTTP real.
    assert.equal(src.includes('idempotency_key'), false);
  });
});
