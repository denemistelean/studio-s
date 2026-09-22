# Plan de pruebas de integración HTTP — Studio S API

**Base URL:** `https://api.automotorestrujillo.com`  
**Prefijo API:** `/api`  
**Estado del documento:** solo análisis de código. **No se ejecutaron** POST/PATCH/DELETE ni mutaciones contra producción.

Fuente de verdad: schemas Zod + routes + services en `src/modules/*`.  
Permisos: literales de MariaDB (`docs/PERMISSIONS.md`).

---

## Prerrequisito (auth) — lectura previa a mutaciones

Antes de cualquier endpoint protegido:

| Campo | Valor |
|---|---|
| Método | `POST` |
| URL | `/api/auth/login` |
| Auth | No |
| Body | `{ "email": "<admin>", "password": "<secreto>" }` |
| Respuesta 200 | `{ "success": true, "data": { "accessToken": "...", "expiresIn": "...", "user": { ... } } }` |

Header en el resto:

```http
Authorization: Bearer <accessToken>
Content-Type: application/json
```

Códigos comunes en todos los endpoints protegidos:

| Código | Causa |
|---|---|
| 401 | Sin JWT / JWT inválido |
| 403 | JWT válido pero sin el permiso requerido (si el rol tiene matriz en `rol_permisos`) |
| 400 | Validación Zod |
| 404 | Recurso inexistente |
| 409 | Conflicto de negocio (estado, saldo, stock, límite, etc.) |

**Nota bootstrap:** si el rol del token no tiene filas en `rol_permisos`, el guard permite acceso autenticado.

---

## 1. Crear clienta

| Campo | Valor |
|---|---|
| Método | `POST` |
| URL relativa | `/api/clientas` |
| Permiso | `CLIENTAS_CREAR` |
| Auth | JWT Bearer |
| Headers | `Authorization`, `Content-Type: application/json` |
| Query | — |
| Body JSON | ver abajo |
| Respuesta 201 | `{ "success": true, "message": "Clienta creada", "data": { "clienta": { ... } } }` |
| HTTP | `201` OK · `400` · `401` · `403` |

```json
{
  "nombres": "Ana",
  "apellidos": "Pérez",
  "telefono": "999111222",
  "fecha_nacimiento": "1990-05-15",
  "estado": "ACTIVA"
}
```

- Obligatorios: `nombres`, `apellidos`
- Opcionales: `telefono`, `fecha_nacimiento` (`YYYY-MM-DD`), `estado` (default `ACTIVA`)
- El servidor genera `public_id` (UUID) y `puntos_saldo = 0`

---

## 2. Listar / buscar clientas

| Campo | Valor |
|---|---|
| Método | `GET` |
| URL relativa | `/api/clientas` |
| Permiso | `CLIENTAS_VER` |
| Auth | JWT |
| Headers | `Authorization` |
| Query | `page`, `limit`, `q`, `estado`, `sort`, `order` |
| Body | — |
| Respuesta 200 | `{ "success": true, "data": { "items": [...], "meta": { "total", "page", "limit", "totalPages", "hasNextPage", "hasPrevPage" } } }` |
| HTTP | `200` · `400` · `401` · `403` |

Ejemplo: `/api/clientas?page=1&limit=20&q=Pérez&estado=ACTIVA&sort=apellidos&order=asc`

---

## 3. Consultar una clienta

| Campo | Valor |
|---|---|
| Método | `GET` |
| URL relativa | `/api/clientas/:id` |
| Permiso | `CLIENTAS_VER` |
| Auth | JWT |
| Params | `id` = `id_clienta` (entero positivo) |
| Respuesta 200 | `{ "success": true, "data": { "clienta": { "id_clienta", "public_id", "nombres", "apellidos", "telefono", "fecha_nacimiento", "puntos_saldo", "estado", "creado_en", "actualizado_en" } } }` |
| HTTP | `200` · `400` (id inválido) · `401` · `403` · `404` |

---

## 4. Listar servicios

| Campo | Valor |
|---|---|
| Método | `GET` |
| URL relativa | `/api/servicios` |
| Permiso | `SERVICIOS_VER` |
| Auth | JWT |
| Query | `page`, `limit`, `q`, `estado` (`ACTIVO`\|`INACTIVO`), `sort`, `order` |
| Respuesta 200 | `{ "success": true, "data": { "items": [...], "meta": {...} } }` |
| HTTP | `200` · `400` · `401` · `403` |

---

## 5. Crear servicio

