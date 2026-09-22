# Permisos reales (MariaDB)

Fuente: tabla `permisos` verificada. **14 códigos**. No inventar ni insertar.

| # | `permisos.codigo` |
|---|---|
| 1 | `DASHBOARD_VER` |
| 2 | `CLIENTAS_VER` |
| 3 | `CLIENTAS_CREAR` |
| 4 | `CLIENTAS_EDITAR` |
| 5 | `SERVICIOS_VER` |
| 6 | `SERVICIOS_GESTIONAR` |
| 7 | `SERVICIOS_REGISTRAR` |
| 8 | `PUNTOS_AJUSTAR` |
| 9 | `RECOMPENSAS_VER` |
| 10 | `RECOMPENSAS_GESTIONAR` |
| 11 | `CANJES_REGISTRAR` |
| 12 | `USUARIOS_GESTIONAR` |
| 13 | `ROLES_GESTIONAR` |
| 14 | `AUDITORIA_VER` |

Constantes en código: `src/shared/auth/permisos.ts` (`PERMISOS` / `PERMISOS_REALES`).

## Mapeo API → permiso

| Dominio | Operación | Permiso |
|---|---|---|
| Dashboard | GET `/dashboard/resumen` | `DASHBOARD_VER` |
| Clientas | GET | `CLIENTAS_VER` |
| Clientas | POST | `CLIENTAS_CREAR` |
| Clientas | PATCH / estado | `CLIENTAS_EDITAR` |
| Servicios | GET | `SERVICIOS_VER` |
| Servicios | POST / PATCH / estado | `SERVICIOS_GESTIONAR` |
| Servicios realizados | GET | `SERVICIOS_VER` |
| Servicios realizados | POST / anular | `SERVICIOS_REGISTRAR` |
| Puntos | saldo / historial / listar | `CLIENTAS_VER` |
| Puntos | `POST /puntos/otorgar` | `PUNTOS_AJUSTAR` |
| Recompensas | GET | `RECOMPENSAS_VER` |
| Recompensas | POST / PATCH / estado | `RECOMPENSAS_GESTIONAR` |
| Canjes | listar / consultar | `CLIENTAS_VER` |
| Canjes | crear / entregar / anular | `CANJES_REGISTRAR` |
| Usuarios admin | todo el módulo | `USUARIOS_GESTIONAR` |
| Roles / listado permisos | todo | `ROLES_GESTIONAR` |
| Auditoría | GET | `AUDITORIA_VER` |
| QR | listar / validar | `CLIENTAS_VER` |
| QR | generar / revocar | `CLIENTAS_EDITAR` |
| Credenciales | GET | `CLIENTAS_VER` |
| Credenciales | upsert / estado / password | `CLIENTAS_EDITAR` |
| Sesiones | listar | `CLIENTAS_VER` |
| Sesiones | crear / revocar | `CLIENTAS_EDITAR` |

### Criterio QR / credenciales / sesiones

No existen permisos `QR_*`, `CREDENCIALES_*` ni `SESIONES_*` en BD.

- **Consulta** (listar QR, validar QR, ver credencial sin hash, listar sesiones): parte del expediente de la clienta → `CLIENTAS_VER`.
- **Mutación** (generar/revocar QR, upsert/password/estado credenciales, crear/revocar sesiones): altera acceso/identidad de la clienta → `CLIENTAS_EDITAR`.

### Criterio puntos (consulta)

No existe `PUNTOS_VER`. El saldo e historial son datos de la clienta → `CLIENTAS_VER`. Solo el ajuste manual usa `PUNTOS_AJUSTAR`.

### Criterio canjes (consulta)

No existe `CANJES_VER`. Listar/consultar canjes se trata como historial ligado a clienta → `CLIENTAS_VER`. Mutaciones del flujo → `CANJES_REGISTRAR`.

## Modo bootstrap del guard

En `requirePermission` (`src/shared/auth/guards.ts`):

Si el rol del JWT **no tiene filas** en `rol_permisos`, se **permite** cualquier ruta autenticada.

Motivo: compatibilidad con administradores cuyo rol aún no tiene matriz asignada.

**No eliminar este comportamiento todavía.** Cuando todos los roles productivos tengan `rol_permisos`, se podrá endurecer el guard.

Lógica pura reutilizable: `isPermissionAllowed(assigned, required)` en `permisos.ts`.
