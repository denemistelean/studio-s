import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loginBodySchema } from './auth.schemas';

describe('loginBodySchema', () => {
  it('acepta email y password válidos', () => {
    const parsed = loginBodySchema.safeParse({
      email: 'admin@automotorestrujillo.com',
      password: 'secreto1',
    });
    assert.equal(parsed.success, true);
  });

  it('rechaza email inválido', () => {
    const parsed = loginBodySchema.safeParse({
      email: 'admin',
      password: 'secreto1',
    });
    assert.equal(parsed.success, false);
  });

  it('rechaza password demasiado corto', () => {
    const parsed = loginBodySchema.safeParse({
      email: 'admin@automotorestrujillo.com',
      password: '123',
    });
    assert.equal(parsed.success, false);
  });

  it('rechaza body incompleto', () => {
    const parsed = loginBodySchema.safeParse({ email: 'admin@automotorestrujillo.com' });
    assert.equal(parsed.success, false);
  });
});