| Campo | Valor |
|---|---|
| Método | `POST` |
| URL relativa | `/api/servicios` |
| Permiso | `SERVICIOS_GESTIONAR` |
| Auth | JWT |
| Body | ver abajo |
| Respuesta 201 | `{ "success": true, "message": "Servicio creado", "data": { "servicio": { ... } } }` |
| HTTP | `201` · `400` · `401` · `403` |

```json
{
  "nombre": "Manicure clásica",
  "descripcion": "Servicio básico",
  "precio": 45.5,
  "puntos_otorgados": 10,
  "estado": "ACTIVO"
}
```

- Obligatorios: `nombre`, `precio` (≥ 0)
- Opcionales: `descripcion`, `puntos_otorgados` (default `0`), `estado` (default `ACTIVO`)

---

## 6. Registrar servicio realizado

| Campo | Valor |
|---|---|
| Método | `POST` |
| URL relativa | `/api/servicios-realizados` |
| Permiso | `SERVICIOS_REGISTRAR` |
| Auth | JWT |
| Body | ver abajo |
| Respuesta 201 (nuevo) | `{ "success": true, "message": "Servicio realizado registrado", "data": { "servicio_realizado": {...}, "duplicated": false } }` |
| Respuesta 200 (idempotente) | `{ "success": true, "message": "Operación idempotente: registro existente", "data": { "servicio_realizado": {...}, "duplicated": true } }` |
| HTTP | `201` · `200` (duplicado) · `400` · `401` · `403` · `404` · `409` (clienta/servicio no activos) |

```json
{
  "id_clienta": 1,
  "id_servicio": 2,
  "cantidad": 1,
  "idempotency_key": "550e8400-e29b-41d4-a716-446655440000",
  "observaciones": null,
  "realizado_en": "2026-09-18T16:00:00.000Z"
}
```

- Obligatorios: `id_clienta`, `id_servicio`, `idempotency_key` (UUID v4)
- Opcionales: `cantidad` (default `1`), `observaciones`, `realizado_en` (ISO datetime)
- Efecto: copia `precio` del servicio, calcula puntos (`puntos_otorgados * cantidad`), actualiza `clientas.puntos_saldo`, crea movimiento `ACUMULACION` (si puntos > 0). Todo en `$transaction`.

---

## 7. Consultar movimientos de puntos

| Campo | Valor |
|---|---|
| Método | `GET` |
| URL relativa | `/api/puntos` **o** `/api/clientas/:id/movimientos-puntos` |
| Permiso | `CLIENTAS_VER` |
| Auth | JWT |
| Query global | `page`, `limit`, `tipo`, `order`, `id_clienta` (solo en `/api/puntos`) |
| Query por clienta | `page`, `limit`, `tipo`, `order` |
| Respuesta 200 | `{ "success": true, "data": { "items": [ { "id_movimiento", "id_clienta", "tipo", "puntos", "saldo_anterior", "saldo_posterior", ... } ], "meta": {...} } }` |
| HTTP | `200` · `400` · `401` · `403` · `404` (historial por clienta inexistente) |

`tipo`: `ACUMULACION` \| `CANJE` \| `AJUSTE_POSITIVO` \| `AJUSTE_NEGATIVO` \| `REVERSO`

---

## 8. Consultar saldo de clienta

| Campo | Valor |
|---|---|
| Método | `GET` |
| URL relativa | `/api/clientas/:id/puntos` |
| Permiso | `CLIENTAS_VER` |
| Auth | JWT |
| Params | `id` = `id_clienta` |
| Respuesta 200 | `{ "success": true, "data": { "id_clienta", "nombres", "apellidos", "estado", "puntos_saldo" } }` |
| HTTP | `200` · `400` · `401` · `403` · `404` |

También se puede leer `puntos_saldo` en `GET /api/clientas/:id`.

---

## 9. Crear recompensa

| Campo | Valor |
|---|---|
| Método | `POST` |
| URL relativa | `/api/recompensas` |
| Permiso | `RECOMPENSAS_GESTIONAR` |
| Auth | JWT |
| Body | ver abajo |
| Respuesta 201 | `{ "success": true, "message": "Recompensa creada", "data": { "recompensa": {...} } }` |
| HTTP | `201` · `400` · `401` · `403` |

```json
{
  "nombre": "Esmalte gratis",
  "descripcion": "Canjeable en caja",
  "puntos_requeridos": 100,
  "stock": 5,
  "limite_por_clienta": 1,
  "estado": "ACTIVA"
}
```

