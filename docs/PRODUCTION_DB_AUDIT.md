# STUDIO S — PRODUCTION DATABASE AUDIT

## 1. Conexión

| Campo | Valor |
|-------|--------|
| Environment evaluado | **Local** (`api/.env`) |
| NODE_ENV | `development` |
| DB Host | `localhost` |
| DB Port | `3306` |
| DB Name | `automot1_studios` |
| DB User | `automot1_studioapp` |

**Secretos:** no incluidos.

### Determinación de producción

| Fuente | ¿Contiene host/credenciales de producción? |
|--------|---------------------------------------------|
| `api/.env` | No — apunta a `localhost` |
| `api/.env.example` | No — placeholders (`localhost`, `DB_USER`) |
| `docs/DEPLOY.md` | Solo documenta que la BD vive en **cPanel** (`automot1_studios`); **sin** host/usuario/password reales |
| Otros `.env.production` / vault en repo | **No existen** |

**Conclusión:** no hay configuración usable de BD de **producción** en este workspace.

Por las reglas de esta fase:

> Si `DB_HOST` es `localhost` / `127.0.0.1`, tratarlo como local salvo evidencia explícita de producción.

No se realizó ninguna consulta a un servidor remoto de producción.  
No se usó la BD local como sustituto de producción.  
No se adivinaron credenciales.

### Mensaje de corte

**Configuración de BD producción no disponible para auditoría.**

---

## 2. Tablas

| Tabla | Existe | Compatible | Estado |
|-------|--------|------------|--------|
| — | N/A | N/A | **NO AUDITADO** (sin acceso a producción) |

Modelos/tablas esperados (referencia Prisma, no verificados en prod):

1. `usuarios_admin` (modelo `UsuariosAdmin`)
2. `auditoria`
3. `canjes_recompensas`
4. `clientas`
5. `credenciales_clientas`
6. `movimientos_puntos`
7. `permisos`
8. `qr_clientas`
9. `recompensas`
10. `rol_permisos`
11. `roles`
12. `servicios`
13. `servicios_realizados`
14. `sesiones_clientas`

---

## 3. Schema

| Tabla | Estado | Diferencias |
|-------|--------|-------------|
| — | N/A | Auditoría estructural **no ejecutada** contra producción |

---

## 4. Roles

| ID | Rol | Estado |
|----|-----|--------|
| — | Esperados: SUPER_ADMIN, ADMINISTRADOR, RECEPCIONISTA | **NO VERIFICADO EN PROD** |

---

## 5. Permisos

| ID | Permiso | Estado |
|----|---------|--------|
| — | 14 códigos esperados (DASHBOARD_VER … AUDITORIA_VER) | **NO VERIFICADO EN PROD** |

---

## 6. Role permissions

| Rol | Permisos | Cantidad | Estado |
|-----|----------|----------|--------|
| SUPER_ADMIN | — | esperado 14 | **NO VERIFICADO** |
| ADMINISTRADOR | — | esperado 13 | **NO VERIFICADO** |
| RECEPCIONISTA | — | esperado 8 | **NO VERIFICADO** |
| Total | — | esperado 35 | **NO VERIFICADO** |

---

## 7. Admin

| ID | Email | Rol | Estado |
|----|-------|-----|--------|
| — | `studios.admi@gmail.com` (esperado) | — | **NO VERIFICADO EN PROD** |

Password / `password_hash`: no consultados.

---

## 8. Servicios

| ID | Nombre | Estado |
|----|--------|--------|
| — | — | **NO VERIFICADO EN PROD** |

---

## 9. Conteos

| Tabla | Registros |
|-------|-----------|
| — | **NO AUDITADO** |

---

## 10. Integridad

- clientas: **NO AUDITADO**
- credenciales: **NO AUDITADO**
- sesiones: **NO AUDITADO**
- QR: **NO AUDITADO**
- servicios: **NO AUDITADO**
- movimientos: **NO AUDITADO**
- canjes: **NO AUDITADO**

---

## 11. Diferencias local/prod

### ESTRUCTURA

No comparable: falta acceso de lectura a producción.

### DATOS

No comparable / no aplicable. La BD local **no** debe usarse como proxy de producción.

---

## 12. Problemas encontrados

### CRÍTICO

- No existe en el workspace un `DB_HOST` / `DATABASE_URL` / credenciales de **producción** para realizar la auditoría read-only.

### ALTO

- Hasta no auditar producción, no se puede afirmar “BD LISTA PARA DEPLOY” a nivel de datos base (roles, permisos, admin, servicios).

### MEDIO

- `docs/DEPLOY.md` indica BD en cPanel, pero las variables reales viven solo en el panel (correcto por seguridad); hace falta una vía controlada de lectura para el auditor.

### INFORMATIVO

- El `.env` local es `development` + `localhost` (correcto para no confundir con prod).
- No se ejecutó ninguna escritura ni Prisma migrate/push.
- No se consultó la BD local bajo el nombre “producción”.

---

## 13. Acciones necesarias

1. Proveer (fuera de Git) una configuración de **solo lectura** a producción, por ejemplo:
   - archivo local no versionado `api/.env.production.local` (ignorado por Git), **o**
   - variables de entorno de sesión con `DB_HOST` del MariaDB remoto de cPanel.
2. Confirmar que `DB_HOST` **no** sea `localhost`/`127.0.0.1` (salvo túnel SSH explícitamente documentado como producción).
3. Re-ejecutar esta auditoría read-only (`SELECT` / `SHOW` / `information_schema` únicamente).
4. Solo después del PASS estructural/base: proceder al deploy manual documentado en `docs/DEPLOY.md`.

**No crear** roles, permisos, admin ni servicios desde esta fase.

---

## Criterio final

### BD BLOQUEADA

*(para efectos de esta auditoría: no se pudo verificar producción por falta de configuración accessible)*

Más precisamente: **auditoría de producción no iniciable** hasta disponer de conexión read-only a la BD remota. No implica que la BD en cPanel esté mal; implica que **desde este entorno no se puede certificar**.
