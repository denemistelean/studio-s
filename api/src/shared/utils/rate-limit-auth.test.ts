import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  AUTH_RATE_LIMIT,
  checkAuthRateLimit,
  resetAuthRateLimitBuckets,
} from '../../plugins/rate-limit-auth';
import { AppError } from '../errors/app-error';

function fakeRequest(ip: string) {
  return { ip } as Parameters<typeof checkAuthRateLimit>[0];
}

describe('auth rate limit', () => {
  it(`bloquea después de ${AUTH_RATE_LIMIT.max} intentos en la ventana`, () => {
    resetAuthRateLimitBuckets();
    const req = fakeRequest('203.0.113.10');
    for (let i = 0; i < AUTH_RATE_LIMIT.max; i += 1) {
      checkAuthRateLimit(req, 'test.route');
    }
    assert.throws(
      () => checkAuthRateLimit(req, 'test.route'),
      (err: unknown) => err instanceof AppError && err.statusCode === 429,
    );
  });

  it('aísla por IP y ruta', () => {
    resetAuthRateLimitBuckets();
    const a = fakeRequest('203.0.113.11');
    const b = fakeRequest('203.0.113.12');
    for (let i = 0; i < AUTH_RATE_LIMIT.max; i += 1) {
      checkAuthRateLimit(a, 'test.a');
    }
    assert.doesNotThrow(() => checkAuthRateLimit(b, 'test.a'));
    assert.doesNotThrow(() => checkAuthRateLimit(a, 'test.b'));
  });
});
