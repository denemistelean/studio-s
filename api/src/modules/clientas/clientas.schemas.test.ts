import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createClientaSchema,
  listClientasQuerySchema,
  updateClientaEstadoSchema,
} from './clientas.schemas';

describe('clientas.schemas', () => {
  it('lista con paginación por defecto', () => {
    const parsed = listClientasQuerySchema.safeParse({});
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.page, 1);
      assert.equal(parsed.data.limit, 20);
    }
  });

  it('crea clienta válida', () => {
    const parsed = createClientaSchema.safeParse({
      nombres: 'Ana',
      apellidos: 'Pérez',
      telefono: '999111222',
    });
    assert.equal(parsed.success, true);
  });

  it('rechaza estado inválido', () => {
    const parsed = updateClientaEstadoSchema.safeParse({ estado: 'SUSPENDIDA' });
    assert.equal(parsed.success, false);
  });
});
