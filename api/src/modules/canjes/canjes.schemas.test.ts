import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createCanjeSchema, listCanjesQuerySchema } from './canjes.schemas';

describe('canjes.schemas', () => {
  it('crea canje con clienta y recompensa', () => {
    const parsed = createCanjeSchema.safeParse({
      id_clienta: 10,
      id_recompensa: 3,
      observaciones: 'Entrega en caja',
    });
    assert.equal(parsed.success, true);
  });

  it('filtra estados reales del enum', () => {
    assert.equal(
      listCanjesQuerySchema.safeParse({ estado: 'SOLICITADO' }).success,
      true,
    );
    assert.equal(listCanjesQuerySchema.safeParse({ estado: 'PENDIENTE' }).success, false);
  });
});
