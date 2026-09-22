import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { buildCorsOptions } from './cors';

describe('buildCorsOptions (HTTP)', () => {
  const allowed = [
    'https://automotorestrujillo.com',
    'https://studio-s.vercel.app',
  ];

  async function withApp(
    run: (app: ReturnType<typeof Fastify>) => Promise<void>,
  ): Promise<void> {
    const app = Fastify({ logger: false });
    await app.register(cors, buildCorsOptions(allowed));
    app.get('/ping', async () => ({ ok: true }));
    await app.ready();

    try {
      await run(app);
    } finally {
      await app.close();
    }
  }

  it('refleja un origen permitido y credentials', async () => {
    await withApp(async (app) => {
      const response = await app.inject({
        method: 'GET',
        url: '/ping',
        headers: { origin: 'https://studio-s.vercel.app' },
      });

      assert.equal(response.statusCode, 200);
      assert.equal(
        response.headers['access-control-allow-origin'],
        'https://studio-s.vercel.app',
      );
      assert.equal(response.headers['access-control-allow-credentials'], 'true');
    });
  });

  it('no refleja un origen no permitido', async () => {
    await withApp(async (app) => {
      const response = await app.inject({
        method: 'GET',
        url: '/ping',
        headers: { origin: 'https://evil.example' },
      });

      assert.equal(response.statusCode, 200);
      assert.equal(response.headers['access-control-allow-origin'], undefined);
    });
  });

  it('acepta solicitudes sin Origin', async () => {
    await withApp(async (app) => {
      const response = await app.inject({
        method: 'GET',
        url: '/ping',
      });

      assert.equal(response.statusCode, 200);
      assert.equal(response.body, JSON.stringify({ ok: true }));
    });
  });

  it('acepta preflight OPTIONS para un origen de la lista múltiple', async () => {
    await withApp(async (app) => {
      const response = await app.inject({
        method: 'OPTIONS',
        url: '/ping',
        headers: {
          origin: 'https://automotorestrujillo.com',
          'access-control-request-method': 'POST',
          'access-control-request-headers': 'content-type,authorization',
        },
      });

      assert.ok(response.statusCode === 204 || response.statusCode === 200);
      assert.equal(
        response.headers['access-control-allow-origin'],
        'https://automotorestrujillo.com',
      );
      assert.equal(response.headers['access-control-allow-credentials'], 'true');

      const allowMethods = String(response.headers['access-control-allow-methods'] ?? '');
      assert.match(allowMethods, /GET/i);
      assert.match(allowMethods, /HEAD/i);
      assert.match(allowMethods, /POST/i);
      assert.match(allowMethods, /OPTIONS/i);

      const allowHeaders = String(response.headers['access-control-allow-headers'] ?? '');
      assert.match(allowHeaders, /content-type/i);
      assert.match(allowHeaders, /authorization/i);
    });
  });
});