- Obligatorios: `nombre`, `puntos_requeridos` (entero > 0)
- Opcionales: `descripcion`, `stock`, `limite_por_clienta`, `estado` (default `ACTIVA`)

---

## 10. Consultar recompensas

| Campo | Valor |
|---|---|
| Método | `GET` |
| URL relativa | `/api/recompensas` (listado) · `/api/recompensas/:id` (detalle) |
| Permiso | `RECOMPENSAS_VER` |
| Auth | JWT |
| Query listado | `page`, `limit`, `q`, `estado` (`ACTIVA`\|`INACTIVA`), `sort`, `order` |
| Respuesta listado 200 | `{ "success": true, "data": { "items": [...], "meta": {...} } }` |
| Respuesta detalle 200 | `{ "success": true, "data": { "recompensa": {...} } }` |
| HTTP | `200` · `400` · `401` · `403` · `404` (detalle) |

---

## 11. Crear canje

| Campo | Valor |
|---|---|
| Método | `POST` |
| URL relativa | `/api/canjes` |
| Permiso | `CANJES_REGISTRAR` |
| Auth | JWT |
| Body | ver abajo |
| Respuesta 201 | `{ "success": true, "message": "Canje registrado", "data": { "canje": { "id_canje", "codigo_canje", "puntos_utilizados", "estado": "SOLICITADO", ... } } }` |
| HTTP | `201` · `400` · `401` · `403` · `404` · `409` (inactiva, sin stock, límite, puntos insuficientes) |

```json
{
  "id_clienta": 1,
  "id_recompensa": 3,
  "observaciones": "Entrega en caja"
}
```

- Obligatorios: `id_clienta`, `id_recompensa`
- Opcional: `observaciones`
- Transacción: valida clienta `ACTIVA`, recompensa `ACTIVA`, stock, límite, saldo; crea canje; descuenta puntos; movimiento `CANJE`; decrementa stock si aplica; genera `codigo_canje` (12 chars).

---

## 12. Consultar canjes

| Campo | Valor |
|---|---|
| Método | `GET` |
| URL relativa | `/api/canjes` · `/api/clientas/:id/canjes` |
| Permiso | `CLIENTAS_VER` |
| Auth | JWT |
| Query | `page`, `limit`, `id_clienta` (solo global), `estado` (`SOLICITADO`\|`ENTREGADO`\|`ANULADO`), `order` |
| Respuesta 200 | `{ "success": true, "data": { "items": [...], "meta": {...} } }` |
| HTTP | `200` · `400` · `401` · `403` · `404` (ruta por clienta inexistente) |

---

## 13. Entregar canje

| Campo | Valor |
|---|---|
| Método | `PATCH` |
| URL relativa | `/api/canjes/:id/entregar` |
| Permiso | `CANJES_REGISTRAR` |
| Auth | JWT |
| Params | `id` = `id_canje` |
| Body | — (vacío / omitido) |
| Respuesta 200 | `{ "success": true, "message": "Canje entregado", "data": { "canje": { "estado": "ENTREGADO", "entregado_en": "..." } } }` |
| HTTP | `200` · `400` · `401` · `403` · `404` · `409` (solo desde `SOLICITADO`) |

---

## 14. Anular canje

| Campo | Valor |
|---|---|
| Método | `PATCH` |
| URL relativa | `/api/canjes/:id/anular` |
| Permiso | `CANJES_REGISTRAR` |
| Auth | JWT |
| Params | `id` = `id_canje` |
| Body | — |
| Respuesta 200 | `{ "success": true, "message": "Canje anulado", "data": { "canje": { "estado": "ANULADO" } } }` |
| HTTP | `200` · `400` · `401` · `403` · `404` · `409` (ya `ANULADO` o `ENTREGADO`) |

Efecto (transacción): solo si estado `SOLICITADO` → `ANULADO`; reintegra puntos; movimiento `REVERSO`; restaura stock si aplica.

---

## 15. Anular servicio realizado

| Campo | Valor |
|---|---|
| Método | `PATCH` |
| URL relativa | `/api/servicios-realizados/:id/anular` |
| Permiso | `SERVICIOS_REGISTRAR` |
| Auth | JWT |
| Params | `id` = `id_servicio_realizado` |
| Body | — |
| Respuesta 200 | `{ "success": true, "message": "Servicio realizado anulado", "data": { "servicio_realizado": { "estado": "ANULADO" } } }` |
| HTTP | `200` · `400` · `401` · `403` · `404` · `409` (ya anulado o saldo quedaría negativo) |

