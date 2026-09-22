import helmet from '@fastify/helmet';
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

async function securityPlugin(app: FastifyInstance): Promise<void> {
  await app.register(helmet);
}

export default fp(securityPlugin, { name: 'security' });
