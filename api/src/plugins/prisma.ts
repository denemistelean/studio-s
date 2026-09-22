import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { env } from '../config/env';
import { PrismaClient } from '../generated/prisma/client';
import { withTimeout } from '../shared/utils/with-timeout';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

async function prismaPlugin(app: FastifyInstance): Promise<void> {
  const adapter = new PrismaMariaDb({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    connectionLimit: 5,
    connectTimeout: 5000,
  });

  const prisma = new PrismaClient({ adapter });

  try {
    await withTimeout(prisma.$connect(), 4000);
  } catch (error) {
    app.log.warn(
      { name: error instanceof Error ? error.name : 'UnknownError' },
      'MariaDB no disponible al arrancar',
    );
  }

  app.decorate('prisma', prisma);
  app.addHook('onClose', async () => {
    await prisma.$disconnect();
  });
}

export default fp(prismaPlugin, { name: 'prisma' });
