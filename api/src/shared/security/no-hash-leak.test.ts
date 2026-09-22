import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const SRC = join(__dirname, '../..');

function read(rel: string) {
  return readFileSync(join(SRC, rel), 'utf8');
}

describe('seguridad — toPublic no expone hashes', () => {
  it('credenciales toPublic sin password_hash', () => {
    const src = read('modules/credenciales-clientas/credenciales-clientas.service.ts');
    const start = src.indexOf('function toPublic');
    const end = src.indexOf('export class', start);
    const body = src.slice(start, end);
    assert.ok(body.includes('email:'));
    assert.equal(body.includes('password_hash'), false);
  });

  it('QR toPublic sin token_hash', () => {
    const src = read('modules/qr-clientas/qr-clientas.service.ts');
    const start = src.indexOf('function toPublic');
    const end = src.indexOf('export class', start);
    const body = src.slice(start, end);
    assert.equal(body.includes('token_hash'), false);
  });

  it('sesiones toPublic sin token_hash', () => {
    const src = read('modules/sesiones-clientas/sesiones-clientas.service.ts');
    const start = src.indexOf('function toPublic');
    const end = src.indexOf('export class', start);
    const body = src.slice(start, end);
    assert.equal(body.includes('token_hash'), false);
  });

  it('auth admin toPublicUser sin passwordHash', () => {
    const src = read('modules/auth/auth.service.ts');
    const start = src.indexOf('function toPublicUser');
    const end = src.indexOf('function toJwtPayload', start);
    const body = src.slice(start, end);
    assert.equal(body.includes('passwordHash'), false);
    assert.equal(body.includes('password_hash'), false);
  });
});
