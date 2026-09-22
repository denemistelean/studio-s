import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { newCodigoCanje, newOpaqueToken, sha256Hex } from './ids';

describe('ids utils', () => {
  it('genera codigo_canje de 12 chars', () => {
    const code = newCodigoCanje();
    assert.equal(code.length, 12);
    assert.match(code, /^[A-Z0-9]+$/);
  });

  it('token opaco con hash sha256 de 64 hex', () => {
    const { token, tokenHash } = newOpaqueToken();
    assert.ok(token.length >= 32);
    assert.equal(tokenHash.length, 64);
    assert.equal(tokenHash, sha256Hex(token));
  });
});
