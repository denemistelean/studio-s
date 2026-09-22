import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ajustarPuntosSchema, listMovimientosQuerySchema } from './puntos.schemas';

describe('puntos.schemas', () => {
  it('solo permite ajustes positivos/negativos manuales', () => {
    const ok = ajustarPuntosSchema.safeParse({
      id_clienta: 1,
      tipo: 'AJUSTE_POSITIVO',
      puntos: 50,
    });
    assert.equal(ok.success, true);

    const bad = ajustarPuntosSchema.safeParse({
      id_clienta: 1,
      tipo: 'ACUMULACION',
      puntos: 50,
    });
    assert.equal(bad.success, false);
  });

  it('filtra tipos reales del enum', () => {
    const parsed = listMovimientosQuerySchema.safeParse({ tipo: 'CANJE' });
    assert.equal(parsed.success, true);

    const invalid = listMovimientosQuerySchema.safeParse({ tipo: 'BONO' });
    assert.equal(invalid.success, false);
  });
});
