import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AppError } from './app-error';

describe('AppError', () => {
  it('conserva status y details', () => {
    const err = new AppError(409, 'Conflicto', [{ field: 'estado' }]);
    assert.equal(err.statusCode, 409);
    assert.equal(err.message, 'Conflicto');
    assert.deepEqual(err.errors, [{ field: 'estado' }]);
  });

  it('defaults errors a array vacío', () => {
    const err = new AppError(404, 'No encontrado');
    assert.deepEqual(err.errors, []);
  });
});
