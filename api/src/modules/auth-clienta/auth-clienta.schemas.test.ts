import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  loginClientaSchema,
  registroClientaSchema,
} from './auth-clienta.schemas';
import { hashClientaToken } from './auth-clienta.service';

describe('auth-clienta.schemas', () => {
  it('acepta registro válido', () => {
    const parsed = registroClientaSchema.safeParse({
      nombres: 'Ana',
      apellidos: 'Pérez',
      email: 'ana@example.com',
      password: 'secreto123',
      telefono: '999111222',
      fecha_nacimiento: '1995-05-10',
    });
    assert.equal(parsed.success, true);
  });

  it('rechaza email inválido en registro', () => {
    const parsed = registroClientaSchema.safeParse({
      nombres: 'Ana',
      apellidos: 'Pérez',
      email: 'no-es-email',
      password: 'secreto123',
    });
    assert.equal(parsed.success, false);
  });

  it('rechaza password corta', () => {
    const parsed = registroClientaSchema.safeParse({
      nombres: 'Ana',
      apellidos: 'Pérez',
      email: 'ana@example.com',
      password: 'corta',
    });
    assert.equal(parsed.success, false);
  });

  it('acepta login válido', () => {
    const parsed = loginClientaSchema.safeParse({
      email: 'ana@example.com',
      password: 'secreto123',
    });
    assert.equal(parsed.success, true);
  });

  it('rechaza login sin password', () => {
    const parsed = loginClientaSchema.safeParse({
      email: 'ana@example.com',
    });
    assert.equal(parsed.success, false);
  });
});

describe('hashClientaToken', () => {
  it('genera hash SHA-256 de 64 hex', () => {
    const hash = hashClientaToken('token-de-prueba');
    assert.equal(hash.length, 64);
    assert.match(hash, /^[a-f0-9]{64}$/);
  });

  it('es determinista', () => {
    assert.equal(hashClientaToken('abc'), hashClientaToken('abc'));
  });
});
