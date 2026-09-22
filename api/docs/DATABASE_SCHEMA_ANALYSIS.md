# Análisis del schema Prisma (Studio S)

Fuente: `prisma/schema.prisma` (introspección MariaDB).  
Cliente generado: `src/generated/prisma` (Prisma 7.10.0, `moduleFormat = cjs`).

**No se inventaron tablas, campos ni relaciones.**  
**No se ejecutaron migraciones ni `db push`.**

## Modelos (14)

| Modelo Prisma | Tabla | PK |
|---|---|---|
| `UsuariosAdmin` | `usuarios_admin` | `idUsuario` → `id_usuario` |
| `auditoria` | `auditoria` | `id_auditoria` |
| `canjes_recompensas` | `canjes_recompensas` | `id_canje` |
| `clientas` | `clientas` | `id_clienta` |
| `credenciales_clientas` | `credenciales_clientas` | `id_credencial` |
| `movimientos_puntos` | `movimientos_puntos` | `id_movimiento` |
| `permisos` | `permisos` | `id_permiso` |
| `qr_clientas` | `qr_clientas` | `id_qr` |
| `recompensas` | `recompensas` | `id_recompensa` |
| `rol_permisos` | `rol_permisos` | (`id_rol`, `id_permiso`) |
| `roles` | `roles` | `id_rol` |
| `servicios` | `servicios` | `id_servicio` |
| `servicios_realizados` | `servicios_realizados` | `id_servicio_realizado` |
| `sesiones_clientas` | `sesiones_clientas` | `id_sesion` |

## Enums reales

- `UsuariosAdminEstado`: ACTIVO | INACTIVO | BLOQUEADO
- `roles_estado`: ACTIVO | INACTIVO
- `servicios_estado`: ACTIVO | INACTIVO
- `movimientos_puntos_tipo`: ACUMULACION | CANJE | AJUSTE_POSITIVO | AJUSTE_NEGATIVO | REVERSO
- `recompensas_estado`: ACTIVA | INACTIVA
- `credenciales_clientas_estado`: ACTIVA | INACTIVA
- `canjes_recompensas_estado`: SOLICITADO | ENTREGADO | ANULADO
- `clientas_estado`: ACTIVA | INACTIVA | BLOQUEADA
- `servicios_realizados_estado`: REGISTRADO | ANULADO

## Campos clave por dominio

### Clientas
- `public_id` CHAR(36) único
- `puntos_saldo` UNSIGNED INT (saldo denormalizado)
- Relación 1:1 opcional con `credenciales_clientas`
- Relación 1:N con QR, sesiones, movimientos, canjes, servicios realizados

### Movimientos de puntos
- `tipo` enum real (no inventado)
- `puntos` INT con signo (negativo en CANJE)
- `saldo_anterior` / `saldo_posterior`
- FKs opcionales: `id_servicio_realizado`, `id_canje`, `id_usuario_admin`

### Servicios realizados
- `idempotency_key` CHAR(36) **único** → base de idempotencia
- `precio_unitario` Decimal(10,2), `puntos_otorgados`, `cantidad`
- Estados: REGISTRADO | ANULADO

### Canjes
- `codigo_canje` CHAR(12) único
- `puntos_utilizados` UNSIGNED
- Estados: SOLICITADO | ENTREGADO | ANULADO

### QR / sesiones
- Solo se persiste `token_hash` CHAR(64) (SHA-256)
- QR: `activo`, `expira_en`, `revocado_en`, `ultimo_uso_en`
- Sesiones: `expira_en` obligatorio, `revocada_en` opcional

### Roles / permisos
- `permisos.codigo` único — **14 códigos reales** en MariaDB (`DASHBOARD_VER`, `CLIENTAS_VER`, …). Ver `docs/PERMISSIONS.md`.
- Matriz N:M en `rol_permisos`
- Autorización API vía códigos literales en `permisos.codigo` (sin sistema paralelo ni códigos inventados tipo `clientas.ver`)

### Auditoría
- Textos JSON en `datos_anteriores` / `datos_nuevos`
- El backend redacta password/token/secret/JWT antes de guardar

## Limitaciones / notas de implementación

1. **Auth de clientas (login app móvil/web clienta)** no está como endpoint público de sesión JWT propio: el schema soporta `credenciales_clientas` + `sesiones_clientas` (hash), y el admin puede crear/revocar sesiones. No hay campo JWT en BD para clientas.
2. **Permisos en BD**: exactamente 14 códigos (`docs/PERMISSIONS.md`). El backend usa esos literales. Si un rol no tiene filas en `rol_permisos`, `requirePermission` permite acceso autenticado (bootstrap documentado).
3. No hay tabla de “notificaciones”, “sucursales” ni “configuración”: no se implementaron.
4. El saldo de puntos se mantiene en `clientas.puntos_saldo` y se reconcilia con cada movimiento en transacción.
