import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { PERMISOS } from './permisos';

/**
 * Contrato: cada ruta protegida debe pedir un código de los 14 reales.
 * Si se agrega una ruta nueva, actualizar este mapa y docs/PERMISSIONS.md.
 */
const RUTA_PERMISO: Record<string, string> = {
  'GET /dashboard/resumen': PERMISOS.DASHBOARD_VER,
  'GET /clientas': PERMISOS.CLIENTAS_VER,
  'GET /clientas/:id': PERMISOS.CLIENTAS_VER,
  'POST /clientas': PERMISOS.CLIENTAS_CREAR,
  'PATCH /clientas/:id': PERMISOS.CLIENTAS_EDITAR,
  'PATCH /clientas/:id/estado': PERMISOS.CLIENTAS_EDITAR,
  'GET /servicios': PERMISOS.SERVICIOS_VER,
  'GET /servicios/:id': PERMISOS.SERVICIOS_VER,
  'POST /servicios': PERMISOS.SERVICIOS_GESTIONAR,
  'PATCH /servicios/:id': PERMISOS.SERVICIOS_GESTIONAR,
  'PATCH /servicios/:id/estado': PERMISOS.SERVICIOS_GESTIONAR,
  'GET /servicios-realizados': PERMISOS.SERVICIOS_VER,
  'GET /servicios-realizados/:id': PERMISOS.SERVICIOS_VER,
  'POST /servicios-realizados': PERMISOS.SERVICIOS_REGISTRAR,
  'POST /servicios-realizados/atencion': PERMISOS.SERVICIOS_REGISTRAR,
  'PATCH /servicios-realizados/:id/anular': PERMISOS.SERVICIOS_REGISTRAR,
  'GET /puntos': PERMISOS.CLIENTAS_VER,
  'GET /clientas/:id/puntos': PERMISOS.CLIENTAS_VER,
  'GET /clientas/:id/movimientos-puntos': PERMISOS.CLIENTAS_VER,
  'POST /puntos/otorgar': PERMISOS.PUNTOS_AJUSTAR,
  'GET /recompensas': PERMISOS.RECOMPENSAS_VER,
  'GET /recompensas/:id': PERMISOS.RECOMPENSAS_VER,
  'POST /recompensas': PERMISOS.RECOMPENSAS_GESTIONAR,
  'PATCH /recompensas/:id': PERMISOS.RECOMPENSAS_GESTIONAR,
  'PATCH /recompensas/:id/estado': PERMISOS.RECOMPENSAS_GESTIONAR,
  'GET /canjes': PERMISOS.CLIENTAS_VER,
  'GET /clientas/:id/canjes': PERMISOS.CLIENTAS_VER,
  'POST /canjes': PERMISOS.CANJES_REGISTRAR,
  'PATCH /canjes/:id/entregar': PERMISOS.CANJES_REGISTRAR,
  'PATCH /canjes/:id/anular': PERMISOS.CANJES_REGISTRAR,
  'usuarios-admin (módulo)': PERMISOS.USUARIOS_GESTIONAR,
  'roles / permisos (módulo)': PERMISOS.ROLES_GESTIONAR,
  'GET /auditoria': PERMISOS.AUDITORIA_VER,
  'GET /clientas/:id/qr': PERMISOS.CLIENTAS_VER,
  'POST /qr-clientas/validar': PERMISOS.CLIENTAS_VER,
  'POST /qr-clientas': PERMISOS.CLIENTAS_EDITAR,
  'PATCH /qr-clientas/:id/revocar': PERMISOS.CLIENTAS_EDITAR,
  'GET /clientas/:id/credenciales': PERMISOS.CLIENTAS_VER,
  'PUT /clientas/:id/credenciales': PERMISOS.CLIENTAS_EDITAR,
  'PATCH /clientas/:id/credenciales/estado': PERMISOS.CLIENTAS_EDITAR,
  'PATCH /clientas/:id/credenciales/password': PERMISOS.CLIENTAS_EDITAR,
  'GET /clientas/:id/sesiones': PERMISOS.CLIENTAS_VER,
  'POST /sesiones-clientas': PERMISOS.CLIENTAS_EDITAR,
  'PATCH /sesiones-clientas/:id/revocar': PERMISOS.CLIENTAS_EDITAR,
  'POST /clientas/:id/sesiones/revocar-todas': PERMISOS.CLIENTAS_EDITAR,
};

describe('contrato rutas → permisos reales', () => {
  it('todas las rutas usan solo códigos de los 14 reales', () => {
    const reales = new Set(Object.values(PERMISOS));
    for (const [ruta, codigo] of Object.entries(RUTA_PERMISO)) {
      assert.ok(reales.has(codigo as (typeof PERMISOS)[keyof typeof PERMISOS]), `${ruta} → ${codigo}`);
    }
  });

  it('no usa códigos con punto (estilo inventado)', () => {
    for (const codigo of Object.values(RUTA_PERMISO)) {
      assert.equal(codigo.includes('.'), false, codigo);
    }
  });
});
