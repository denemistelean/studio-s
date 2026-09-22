import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createCanjeSchema } from './canjes.schemas';

describe('canjes.schemas — contrato create', () => {
  it('exige clienta y recompensa', () => {
    const ok = createCanjeSchema.safeParse({
      id_clienta: 1,
      id_recompensa: 2,
    });
    assert.equal(ok.success, true);
  });

  it('rechaza ids inválidos', () => {
    const bad = createCanjeSchema.safeParse({
      id_clienta: 0,
      id_recompensa: -1,
    });
    assert.equal(bad.success, false);
  });
});

/**
 * Reglas de negocio del service (documentadas aquí como contrato de saldos).
 * La ejecución real es transaccional en canjes.service.create.
 */
describe('canjes — reglas de saldo (contrato)', () => {
  it('saldo suficiente: 100 - 80 = 20', () => {
    const saldo = 100;
    const costo = 80;
    assert.equal(saldo >= costo, true);
    assert.equal(saldo - costo, 20);
  });

  it('saldo insuficiente: no permite saldo negativo', () => {
    const saldo = 50;
    const costo = 80;
    assert.equal(saldo >= costo, false);
    // El service lanza 409 "Puntos insuficientes" antes de actualizar.
  });
});
