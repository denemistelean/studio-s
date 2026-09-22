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

/** Si el rol no tiene matriz (bootstrap backend), se permite todo. */
export function canAccess(
  assigned: readonly string[] | null | undefined,
  required: string | string[],
): boolean {
  if (!assigned || assigned.length === 0) return true;
  const need = Array.isArray(required) ? required : [required];
  return need.some((code) => assigned.includes(code));
}
