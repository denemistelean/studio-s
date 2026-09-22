# API Studio S

Base URL producción: `https://api.automotorestrujillo.com`  
Prefijo: `/api`

Autenticación admin: `Authorization: Bearer <JWT>` obtenido en `POST /api/auth/login`.

**Permisos:** códigos exactos de `permisos.codigo` en MariaDB (14). Ver `docs/PERMISSIONS.md`.

Formato de respuesta:

```json
{ "success": true, "message": "...", "data": {} }
```

Errores:

```json
{ "success": false, "message": "...", "errors": [] }
```

## Variables de entorno

| Variable | Descripción |
|---|---|
| `NODE_ENV` | development / production / test |
| `HOST` / `PORT` | Escucha HTTP |
| `DATABASE_URL` | URL MySQL/MariaDB |
| `DB_HOST` `DB_PORT` `DB_NAME` `DB_USER` `DB_PASSWORD` | Adapter Prisma MariaDB |
| `JWT_SECRET` | Secreto JWT (≥32) |
| `JWT_EXPIRES_IN` | Default `8h` |
| `CORS_ORIGINS` | Orígenes Next.js/Vercel separados por coma |

## Auth (admin)

| Método | Ruta | Auth | Permiso |
|---|---|---|---|
| POST | `/auth/login` | No | — |
| GET | `/auth/me` | JWT | — |

### Login

```http
POST /api/auth/login
Content-Type: application/json

{ "email": "admin@example.com", "password": "********" }
```

Respuestas: `200` OK · `401` credenciales · `400` validación.

## Health

| Método | Ruta | Auth |
|---|---|---|
| GET | `/health` | No |

## Dashboard

| Método | Ruta | Permiso |
|---|---|---|
| GET | `/dashboard/resumen` | `DASHBOARD_VER` |

## Usuarios admin

| Método | Ruta | Permiso |
|---|---|---|
| * | `/usuarios-admin` … | `USUARIOS_GESTIONAR` |

## Clientas

| Método | Ruta | Permiso |
|---|---|---|
| GET | `/clientas` | `CLIENTAS_VER` |
| GET | `/clientas/:id` | `CLIENTAS_VER` |
| POST | `/clientas` | `CLIENTAS_CREAR` |
| PATCH | `/clientas/:id` | `CLIENTAS_EDITAR` |
| PATCH | `/clientas/:id/estado` | `CLIENTAS_EDITAR` |

Query listado: `page`, `limit`, `q`, `estado`, `sort`, `order`.

```http
POST /api/clientas
{ "nombres": "Ana", "apellidos": "Pérez", "telefono": "999111222" }
```

## Servicios

| Método | Ruta | Permiso |
|---|---|---|
| GET | `/servicios` | `SERVICIOS_VER` |
| GET | `/servicios/:id` | `SERVICIOS_VER` |
| POST | `/servicios` | `SERVICIOS_GESTIONAR` |
| PATCH | `/servicios/:id` | `SERVICIOS_GESTIONAR` |
| PATCH | `/servicios/:id/estado` | `SERVICIOS_GESTIONAR` |

Campos: `nombre`, `descripcion`, `precio`, `puntos_otorgados`, `estado` (ACTIVO|INACTIVO).

## Puntos

| Método | Ruta | Permiso |
|---|---|---|
| GET | `/puntos` | `CLIENTAS_VER` |
| GET | `/clientas/:id/puntos` | `CLIENTAS_VER` |
| GET | `/clientas/:id/movimientos-puntos` | `CLIENTAS_VER` |
| POST | `/puntos/otorgar` | `PUNTOS_AJUSTAR` |

(No existe `PUNTOS_VER` en BD; la consulta usa `CLIENTAS_VER`.)

```http
POST /api/puntos/otorgar
{
  "id_clienta": 1,
  "tipo": "AJUSTE_POSITIVO",
  "puntos": 20,
  "descripcion": "Cortesía"
}
```

Tipos de movimiento: `ACUMULACION`, `CANJE`, `AJUSTE_POSITIVO`, `AJUSTE_NEGATIVO`, `REVERSO`.

## Servicios realizados

| Método | Ruta | Permiso |
|---|---|---|
| GET | `/servicios-realizados` | `SERVICIOS_VER` |
| GET | `/servicios-realizados/:id` | `SERVICIOS_VER` |
| POST | `/servicios-realizados` | `SERVICIOS_REGISTRAR` |
| PATCH | `/servicios-realizados/:id/anular` | `SERVICIOS_REGISTRAR` |

