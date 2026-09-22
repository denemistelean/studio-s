import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createUsuarioAdminSchema, updateUsuarioAdminEstadoSchema } from './usuarios-admin.schemas';

describe('usuarios-admin schemas', () => {
  it('acepta alta válida', () => {
    const parsed = createUsuarioAdminSchema.safeParse({
      email: 'admin@ejemplo.com',
      password: 'passwordsegura1',
      nombres: 'Ana',
      apellidos: 'Pérez',
      id_rol: 1,
    });
    assert.equal(parsed.success, true);
  });

  it('rechaza password corto', () => {
    const parsed = createUsuarioAdminSchema.safeParse({
      email: 'admin@ejemplo.com',
      password: 'corto',
      nombres: 'Ana',
      apellidos: 'Pérez',
      id_rol: 1,
    });
    assert.equal(parsed.success, false);
  });

  it('valida estados permitidos', () => {
    assert.equal(updateUsuarioAdminEstadoSchema.safeParse({ estado: 'ACTIVO' }).success, true);
    assert.equal(updateUsuarioAdminEstadoSchema.safeParse({ estado: 'ELIMINADO' }).success, false);
  });
});
