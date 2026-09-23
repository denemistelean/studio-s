/**
 * Limpieza controlada de datos E2E — SOLO IDs explícitos.
 *
 * Uso:
 *   CONFIRM_CLEANUP=YES npx tsx scripts/cleanup-e2e.ts
 *
 * Aborta si NODE_ENV=production o DB_HOST no es localhost/127.0.0.1.
 * No imprime secretos.
 */
import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../src/generated/prisma/client';

/** IDs confirmados en docs/E2E_CLEANUP_REPORT.md — no ampliar sin nueva auditoría. */
const CLEANUP_CLIENTA_IDS = [3, 4, 5] as const;

function assertSafeEnvironment(): void {
  const nodeEnv = process.env.NODE_ENV ?? '';
  const host = (process.env.DB_HOST ?? '').toLowerCase();
  const dbName = process.env.DB_NAME ?? '';

  console.log('Entorno:');
  console.log(`  NODE_ENV=${nodeEnv}`);
  console.log(`  DB_HOST=${host}`);
  console.log(`  DB_PORT=${process.env.DB_PORT ?? ''}`);
  console.log(`  DB_NAME=${dbName}`);
  console.log(`  DB_USER=${process.env.DB_USER ?? ''}`);

  if (nodeEnv === 'production') {
    throw new Error('Abortado: NODE_ENV=production. No se ejecuta limpieza.');
  }
  if (host !== 'localhost' && host !== '127.0.0.1') {
    throw new Error(`Abortado: DB_HOST="${host}" no es local.`);
  }
  if (process.env.CONFIRM_CLEANUP !== 'YES') {
    throw new Error('Abortado: definí CONFIRM_CLEANUP=YES para ejecutar.');
  }
}

async function main(): Promise<void> {
  assertSafeEnvironment();

  const ids = CLEANUP_CLIENTA_IDS.map((id) => BigInt(id));
  console.log('Clientas a eliminar:', CLEANUP_CLIENTA_IDS.join(', '));

  const adapter = new PrismaMariaDb({
    host: process.env.DB_HOST!,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
    connectionLimit: 2,
    connectTimeout: 5000,
  });
  const prisma = new PrismaClient({ adapter });

  try {
    const existing = await prisma.clientas.findMany({
      where: { id_clienta: { in: ids } },
      select: { id_clienta: true, nombres: true, apellidos: true },
    });
    console.log('Clientas encontradas:', existing.length);
    for (const row of existing) {
      console.log(`  - ${row.id_clienta}: ${row.nombres} ${row.apellidos}`);
    }
    if (existing.length === 0) {
      console.log('Nada que eliminar (IDs ya ausentes).');
      return;
    }

    const countsBefore = {
      sesiones: await prisma.sesiones_clientas.count({ where: { id_clienta: { in: ids } } }),
      qr: await prisma.qr_clientas.count({ where: { id_clienta: { in: ids } } }),
      credenciales: await prisma.credenciales_clientas.count({
        where: { id_clienta: { in: ids } },
      }),
      sr: await prisma.servicios_realizados.count({ where: { id_clienta: { in: ids } } }),
      mov: await prisma.movimientos_puntos.count({ where: { id_clienta: { in: ids } } }),
      canjes: await prisma.canjes_recompensas.count({ where: { id_clienta: { in: ids } } }),
    };
    console.log('Conteos dependientes:', countsBefore);

    if (countsBefore.sr > 0 || countsBefore.mov > 0 || countsBefore.canjes > 0) {
      throw new Error(
        'Abortado: hay servicios/movimientos/canjes ligados. Revisá el reporte antes de ampliar el script.',
      );
    }

    await prisma.$transaction(async (tx) => {
      const delSesiones = await tx.sesiones_clientas.deleteMany({
        where: { id_clienta: { in: ids } },
      });
      const delQr = await tx.qr_clientas.deleteMany({
        where: { id_clienta: { in: ids } },
      });
      const delCred = await tx.credenciales_clientas.deleteMany({
        where: { id_clienta: { in: ids } },
      });
      const delClientas = await tx.clientas.deleteMany({
        where: { id_clienta: { in: ids } },
      });
      console.log('Eliminados:', {
        sesiones: delSesiones.count,
        qr: delQr.count,
        credenciales: delCred.count,
        clientas: delClientas.count,
      });
    });

    const remaining = await prisma.clientas.count({ where: { id_clienta: { in: ids } } });
    if (remaining !== 0) {
      throw new Error(`Verificación falló: aún quedan ${remaining} clientas E2E.`);
    }

    const preserved = {
      clientas: await prisma.clientas.count(),
      admins: await prisma.usuariosAdmin.count(),
      roles: await prisma.roles.count(),
      permisos: await prisma.permisos.count(),
      servicios: await prisma.servicios.count(),
    };
    console.log('Preservados (conteos globales):', preserved);
    console.log('Limpieza E2E OK.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : 'Error desconocido';
  console.error(msg);
  process.exit(1);
});