```http
POST /api/servicios-realizados
{
  "id_clienta": 1,
  "id_servicio": 2,
  "cantidad": 1,
  "idempotency_key": "550e8400-e29b-41d4-a716-446655440000"
}
```

- Misma `idempotency_key` → `200` con registro existente (`duplicated: true`).
- Anulación → `ANULADO` + movimiento `REVERSO`.

## Recompensas

| Método | Ruta | Permiso |
|---|---|---|
| GET | `/recompensas` | `RECOMPENSAS_VER` |
| GET | `/recompensas/:id` | `RECOMPENSAS_VER` |
| POST | `/recompensas` | `RECOMPENSAS_GESTIONAR` |
| PATCH | `/recompensas/:id` | `RECOMPENSAS_GESTIONAR` |
| PATCH | `/recompensas/:id/estado` | `RECOMPENSAS_GESTIONAR` |

## Canjes

| Método | Ruta | Permiso |
|---|---|---|
| GET | `/canjes` | `CLIENTAS_VER` |
| GET | `/clientas/:id/canjes` | `CLIENTAS_VER` |
| POST | `/canjes` | `CANJES_REGISTRAR` |
| PATCH | `/canjes/:id/entregar` | `CANJES_REGISTRAR` |
| PATCH | `/canjes/:id/anular` | `CANJES_REGISTRAR` |

(No existe `CANJES_VER`; listar/consultar → `CLIENTAS_VER`.)

Flujo `POST /canjes` (transacción Prisma): valida clienta/recompensa/stock/límite/saldo; crea canje + descuenta puntos + movimiento `CANJE`.

## QR clientas

| Método | Ruta | Permiso |
|---|---|---|
| GET | `/clientas/:id/qr` | `CLIENTAS_VER` |
| POST | `/qr-clientas/validar` | `CLIENTAS_VER` |
| POST | `/qr-clientas` | `CLIENTAS_EDITAR` |
| PATCH | `/qr-clientas/:id/revocar` | `CLIENTAS_EDITAR` |

(Sin permiso `QR_*` en BD; consulta → `CLIENTAS_VER`, mutación → `CLIENTAS_EDITAR`.)

## Credenciales clientas

| Método | Ruta | Permiso |
|---|---|---|
| GET | `/clientas/:id/credenciales` | `CLIENTAS_VER` |
| PUT | `/clientas/:id/credenciales` | `CLIENTAS_EDITAR` |
| PATCH | `/clientas/:id/credenciales/estado` | `CLIENTAS_EDITAR` |
| PATCH | `/clientas/:id/credenciales/password` | `CLIENTAS_EDITAR` |

Password con bcryptjs. Nunca se expone `password_hash`.

## Sesiones clientas

| Método | Ruta | Permiso |
|---|---|---|
| GET | `/clientas/:id/sesiones` | `CLIENTAS_VER` |
| POST | `/sesiones-clientas` | `CLIENTAS_EDITAR` |
| PATCH | `/sesiones-clientas/:id/revocar` | `CLIENTAS_EDITAR` |
| POST | `/clientas/:id/sesiones/revocar-todas` | `CLIENTAS_EDITAR` |

## Roles y permisos

| Método | Ruta | Permiso |
|---|---|---|
| * | `/roles`, `/permisos` … | `ROLES_GESTIONAR` |

```http
PUT /api/roles/1/permisos
{ "codigos": ["CLIENTAS_VER", "CANJES_REGISTRAR"] }
```

Los `codigos` deben existir en `permisos.codigo` (los 14 reales).

## Auditoría

| Método | Ruta | Permiso |
|---|---|---|
| GET | `/auditoria` | `AUDITORIA_VER` |

## Bootstrap del guard

Si el rol no tiene filas en `rol_permisos`, se permite acceso autenticado. Documentado en `docs/PERMISSIONS.md`. No eliminar todavía.

## Códigos HTTP habituales

| Código | Uso |
|---|---|
| 200 | OK / idempotente |
| 201 | Creado |
| 400 | Validación |
| 401 | Sin JWT |
| 403 | Sin permiso |
| 404 | No encontrado |
| 409 | Conflicto de negocio |
| 500 | Error interno |

## CORS

`CORS_ORIGINS` debe listar dominios Vercel/Next (con credentials). No usar `*`.
