/**
 * Códigos EXACTOS de `permisos.codigo` en MariaDB (14 filas verificadas).
 * No inventar códigos. No insertar filas. El valor string debe coincidir literalmente.
 */
export const PERMISOS = {
  DASHBOARD_VER: 'DASHBOARD_VER',
  CLIENTAS_VER: 'CLIENTAS_VER',
  CLIENTAS_CREAR: 'CLIENTAS_CREAR',
  CLIENTAS_EDITAR: 'CLIENTAS_EDITAR',
  SERVICIOS_VER: 'SERVICIOS_VER',
  SERVICIOS_GESTIONAR: 'SERVICIOS_GESTIONAR',
  SERVICIOS_REGISTRAR: 'SERVICIOS_REGISTRAR',
  PUNTOS_AJUSTAR: 'PUNTOS_AJUSTAR',
  RECOMPENSAS_VER: 'RECOMPENSAS_VER',
  RECOMPENSAS_GESTIONAR: 'RECOMPENSAS_GESTIONAR',
  CANJES_REGISTRAR: 'CANJES_REGISTRAR',
  USUARIOS_GESTIONAR: 'USUARIOS_GESTIONAR',
  ROLES_GESTIONAR: 'ROLES_GESTIONAR',
  AUDITORIA_VER: 'AUDITORIA_VER',
} as const;

export type PermisoCodigo = (typeof PERMISOS)[keyof typeof PERMISOS];

/** Los 14 códigos reales, en el orden de la BD. */
export const PERMISOS_REALES: readonly PermisoCodigo[] = [
  PERMISOS.DASHBOARD_VER,
  PERMISOS.CLIENTAS_VER,
  PERMISOS.CLIENTAS_CREAR,
  PERMISOS.CLIENTAS_EDITAR,
  PERMISOS.SERVICIOS_VER,
  PERMISOS.SERVICIOS_GESTIONAR,
  PERMISOS.SERVICIOS_REGISTRAR,
  PERMISOS.PUNTOS_AJUSTAR,
  PERMISOS.RECOMPENSAS_VER,
  PERMISOS.RECOMPENSAS_GESTIONAR,
  PERMISOS.CANJES_REGISTRAR,
  PERMISOS.USUARIOS_GESTIONAR,
  PERMISOS.ROLES_GESTIONAR,
  PERMISOS.AUDITORIA_VER,
] as const;

/**
 * Mapeo funcional ruta → permiso (solo códigos reales).
 *
 * | Dominio | Operación | Permiso |
 * |---|---|---|
 * | Dashboard | GET resumen | DASHBOARD_VER |
 * | Clientas | GET | CLIENTAS_VER |
 * | Clientas | POST | CLIENTAS_CREAR |
 * | Clientas | PATCH / estado | CLIENTAS_EDITAR |
 * | Servicios | GET | SERVICIOS_VER |
 * | Servicios | POST/PATCH/estado | SERVICIOS_GESTIONAR |
 * | Servicios realizados | GET | SERVICIOS_VER |
 * | Servicios realizados | POST / anular | SERVICIOS_REGISTRAR |
 * | Puntos | saldo / historial / listar | CLIENTAS_VER (no existe PUNTOS_VER) |
 * | Puntos | ajuste manual | PUNTOS_AJUSTAR |
 * | Recompensas | GET | RECOMPENSAS_VER |
 * | Recompensas | POST/PATCH/estado | RECOMPENSAS_GESTIONAR |
 * | Canjes | listar / consultar | CLIENTAS_VER (no existe CANJES_VER; historial ligado a clienta) |
 * | Canjes | crear / entregar / anular | CANJES_REGISTRAR |
 * | Usuarios admin | todo | USUARIOS_GESTIONAR |
 * | Roles / permisos | todo | ROLES_GESTIONAR |
 * | Auditoría | GET | AUDITORIA_VER |
 * | QR | listar | CLIENTAS_VER |
 * | QR | validar | CLIENTAS_VER o SERVICIOS_REGISTRAR |
 * | QR | generar / revocar | CLIENTAS_EDITAR |
 * | QR | emitir propio (portal) | sesión clienta |
 * | Credenciales | GET | CLIENTAS_VER |
 * | Credenciales | upsert / estado / password | CLIENTAS_EDITAR |
 * | Sesiones | listar | CLIENTAS_VER |
 * | Sesiones | crear / revocar | CLIENTAS_EDITAR |
 */
export const PERMISO_MAPEO_DOC = true;

/**
 * Evalúa si `assigned` autoriza al menos uno de `required`.
 * - `assigned.length === 0` → bootstrap: permite (rol sin filas en rol_permisos).
 * - En otro caso exige intersección.
 */
export function isPermissionAllowed(
  assigned: readonly string[],
  required: readonly string[],
): boolean {
  if (assigned.length === 0) {
    return true;
  }
  return required.some((codigo) => assigned.includes(codigo));
}
