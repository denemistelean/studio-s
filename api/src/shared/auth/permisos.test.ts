import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isPermissionAllowed,
  PERMISOS,
  PERMISOS_REALES,
  type PermisoCodigo,
} from './permisos';

/** Matriz de operaciones → permiso requerido (solo códigos reales). */
const ROUTE_PERMISSIONS = {
  dashboard_resumen: [PERMISOS.DASHBOARD_VER],
  clientas_get: [PERMISOS.CLIENTAS_VER],
  clientas_post: [PERMISOS.CLIENTAS_CREAR],
  clientas_patch: [PERMISOS.CLIENTAS_EDITAR],
  servicios_get: [PERMISOS.SERVICIOS_VER],
  servicios_gestionar: [PERMISOS.SERVICIOS_GESTIONAR],
  servicios_realizados_get: [PERMISOS.SERVICIOS_VER],
  servicios_realizados_registrar: [PERMISOS.SERVICIOS_REGISTRAR],
  puntos_consultar: [PERMISOS.CLIENTAS_VER],
  puntos_ajustar: [PERMISOS.PUNTOS_AJUSTAR],
  recompensas_get: [PERMISOS.RECOMPENSAS_VER],
  recompensas_gestionar: [PERMISOS.RECOMPENSAS_GESTIONAR],
  canjes_consultar: [PERMISOS.CLIENTAS_VER],
  canjes_registrar: [PERMISOS.CANJES_REGISTRAR],
  usuarios_gestionar: [PERMISOS.USUARIOS_GESTIONAR],
  roles_gestionar: [PERMISOS.ROLES_GESTIONAR],
  auditoria_ver: [PERMISOS.AUDITORIA_VER],
  qr_consultar: [PERMISOS.CLIENTAS_VER],
  qr_gestionar: [PERMISOS.CLIENTAS_EDITAR],
  credenciales_get: [PERMISOS.CLIENTAS_VER],
  credenciales_editar: [PERMISOS.CLIENTAS_EDITAR],
  sesiones_listar: [PERMISOS.CLIENTAS_VER],
  sesiones_mutar: [PERMISOS.CLIENTAS_EDITAR],
} as const;

describe('PERMISOS reales MariaDB', () => {
  it('expone exactamente 14 códigos literales', () => {
    assert.equal(PERMISOS_REALES.length, 14);
    assert.deepEqual([...PERMISOS_REALES], [
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
    ]);
  });

  it('valores de PERMISOS coinciden con PERMISOS_REALES sin inventados', () => {
    const values = Object.values(PERMISOS);
    assert.equal(values.length, 14);
    assert.equal(new Set(values).size, 14);
    for (const code of values) {
      assert.ok(PERMISOS_REALES.includes(code as PermisoCodigo));
      assert.equal(code, code.toUpperCase());
      assert.equal(code.includes('.'), false);
    }
  });
});

describe('isPermissionAllowed (bootstrap)', () => {
  it('permite acceso si el rol no tiene permisos asignados', () => {
    assert.equal(isPermissionAllowed([], [PERMISOS.CLIENTAS_VER]), true);
    assert.equal(isPermissionAllowed([], [PERMISOS.USUARIOS_GESTIONAR]), true);
  });
});

