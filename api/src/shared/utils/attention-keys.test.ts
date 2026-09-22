import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  attentionLineIdempotencyKey,
  attentionMarker,
} from './ids';

describe('attentionLineIdempotencyKey', () => {
  const key = '550e8400-e29b-41d4-a716-446655440000';

  it('es determinista por índice y servicio', () => {
    const a = attentionLineIdempotencyKey(key, 0, 1);
    const b = attentionLineIdempotencyKey(key, 0, 1);
    assert.equal(a, b);
    assert.match(a, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('cambia con índice o servicio', () => {
    const a = attentionLineIdempotencyKey(key, 0, 1);
    const b = attentionLineIdempotencyKey(key, 1, 1);
    const c = attentionLineIdempotencyKey(key, 0, 2);
    assert.notEqual(a, b);
    assert.notEqual(a, c);
  });

  it('marcador de atención estable', () => {
    assert.equal(attentionMarker(key), `[atencion:${key}]`);
  });
});
