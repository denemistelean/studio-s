import type { PrismaClient } from '../../generated/prisma/client';
import { withTimeout } from '../../shared/utils/with-timeout';

export type DatabaseStatus = 'connected' | 'disconnected';

export async function checkDatabase(prisma: PrismaClient): Promise<DatabaseStatus> {
  await withTimeout(prisma.$queryRaw`SELECT 1`, 4000);
  return 'connected';
}
