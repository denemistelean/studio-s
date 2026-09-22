import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createRecompensaSchema,
  updateRecompensaEstadoSchema,
} from './recompensas.schemas';

describe('recompensas.schemas', () => {
  it('crea recompensa con puntos requeridos', () => {
    const parsed = createRecompensaSchema.safeParse({
      nombre: 'Esmalte gratis',
      puntos_requeridos: 100,
      stock: 5,
      limite_por_clienta: 1,
    });
    assert.equal(parsed.success, true);
  });

  it('rechaza puntos cero', () => {
    const parsed = createRecompensaSchema.safeParse({
      nombre: 'X',
      puntos_requeridos: 0,
    });
    assert.equal(parsed.success, false);
  });

  it('estado solo ACTIVA/INACTIVA', () => {
    assert.equal(updateRecompensaEstadoSchema.safeParse({ estado: 'ACTIVA' }).success, true);
    assert.equal(updateRecompensaEstadoSchema.safeParse({ estado: 'AGOTADA' }).success, false);
  });
});
