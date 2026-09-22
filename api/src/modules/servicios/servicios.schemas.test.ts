import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createServicioSchema,
  updateServicioEstadoSchema,
} from './servicios.schemas';

describe('servicios.schemas', () => {
  it('crea servicio con precio y puntos', () => {
    const parsed = createServicioSchema.safeParse({
      nombre: 'Manicure',
      descripcion: 'Servicio básico',
      precio: 45.5,
      puntos_otorgados: 10,
    });
    assert.equal(parsed.success, true);
  });

  it('rechaza precio negativo', () => {
    const parsed = createServicioSchema.safeParse({
      nombre: 'X',
      precio: -1,
      puntos_otorgados: 0,
    });
    assert.equal(parsed.success, false);
  });

  it('acepta cambio de estado', () => {
    const parsed = updateServicioEstadoSchema.safeParse({ estado: 'INACTIVO' });
    assert.equal(parsed.success, true);
  });
});