describe('autorización por rol (matriz 14 permisos)', () => {
  it('1. SUPER_ADMIN con los 14 permisos accede a todos los módulos', () => {
    const superAdmin = [...PERMISOS_REALES];
    for (const required of Object.values(ROUTE_PERMISSIONS)) {
      assert.equal(isPermissionAllowed(superAdmin, required), true);
    }
  });

  it('2. CLIENTAS_VER puede consultar clientas', () => {
    assert.equal(
      isPermissionAllowed([PERMISOS.CLIENTAS_VER], ROUTE_PERMISSIONS.clientas_get),
      true,
    );
  });

  it('3. CLIENTAS_VER no permite crear clientas', () => {
    assert.equal(
      isPermissionAllowed([PERMISOS.CLIENTAS_VER], ROUTE_PERMISSIONS.clientas_post),
      false,
    );
  });

  it('4. CLIENTAS_CREAR permite crear clientas', () => {
    assert.equal(
      isPermissionAllowed([PERMISOS.CLIENTAS_CREAR], ROUTE_PERMISSIONS.clientas_post),
      true,
    );
  });

  it('5. CLIENTAS_EDITAR permite modificar clientas', () => {
    assert.equal(
      isPermissionAllowed([PERMISOS.CLIENTAS_EDITAR], ROUTE_PERMISSIONS.clientas_patch),
      true,
    );
  });

  it('6. SERVICIOS_VER permite consultar servicios', () => {
    assert.equal(
      isPermissionAllowed([PERMISOS.SERVICIOS_VER], ROUTE_PERMISSIONS.servicios_get),
      true,
    );
  });

  it('7. SERVICIOS_GESTIONAR permite administrar servicios', () => {
    assert.equal(
      isPermissionAllowed([PERMISOS.SERVICIOS_GESTIONAR], ROUTE_PERMISSIONS.servicios_gestionar),
      true,
    );
    assert.equal(
      isPermissionAllowed([PERMISOS.SERVICIOS_VER], ROUTE_PERMISSIONS.servicios_gestionar),
      false,
    );
  });

  it('8. SERVICIOS_REGISTRAR permite registrar servicios realizados', () => {
    assert.equal(
      isPermissionAllowed(
        [PERMISOS.SERVICIOS_REGISTRAR],
        ROUTE_PERMISSIONS.servicios_realizados_registrar,
      ),
      true,
    );
    assert.equal(
      isPermissionAllowed([PERMISOS.SERVICIOS_VER], ROUTE_PERMISSIONS.servicios_realizados_registrar),
      false,
    );
  });

  it('9. RECOMPENSAS_VER permite consultar recompensas', () => {
    assert.equal(
      isPermissionAllowed([PERMISOS.RECOMPENSAS_VER], ROUTE_PERMISSIONS.recompensas_get),
      true,
    );
  });

  it('10. RECOMPENSAS_GESTIONAR permite administrar recompensas', () => {
    assert.equal(
      isPermissionAllowed(
        [PERMISOS.RECOMPENSAS_GESTIONAR],
        ROUTE_PERMISSIONS.recompensas_gestionar,
      ),
      true,
    );
    assert.equal(
      isPermissionAllowed([PERMISOS.RECOMPENSAS_VER], ROUTE_PERMISSIONS.recompensas_gestionar),
      false,
    );
  });

  it('11. CANJES_REGISTRAR permite registrar/gestionar el flujo de canje', () => {
    assert.equal(
      isPermissionAllowed([PERMISOS.CANJES_REGISTRAR], ROUTE_PERMISSIONS.canjes_registrar),
      true,
    );
  });

  it('12. USUARIOS_GESTIONAR protege usuarios admin', () => {
    assert.equal(
      isPermissionAllowed([PERMISOS.USUARIOS_GESTIONAR], ROUTE_PERMISSIONS.usuarios_gestionar),
      true,
    );
    assert.equal(
      isPermissionAllowed([PERMISOS.CLIENTAS_VER], ROUTE_PERMISSIONS.usuarios_gestionar),
      false,
    );
  });

  it('13. ROLES_GESTIONAR protege roles', () => {
    assert.equal(
      isPermissionAllowed([PERMISOS.ROLES_GESTIONAR], ROUTE_PERMISSIONS.roles_gestionar),
      true,
    );
    assert.equal(
      isPermissionAllowed([PERMISOS.AUDITORIA_VER], ROUTE_PERMISSIONS.roles_gestionar),
      false,
    );
  });

  it('14. AUDITORIA_VER protege auditoría', () => {
    assert.equal(
      isPermissionAllowed([PERMISOS.AUDITORIA_VER], ROUTE_PERMISSIONS.auditoria_ver),
      true,
    );
    assert.equal(
      isPermissionAllowed([PERMISOS.DASHBOARD_VER], ROUTE_PERMISSIONS.auditoria_ver),
      false,
    );
  });

  it('15. DASHBOARD_VER protege dashboard', () => {
    assert.equal(
      isPermissionAllowed([PERMISOS.DASHBOARD_VER], ROUTE_PERMISSIONS.dashboard_resumen),
      true,
    );
    assert.equal(
      isPermissionAllowed([PERMISOS.CLIENTAS_VER], ROUTE_PERMISSIONS.dashboard_resumen),
      false,
    );
  });

  it('rechaza códigos inventados estilo clientas.ver', () => {
    assert.equal(isPermissionAllowed(['clientas.ver'], [PERMISOS.CLIENTAS_VER]), false);
    assert.equal(isPermissionAllowed(['dashboard.ver'], [PERMISOS.DASHBOARD_VER]), false);
  });
});
