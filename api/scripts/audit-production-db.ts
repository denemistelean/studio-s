/**
 * Auditoría READ-ONLY de la BD de producción (ejecutar EN cPanel).
 *
 * Requiere: AUDIT_PRODUCTION=YES
 *
 * Uso en cPanel (Application Root = api):
 *   export AUDIT_PRODUCTION=YES
 *   npm run audit:production
 *
 * NO ejecuta INSERT/UPDATE/DELETE/ALTER/DROP/TRUNCATE/CREATE
 * ni prisma migrate / db push.
 *
 * Nunca imprime: DB_PASSWORD, JWT_SECRET, DATABASE_URL con password,
 * password_hash, token_hash.
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import mariadb from 'mariadb';

const EXPECTED_TABLES = [
  'auditoria',
  'canjes_recompensas',
  'clientas',
  'credenciales_clientas',
  'movimientos_puntos',
  'permisos',
  'qr_clientas',
  'recompensas',
  'rol_permisos',
  'roles',
  'servicios',
  'servicios_realizados',
  'sesiones_clientas',
  'usuarios_admin',
] as const;

const EXPECTED_ROLES = ['SUPER_ADMIN', 'ADMINISTRADOR', 'RECEPCIONISTA'] as const;

const EXPECTED_PERMISSIONS = [
  'DASHBOARD_VER',
  'CLIENTAS_VER',
  'CLIENTAS_CREAR',
  'CLIENTAS_EDITAR',
  'SERVICIOS_VER',
  'SERVICIOS_GESTIONAR',
  'SERVICIOS_REGISTRAR',
  'PUNTOS_AJUSTAR',
  'RECOMPENSAS_VER',
  'RECOMPENSAS_GESTIONAR',
  'CANJES_REGISTRAR',
  'USUARIOS_GESTIONAR',
  'ROLES_GESTIONAR',
  'AUDITORIA_VER',
] as const;

const EXPECTED_ROLE_PERM_COUNTS: Record<(typeof EXPECTED_ROLES)[number], number> = {
  SUPER_ADMIN: 14,
  ADMINISTRADOR: 13,
  RECEPCIONISTA: 8,
};

const EXPECTED_ROLE_PERM_TOTAL = 35;
const ADMIN_EMAIL = 'studios.admi@gmail.com';
const REPORT_FILE = 'production-db-audit.txt';

const WRITE_SQL =
  /\b(INSERT|UPDATE|DELETE|REPLACE|TRUNCATE|DROP|ALTER|CREATE|RENAME|GRANT|REVOKE|CALL|LOAD|INTO\s+OUTFILE|INTO\s+DUMPFILE)\b/i;

type Row = Record<string, unknown>;

class ReadOnlyConnection {
  constructor(private readonly conn: mariadb.Connection) {}

  async query<T extends Row = Row>(sql: string, params: unknown[] = []): Promise<T[]> {
    const trimmed = sql.trim();
    if (WRITE_SQL.test(trimmed)) {
      throw new Error(
        `Operación de escritura bloqueada por el auditor READ-ONLY: ${trimmed.slice(0, 80)}`,
      );
    }
    const upper = trimmed.toUpperCase();
    const allowed =
      upper.startsWith('SELECT') ||
      upper.startsWith('SHOW') ||
      upper.startsWith('DESCRIBE') ||
      upper.startsWith('DESC ') ||
      upper.startsWith('EXPLAIN');
    if (!allowed) {
      throw new Error(`Solo SELECT/SHOW/DESCRIBE/EXPLAIN permitidos. Recibido: ${trimmed.slice(0, 80)}`);
    }
    const result = await this.conn.query(sql, params);
    return result as T[];
  }

  async end(): Promise<void> {
    await this.conn.end();
  }
}

function asString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'bigint') return value.toString();
  return String(value);
}

function asNumber(value: unknown): number {
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'number') return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function failGuard(message: string): never {
  console.error(`\n[ABORT] ${message}\n`);
  process.exit(1);
}

function requireAuditFlag(): void {
  if (process.env.AUDIT_PRODUCTION !== 'YES') {
    failGuard(
      'AUDIT_PRODUCTION=YES es obligatorio. Esto evita ejecutar la auditoría por accidente. En cPanel: export AUDIT_PRODUCTION=YES',
    );
  }
}

function requireDbEnv(): {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
} {
  const host = process.env.DB_HOST?.trim();
  const portRaw = process.env.DB_PORT?.trim();
  const database = process.env.DB_NAME?.trim();
  const user = process.env.DB_USER?.trim();
  const password = process.env.DB_PASSWORD;

  if (!host || !portRaw || !database || !user || password === undefined || password === '') {
    failGuard(
      'Faltan variables DB_HOST / DB_PORT / DB_NAME / DB_USER / DB_PASSWORD en el entorno.',
    );
  }

  const port = Number(portRaw);
  if (!Number.isInteger(port) || port <= 0) {
    failGuard('DB_PORT inválido.');
  }

  return { host, port, database, user, password };
}

function printEnvBanner(db: { host: string; port: number; database: string; user: string }): void {
  console.log('============================================================');
  console.log('STUDIO S — AUDITORÍA BD PRODUCCIÓN (READ-ONLY)');
  console.log('============================================================');
  console.log(`NODE_ENV: ${process.env.NODE_ENV ?? '(no definido)'}`);
  console.log(`DB_HOST:  ${db.host}`);
  console.log(`DB_PORT:  ${db.port}`);
  console.log(`DB_NAME:  ${db.database}`);
  console.log(`DB_USER:  ${db.user}`);
  console.log('(secretos omitidos)');
  console.log('============================================================\n');
}

async function countOrphans(
  db: ReadOnlyConnection,
  sql: string,
  params: unknown[] = [],
): Promise<number> {
  const rows = await db.query<{ c: unknown }>(sql, params);
  return asNumber(rows[0]?.c);
}

async function main(): Promise<void> {
  requireAuditFlag();
  const dbEnv = requireDbEnv();
  printEnvBanner(dbEnv);

  const lines: string[] = [];
  const push = (line = ''): void => {
    lines.push(line);
    console.log(line);
  };

  let connectionPass = false;
  let tablesOk = 0;
  let rolesOk = 0;
  let permsOk = 0;
  let rolePermTotal = 0;
  let rolePermMatrixOk = true;
  let adminPass = false;
  let servicesActive = 0;
  let orphansTotal = 0;
  const problems: string[] = [];

  let poolConn: mariadb.Connection | null = null;
  let db: ReadOnlyConnection | null = null;

  try {
    poolConn = await mariadb.createConnection({
      host: dbEnv.host,
      port: dbEnv.port,
      user: dbEnv.user,
      password: dbEnv.password,
      database: dbEnv.database,
      connectTimeout: 10000,
      allowPublicKeyRetrieval: true,
    });
    db = new ReadOnlyConnection(poolConn);
    connectionPass = true;

    // --- 5. Servidor / versión / BD ---
    const verRows = await db.query<{ version: string }>('SELECT VERSION() AS version');
    const dbRows = await db.query<{ db: string }>('SELECT DATABASE() AS db');
    const version = asString(verRows[0]?.version);
    const currentDb = asString(dbRows[0]?.db);

    push('## 1. Conexión');
    push(`Connection: PASS`);
    push(`MariaDB VERSION: ${version}`);
    push(`DATABASE(): ${currentDb}`);
    push(`DB_NAME env: ${dbEnv.database}`);
    if (currentDb !== dbEnv.database) {
      problems.push(`CRÍTICO: DATABASE() (${currentDb}) ≠ DB_NAME (${dbEnv.database})`);
    }
    push();

    // --- 6. Tablas ---
    push('## 2. Tablas');
    push('TABLA | EXISTE | CANTIDAD');
    const existingTables = new Set<string>();
    const showTables = await db.query<Row>('SHOW TABLES');
    for (const row of showTables) {
      const name = asString(Object.values(row)[0]);
      if (name) existingTables.add(name);
    }

    for (const table of EXPECTED_TABLES) {
      const exists = existingTables.has(table);
      let count = -1;
      if (exists) {
        const cRows = await db.query<{ c: unknown }>(`SELECT COUNT(*) AS c FROM \`${table}\``);
        count = asNumber(cRows[0]?.c);
        tablesOk += 1;
      } else {
        problems.push(`CRÍTICO: falta tabla ${table}`);
      }
      push(`${table} | ${exists ? 'SÍ' : 'NO'} | ${exists ? String(count) : '—'}`);
    }
    push(`Tablas esperadas: ${tablesOk}/${EXPECTED_TABLES.length}`);
    push();

    if (tablesOk < EXPECTED_TABLES.length) {
      // Sin tablas críticas no tiene sentido continuar detalle completo, pero sí intentamos lo posible.
      problems.push('CRÍTICO: faltan tablas esperadas');
    }

    // --- 7. Roles ---
    push('## 3. Roles');
    push('ID | NOMBRE | ESTADO');
    const roles =
      existingTables.has('roles')
        ? await db.query<{ id_rol: unknown; nombre: string; estado: string }>(
            'SELECT id_rol, nombre, estado FROM roles ORDER BY id_rol',
          )
        : [];
    const rolesByName = new Map(roles.map((r) => [r.nombre, r]));
    for (const name of EXPECTED_ROLES) {
      const row = rolesByName.get(name);
      if (row) {
        rolesOk += 1;
        push(`${asString(row.id_rol)} | ${row.nombre} | ${row.estado}`);
      } else {
        problems.push(`ALTO: falta rol ${name}`);
        push(`— | ${name} | FALTA`);
      }
    }
    for (const row of roles) {
      if (!(EXPECTED_ROLES as readonly string[]).includes(row.nombre)) {
        push(`${asString(row.id_rol)} | ${row.nombre} | ${row.estado} (extra)`);
      }
    }
    push(`Roles esperados: ${rolesOk}/${EXPECTED_ROLES.length}`);
    push();

    // --- 8. Permisos ---
    push('## 4. Permisos');
    push('ID | NOMBRE(codigo) | ESTADO');
    const permisos =
      existingTables.has('permisos')
        ? await db.query<{ id_permiso: unknown; codigo: string; nombre: string }>(
            'SELECT id_permiso, codigo, nombre FROM permisos ORDER BY id_permiso',
          )
        : [];
    const permsByCode = new Map(permisos.map((p) => [p.codigo, p]));
    for (const code of EXPECTED_PERMISSIONS) {
      const row = permsByCode.get(code);
      if (row) {
        permsOk += 1;
        push(`${asString(row.id_permiso)} | ${row.codigo} | OK`);
      } else {
        problems.push(`ALTO: falta permiso ${code}`);
        push(`— | ${code} | FALTA`);
      }
    }
    for (const row of permisos) {
      if (!(EXPECTED_PERMISSIONS as readonly string[]).includes(row.codigo)) {
        push(`${asString(row.id_permiso)} | ${row.codigo} | EXTRA`);
      }
    }
    push(`Permisos esperados: ${permsOk}/${EXPECTED_PERMISSIONS.length}`);
    push();

    // --- 9. rol_permisos ---
    push('## 5. Role permissions');
    push('ROL | PERMISOS | CANTIDAD');
    if (existingTables.has('rol_permisos') && existingTables.has('roles') && existingTables.has('permisos')) {
      const matrix = await db.query<{
        nombre: string;
        cantidad: unknown;
        codigos: string | null;
      }>(
        `SELECT r.nombre AS nombre,
                COUNT(rp.id_permiso) AS cantidad,
                GROUP_CONCAT(p.codigo ORDER BY p.id_permiso SEPARATOR ',') AS codigos
         FROM roles r
         LEFT JOIN rol_permisos rp ON rp.id_rol = r.id_rol
         LEFT JOIN permisos p ON p.id_permiso = rp.id_permiso
         WHERE r.nombre IN (?, ?, ?)
         GROUP BY r.nombre
         ORDER BY r.nombre`,
        [...EXPECTED_ROLES],
      );

      const byName = new Map(matrix.map((m) => [m.nombre, m]));
      for (const roleName of EXPECTED_ROLES) {
        const row = byName.get(roleName);
        const count = row ? asNumber(row.cantidad) : 0;
        const expected = EXPECTED_ROLE_PERM_COUNTS[roleName];
        rolePermTotal += count;
        const ok = count === expected;
        if (!ok) {
          rolePermMatrixOk = false;
          problems.push(
            `ALTO: ${roleName} tiene ${count} permisos (esperados ${expected})`,
          );
        }
        const codes = row?.codigos ? row.codigos.split(',') : [];
        push(`${roleName} | ${codes.join(', ') || '(ninguno)'} | ${count} ${ok ? 'OK' : 'DIFF'}`);
      }

      const totalRows = await db.query<{ c: unknown }>('SELECT COUNT(*) AS c FROM rol_permisos');
      const absoluteTotal = asNumber(totalRows[0]?.c);
      push(`Total filas rol_permisos: ${absoluteTotal} (esperado asignaciones roles base: ${EXPECTED_ROLE_PERM_TOTAL})`);
      if (rolePermTotal !== EXPECTED_ROLE_PERM_TOTAL) {
        rolePermMatrixOk = false;
        problems.push(
          `ALTO: suma asignaciones roles base = ${rolePermTotal} (esperado ${EXPECTED_ROLE_PERM_TOTAL})`,
        );
      }
    } else {
      rolePermMatrixOk = false;
      problems.push('CRÍTICO: no se pudo auditar rol_permisos (tablas ausentes)');
    }
    push();

    // --- 10. Admin ---
    push('## 6. Admin');
    push('id_usuario | email | nombres | apellidos | id_rol | estado');
    if (existingTables.has('usuarios_admin')) {
      const admins = await db.query<{
        id_usuario: unknown;
        email: string;
        nombres: string;
        apellidos: string;
        id_rol: unknown;
        estado: string;
      }>(
        `SELECT id_usuario, email, nombres, apellidos, id_rol, estado
         FROM usuarios_admin
         WHERE email = ?
         LIMIT 1`,
        [ADMIN_EMAIL],
      );
      const admin = admins[0];
      if (!admin) {
        problems.push(`ALTO: no existe admin ${ADMIN_EMAIL}`);
        push(`— | ${ADMIN_EMAIL} | — | — | — | FALTA`);
      } else {
        let hasRole = false;
        if (existingTables.has('roles')) {
          const roleRows = await db.query<{ c: unknown }>(
            'SELECT COUNT(*) AS c FROM roles WHERE id_rol = ?',
            [admin.id_rol],
          );
          hasRole = asNumber(roleRows[0]?.c) > 0;
        }
        const active = admin.estado === 'ACTIVO';
        adminPass = active && hasRole;
        if (!active) problems.push(`ALTO: admin ${ADMIN_EMAIL} estado=${admin.estado}`);
        if (!hasRole) problems.push(`CRÍTICO: admin id_rol=${asString(admin.id_rol)} sin rol`);
        push(
          `${asString(admin.id_usuario)} | ${admin.email} | ${admin.nombres} | ${admin.apellidos} | ${asString(admin.id_rol)} | ${admin.estado}${adminPass ? ' OK' : ' FAIL'}`,
        );
      }
    } else {
      problems.push('CRÍTICO: falta tabla usuarios_admin');
    }
    push();

    // --- 11. Servicios ---
    push('## 7. Servicios');
    push('id_servicio | nombre | precio | puntos | estado');
    if (existingTables.has('servicios')) {
      const servicios = await db.query<{
        id_servicio: unknown;
        nombre: string;
        precio: unknown;
        puntos_otorgados: unknown;
        estado: string;
      }>(
        `SELECT id_servicio, nombre, precio, puntos_otorgados, estado
         FROM servicios
         ORDER BY id_servicio`,
      );
      for (const s of servicios) {
        if (s.estado === 'ACTIVO') servicesActive += 1;
        push(
          `${asString(s.id_servicio)} | ${s.nombre} | ${asString(s.precio)} | ${asString(s.puntos_otorgados)} | ${s.estado}`,
        );
      }
      push(`Servicios totales: ${servicios.length}`);
      push(`Servicios activos: ${servicesActive}`);
      if (servicesActive === 0) {
        problems.push('ALTO: cero servicios activos en producción');
      }
    } else {
      problems.push('CRÍTICO: falta tabla servicios');
    }
    push();

    // --- 12. Conteos ---
    push('## 8. Conteos');
    push('TABLA | REGISTROS');
    const countTables = [
      'clientas',
      'credenciales_clientas',
      'sesiones_clientas',
      'qr_clientas',
      'servicios_realizados',
      'movimientos_puntos',
      'recompensas',
      'canjes_recompensas',
      'auditoria',
    ] as const;
    for (const table of countTables) {
      if (!existingTables.has(table)) {
        push(`${table} | — (tabla ausente)`);
        continue;
      }
      const c = await db.query<{ c: unknown }>(`SELECT COUNT(*) AS c FROM \`${table}\``);
      push(`${table} | ${asNumber(c[0]?.c)}`);
    }
    if (existingTables.has('clientas')) {
      const act = await db.query<{ c: unknown }>(
        `SELECT COUNT(*) AS c FROM clientas WHERE estado = 'ACTIVA'`,
      );
      const ina = await db.query<{ c: unknown }>(
        `SELECT COUNT(*) AS c FROM clientas WHERE estado <> 'ACTIVA'`,
      );
      push(`clientas ACTIVA | ${asNumber(act[0]?.c)}`);
      push(`clientas no ACTIVA | ${asNumber(ina[0]?.c)}`);
    }
    push();

    // --- 13. Integridad (huérfanos) ---
    push('## 9. Integridad (huérfanos)');
    const orphanChecks: { label: string; sql: string; need: string[] }[] = [
      {
        label: 'credenciales → clientas',
        need: ['credenciales_clientas', 'clientas'],
        sql: `SELECT COUNT(*) AS c FROM credenciales_clientas cc
              LEFT JOIN clientas c ON c.id_clienta = cc.id_clienta
              WHERE c.id_clienta IS NULL`,
      },
      {
        label: 'sesiones → clientas',
        need: ['sesiones_clientas', 'clientas'],
        sql: `SELECT COUNT(*) AS c FROM sesiones_clientas s
              LEFT JOIN clientas c ON c.id_clienta = s.id_clienta
              WHERE c.id_clienta IS NULL`,
      },
      {
        label: 'QR → clientas',
        need: ['qr_clientas', 'clientas'],
        sql: `SELECT COUNT(*) AS c FROM qr_clientas q
              LEFT JOIN clientas c ON c.id_clienta = q.id_clienta
              WHERE c.id_clienta IS NULL`,
      },
      {
        label: 'servicios_realizados → clientas',
        need: ['servicios_realizados', 'clientas'],
        sql: `SELECT COUNT(*) AS c FROM servicios_realizados sr
              LEFT JOIN clientas c ON c.id_clienta = sr.id_clienta
              WHERE c.id_clienta IS NULL`,
      },
      {
        label: 'movimientos → clientas',
        need: ['movimientos_puntos', 'clientas'],
        sql: `SELECT COUNT(*) AS c FROM movimientos_puntos m
              LEFT JOIN clientas c ON c.id_clienta = m.id_clienta
              WHERE c.id_clienta IS NULL`,
      },
      {
        label: 'canjes → clientas',
        need: ['canjes_recompensas', 'clientas'],
        sql: `SELECT COUNT(*) AS c FROM canjes_recompensas cr
              LEFT JOIN clientas c ON c.id_clienta = cr.id_clienta
              WHERE c.id_clienta IS NULL`,
      },
      {
        label: 'canjes → recompensas',
        need: ['canjes_recompensas', 'recompensas'],
        sql: `SELECT COUNT(*) AS c FROM canjes_recompensas cr
              LEFT JOIN recompensas r ON r.id_recompensa = cr.id_recompensa
              WHERE r.id_recompensa IS NULL`,
      },
      {
        label: 'servicios_realizados → servicios',
        need: ['servicios_realizados', 'servicios'],
        sql: `SELECT COUNT(*) AS c FROM servicios_realizados sr
              LEFT JOIN servicios s ON s.id_servicio = sr.id_servicio
              WHERE s.id_servicio IS NULL`,
      },
      {
        label: 'movimientos → servicios_realizados (si id set)',
        need: ['movimientos_puntos', 'servicios_realizados'],
        sql: `SELECT COUNT(*) AS c FROM movimientos_puntos m
              LEFT JOIN servicios_realizados sr ON sr.id_servicio_realizado = m.id_servicio_realizado
              WHERE m.id_servicio_realizado IS NOT NULL AND sr.id_servicio_realizado IS NULL`,
      },
      {
        label: 'movimientos → canjes (si id set)',
        need: ['movimientos_puntos', 'canjes_recompensas'],
        sql: `SELECT COUNT(*) AS c FROM movimientos_puntos m
              LEFT JOIN canjes_recompensas cr ON cr.id_canje = m.id_canje
              WHERE m.id_canje IS NOT NULL AND cr.id_canje IS NULL`,
      },
      {
        label: 'rol_permisos → roles',
        need: ['rol_permisos', 'roles'],
        sql: `SELECT COUNT(*) AS c FROM rol_permisos rp
              LEFT JOIN roles r ON r.id_rol = rp.id_rol
              WHERE r.id_rol IS NULL`,
      },
      {
        label: 'rol_permisos → permisos',
        need: ['rol_permisos', 'permisos'],
        sql: `SELECT COUNT(*) AS c FROM rol_permisos rp
              LEFT JOIN permisos p ON p.id_permiso = rp.id_permiso
              WHERE p.id_permiso IS NULL`,
      },
      {
        label: 'usuarios_admin → roles',
        need: ['usuarios_admin', 'roles'],
        sql: `SELECT COUNT(*) AS c FROM usuarios_admin u
              LEFT JOIN roles r ON r.id_rol = u.id_rol
              WHERE r.id_rol IS NULL`,
      },
    ];

    for (const check of orphanChecks) {
      if (!check.need.every((t) => existingTables.has(t))) {
        push(`${check.label}: SKIP (tabla ausente)`);
        continue;
      }
      const n = await countOrphans(db, check.sql);
      orphansTotal += n;
      push(`${check.label}: ${n}`);
      if (n > 0) {
        problems.push(`CRÍTICO: ${n} huérfanos en ${check.label}`);
      }
    }
    push(`Orphans total: ${orphansTotal}`);
    push();

    // --- Problemas ---
    push('## 10. Problemas encontrados');
    if (problems.length === 0) {
      push('(ninguno)');
    } else {
      for (const p of problems) push(`- ${p}`);
    }
    push();

    // --- Status final ---
    const integrityPass = orphansTotal === 0;
    const structureComplete = tablesOk === EXPECTED_TABLES.length;
    const baseDataOk =
      rolesOk === EXPECTED_ROLES.length &&
      permsOk === EXPECTED_PERMISSIONS.length &&
      rolePermMatrixOk &&
      adminPass &&
      servicesActive > 0;

    let status: 'BD LISTA PARA DEPLOY' | 'BD REQUIERE CONFIGURACIÓN' | 'BD BLOQUEADA';
    if (!connectionPass || !structureComplete || orphansTotal > 0) {
      status = 'BD BLOQUEADA';
    } else if (!baseDataOk) {
      status = 'BD REQUIERE CONFIGURACIÓN';
    } else {
      status = 'BD LISTA PARA DEPLOY';
    }

    push('# FINAL PRODUCTION DB AUDIT');
    push('');
    push(`Connection: ${connectionPass ? 'PASS' : 'FAIL'}`);
    push('');
    push('Database:');
    push(currentDb || dbEnv.database);
    push('');
    push(`Tables:`);
    push(`${tablesOk}/${EXPECTED_TABLES.length}`);
    push('');
    push(`Roles:`);
    push(`${rolesOk}/${EXPECTED_ROLES.length}`);
    push('');
    push(`Permissions:`);
    push(`${permsOk}/${EXPECTED_PERMISSIONS.length}`);
    push('');
    push(`Role permissions:`);
    push(`${rolePermTotal}/${EXPECTED_ROLE_PERM_TOTAL}`);
    push('');
    push(`Admin:`);
    push(adminPass ? 'PASS' : 'FAIL');
    push('');
    push(`Services:`);
    push(`${servicesActive} active`);
    push('');
    push(`Integrity:`);
    push(integrityPass ? 'PASS' : 'FAIL');
    push('');
    push(`Orphans:`);
    push(String(orphansTotal));
    push('');
    push('Status:');
    push('');
    push(status);
    push('');
    push('BD modificada: NO');
    push('Schema modificado: NO');
    push('Migration: NO');
    push('db push: NO');
    push('Datos modificados: NO');

    const reportPath = path.resolve(process.cwd(), REPORT_FILE);
    fs.writeFileSync(reportPath, `${lines.join('\n')}\n`, 'utf8');
    console.log(`\nReporte seguro escrito en: ${reportPath}`);
    console.log('(sin passwords / JWT / hashes)');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`\n[ERROR] ${message}`);
    const failReport = [
      '# FINAL PRODUCTION DB AUDIT',
      '',
      `Connection: ${connectionPass ? 'PASS' : 'FAIL'}`,
      '',
      'Database:',
      dbEnv.database,
      '',
      'Status:',
      '',
      'BD BLOQUEADA',
      '',
      `Error: ${message}`,
      '',
      'BD modificada: NO',
      'Schema modificado: NO',
      'Migration: NO',
      'db push: NO',
      'Datos modificados: NO',
    ].join('\n');
    try {
      fs.writeFileSync(path.resolve(process.cwd(), REPORT_FILE), `${failReport}\n`, 'utf8');
    } catch {
      /* ignore write errors on failure path */
    }
    process.exitCode = 1;
  } finally {
    if (db) {
      try {
        await db.end();
      } catch {
        /* ignore */
      }
    } else if (poolConn) {
      try {
        await poolConn.end();
      } catch {
        /* ignore */
      }
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
