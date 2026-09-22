import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  hasOpenCorsOrigin,
  isCorsOriginAllowed,
  resolveCorsOrigins,
  splitOrigins,
} from './cors-origins';

describe('splitOrigins', () => {
  it('elimina espacios alrededor de cada origen', () => {
    assert.deepEqual(
      splitOrigins(' https://a.example , https://b.example '),
      ['https://a.example', 'https://b.example'],
    );
  });
});

describe('resolveCorsOrigins', () => {
  it('usa CORS_ORIGINS cuando está definido', () => {
    assert.deepEqual(
      resolveCorsOrigins({
        CORS_ORIGINS: 'https://automotorestrujillo.com,https://studio-s.vercel.app',
        CORS_ORIGIN: 'http://localhost:3000',
      }),
      ['https://automotorestrujillo.com', 'https://studio-s.vercel.app'],
    );
  });

  it('usa CORS_ORIGIN si CORS_ORIGINS no existe', () => {
    assert.deepEqual(
      resolveCorsOrigins({
        CORS_ORIGIN: 'http://localhost:3000',
      }),
      ['http://localhost:3000'],
    );
  });

  it('soporta varios orígenes en CORS_ORIGINS', () => {
    assert.deepEqual(
      resolveCorsOrigins({
        CORS_ORIGINS: ' https://a.com , https://b.com,https://c.com ',
      }),
      ['https://a.com', 'https://b.com', 'https://c.com'],
    );
  });
});

describe('hasOpenCorsOrigin', () => {
  it('detecta * y true', () => {
    assert.equal(hasOpenCorsOrigin(['*']), true);
    assert.equal(hasOpenCorsOrigin(['TRUE']), true);
    assert.equal(hasOpenCorsOrigin(['https://app.example']), false);
  });
});

describe('isCorsOriginAllowed', () => {
  const allowed = [
    'https://automotorestrujillo.com',
    'https://studio-s.vercel.app',
  ];

  it('permite un origen autorizado', () => {
    assert.equal(isCorsOriginAllowed('https://studio-s.vercel.app', allowed), true);
  });

  it('rechaza un origen no autorizado', () => {
    assert.equal(isCorsOriginAllowed('https://evil.example', allowed), false);
  });

  it('permite solicitudes sin Origin', () => {
    assert.equal(isCorsOriginAllowed(undefined, allowed), true);
    assert.equal(isCorsOriginAllowed('', allowed), true);
  });

  it('nunca permite * aunque figure en la lista', () => {
    assert.equal(isCorsOriginAllowed('*', ['*']), false);
  });

  it('en development permite LAN privada solo en puerto 3001', () => {
    assert.equal(
      isCorsOriginAllowed('http://192.168.0.31:3001', allowed, {
        allowPrivateLanInDev: true,
      }),
      true,
    );
    assert.equal(
      isCorsOriginAllowed('http://192.168.0.31:3000', allowed, {
        allowPrivateLanInDev: true,
      }),
      false,
    );
    assert.equal(
      isCorsOriginAllowed('http://evil.example:3001', allowed, {
        allowPrivateLanInDev: true,
      }),
      false,
    );
  });
});
