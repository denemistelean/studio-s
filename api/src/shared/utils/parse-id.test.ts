import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AppError } from '../errors/app-error';
import { parseBigIntId } from './parse-id';

describe('parseBigIntId', () => {
  it('parsea ids numéricos', () => {
    assert.equal(parseBigIntId('42'), 42n);
  });

  it('rechaza ids no numéricos', () => {
    assert.throws(() => parseBigIntId('abc'), AppError);
  });
});
