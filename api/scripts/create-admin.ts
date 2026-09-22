/**
 * Alta única del primer administrador (tabla usuarios_admin / modelo UsuariosAdmin).
 * No imprime ni registra contraseñas ni passwordHash.
 *
 * Uso (pasa ADMIN_* por el entorno; no las versionas en el repo):
 *   npm run admin:create
 *   npm run admin:create -- --help
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../src/generated/prisma/client';

const BCRYPT_ROUNDS = 12;

const HELP_TEXT = `
Studio S — crear primer administrador

Script npm:
  npm run admin:create

Variables de entorno requeridas:
  ADMIN_EMAIL
  ADMIN_PASSWORD      (mínimo 12 caracteres; no la guardes en el repo)
  ADMIN_NOMBRES
  ADMIN_APELLIDOS
  ADMIN_ID_ROL        (número entero positivo)

También necesita la conexión MariaDB (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD),
que puede venir del archivo .env local.

El script:
  - valida la entrada
  - comprueba si el email ya existe (si existe, no modifica nada)
  - crea el registro con estado ACTIVO y passwordHash (bcryptjs)
  - cierra Prisma al terminar
`.trim();

const adminInputSchema = z.object({
  ADMIN_EMAIL: z.string().trim().email().max(150),
  ADMIN_PASSWORD: z.string().min(12).max(128),
  ADMIN_NOMBRES: z.string().trim().min(1).max(100),
  ADMIN_APELLIDOS: z.string().trim().min(1).max(100),
  ADMIN_ID_ROL: z.coerce.number().int().positive(),
});

const dbSchema = z.object({
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive(),
  DB_NAME: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
});

function wantsHelp(argv: string[]): boolean {
  return argv.some((arg) => arg === '--help' || arg === '-h');
}

function createPrisma(): PrismaClient {
  const db = dbSchema.parse(process.env);
  const adapter = new PrismaMariaDb({
    host: db.DB_HOST,
    port: db.DB_PORT,
    user: db.DB_USER,
    password: db.DB_PASSWORD,
    database: db.DB_NAME,
    connectionLimit: 1,
    connectTimeout: 10000,
  });
  return new PrismaClient({ adapter });
}

async function createAdmin(): Promise<void> {
  const parsedAdmin = adminInputSchema.safeParse(process.env);
  if (!parsedAdmin.success) {
    const fields = parsedAdmin.error.issues
      .map((issue) => issue.path.join('.') || 'entrada')
      .join(', ');
    throw new Error(
      `Variables ADMIN_* inválidas: ${fields}. Revisa email, password (mín. 12), nombres, apellidos e id de rol.`,
    );
  }

  const {
    ADMIN_EMAIL: email,
    ADMIN_PASSWORD: password,
    ADMIN_NOMBRES: nombres,
    ADMIN_APELLIDOS: apellidos,
    ADMIN_ID_ROL: idRolNumber,
  } = parsedAdmin.data;

  // No hay modelo Roles en schema.prisma: idRol es un BigInt escalar.
  const idRol = BigInt(idRolNumber);
  const prisma = createPrisma();

  try {
    await prisma.$connect();

    const existing = await prisma.usuariosAdmin.findUnique({
      where: { email },
      select: { idUsuario: true },
    });

    if (existing) {
      console.error(
        `Ya existe un administrador con ese email (id_usuario=${existing.idUsuario.toString()}). No se modificó ningún registro.`,
      );
      process.exitCode = 1;
      return;
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const created = await prisma.usuariosAdmin.create({
      data: {
        email,
        nombres,
        apellidos,
        idRol,
        passwordHash,
        estado: 'ACTIVO',
        ultimoAccesoEn: null,
      },
      select: {
        idUsuario: true,
        email: true,
        nombres: true,
        apellidos: true,
        idRol: true,
        estado: true,
      },
    });

    console.log('Administrador creado correctamente.');
    console.log(
      JSON.stringify(
        {
          id_usuario: created.idUsuario.toString(),
          email: created.email,
          nombres: created.nombres,
          apellidos: created.apellidos,
          id_rol: created.idRol.toString(),
          estado: created.estado,
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function main(): Promise<void> {
  if (wantsHelp(process.argv.slice(2))) {
    console.log(HELP_TEXT);
    return;
  }

  await createAdmin();
}

main().catch((error: unknown) => {
  const raw = error instanceof Error ? error.message : 'Error desconocido al crear administrador';
  console.error(raw.replace(/passwordHash|password|hash/gi, '[redacted]'));
  process.exitCode = 1;
});
