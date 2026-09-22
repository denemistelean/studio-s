import { buildApp } from './app';
import { env } from './config/env';
import { safeErrorName } from './shared/utils/safe-error';

async function shutdown(close: () => Promise<void>, signal: string): Promise<void> {
  console.log(`Cerrando Studio S API (${signal})`);
  await close();
  process.exit(0);
}

async function main(): Promise<void> {
  const app = await buildApp();

  const onSignal = (signal: string) => {
    void shutdown(() => app.close(), signal).catch(() => {
      process.exit(1);
    });
  };

  process.once('SIGINT', () => {
    onSignal('SIGINT');
  });
  process.once('SIGTERM', () => {
    onSignal('SIGTERM');
  });

  await app.listen({ port: env.PORT, host: env.HOST });
  app.log.info({ host: env.HOST, port: env.PORT }, 'Studio S API en ejecución');
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : '';
  if (message.startsWith('Variables de entorno inválidas:')) {
    console.error(message);
  } else {
    const code =
      error && typeof error === 'object' && 'code' in error
        ? String((error as { code: unknown }).code)
        : '';
    if (code === 'EADDRINUSE') {
      console.error(
        `No se pudo iniciar Studio S API: el puerto ${env.PORT} ya está en uso. Liberá el puerto o cambiá PORT en .env.`,
      );
    } else {
      console.error(
        `No se pudo iniciar Studio S API (${safeErrorName(error)}${code ? `:${code}` : ''})`,
      );
      if (message) console.error(message);
    }
  }
  process.exit(1);
});