Efecto (transacción): marca `ANULADO`; descuenta puntos otorgados del saldo; movimiento `REVERSO` (si puntos > 0).

---

## Respuestas a preguntas A–J

### A. Obligatorios para crear clienta

`nombres`, `apellidos`.

### B. Obligatorios para crear servicio

`nombre`, `precio`.

### C. Obligatorios para registrar servicio realizado

`id_clienta`, `id_servicio`, `idempotency_key` (UUID).

### D. Cómo se genera `idempotency_key`

**El cliente la genera** (no el servidor). Debe ser un UUID válido (`z.string().uuid()`), p. ej. `crypto.randomUUID()` en Node/browser. Se persiste en `servicios_realizados.idempotency_key` (único en BD). Reenviar la misma key no duplica el registro ni los puntos (`duplicated: true`, HTTP 200).

### E. Cómo se consulta el saldo

`GET /api/clientas/:id/puntos` → campo `puntos_saldo`. Alternativa: `GET /api/clientas/:id`.

### F. Cómo se crea una recompensa

`POST /api/recompensas` con `nombre` + `puntos_requeridos` (y opcionales). Permiso `RECOMPENSAS_GESTIONAR`.

### G. Campos que necesita un canje

Obligatorios: `id_clienta`, `id_recompensa`. Opcional: `observaciones`. El servidor fija `puntos_utilizados` desde la recompensa y genera `codigo_canje`.

### H. Cómo funciona la anulación

| Recurso | Condición | Efecto |
|---|---|---|
| Canje | Solo `SOLICITADO` (no `ENTREGADO` ni ya `ANULADO`) | Estado `ANULADO` + reintegro puntos + `REVERSO` + stock+1 si aplica |
| Servicio realizado | Solo si no está `ANULADO`; saldo no puede quedar negativo | Estado `ANULADO` + resta puntos + `REVERSO` |

### I. Operaciones con `prisma.$transaction` (mutaciones críticas)

| Operación | Tipo |
|---|---|
| Registrar servicio realizado | interactive `$transaction` (saldo + movimiento + fila) |
| Anular servicio realizado | interactive `$transaction` |
| Ajuste de puntos (`POST /puntos/otorgar`) | interactive `$transaction` |
| Crear canje | interactive `$transaction` |
| Anular canje | interactive `$transaction` |
| Generar QR (revoca anteriores + crea) | interactive `$transaction` |
| Asignar permisos a rol | interactive `$transaction` |
| Listados (count + findMany) | `$transaction([...])` batch (solo lectura) |

### J. Protección contra duplicados

| Mecanismo | Dónde |
|---|---|
| `idempotency_key` único + lookup previo + manejo de carrera en create | `POST /api/servicios-realizados` |
| `codigo_canje` único (reintento de generación si colisión) | `POST /api/canjes` |
| Email único credenciales / admin | módulos respectivos (fuera de este plan de 15) |
| Unicidad `public_id` clienta | generado en servidor |

No hay idempotency key en canjes ni en creación de clienta/servicio/recompensa: un POST repetido crea otro registro.

---

## Orden sugerido de prueba (cuando se autorice mutar)

> **Esta fase del documento no ejecuta estos pasos.** Orden lógico futuro:

0. `GET /api/health` (solo lectura)
1. `POST /api/auth/login` → guardar token  
2. `GET` listados (clientas, servicios, recompensas, canjes, puntos) — **solo lectura**  
3. (Con autorización explícita) crear clienta → servicio → servicio realizado (UUID nuevo) → verificar saldo → recompensa → canje → entregar → (otro canje) anular → anular un servicio realizado de prueba  
4. Reenviar mismo `idempotency_key` → esperar `200` + `duplicated: true`

---

## Fase actual — permitido vs prohibido

| Acción | ¿Permitido en esta fase? |
|---|---|
| Analizar código / redactar este plan | Sí |
| `GET /api/health` (si se autoriza smoke read-only) | Solo lectura; **no ejecutado en esta entrega** |
| `POST` / `PATCH` / `DELETE` | **No** |
| Mutar MariaDB / migrate / db push | **No** |

---

## Referencias de código

- Schemas: `src/modules/*/ *.schemas.ts`
- Rutas: `src/modules/*/ *.routes.ts`
- Permisos: `src/shared/auth/permisos.ts`, `docs/PERMISSIONS.md`
- Catálogo HTTP: `docs/API.md`
