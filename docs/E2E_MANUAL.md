# E2E manual — Studio S

Checklist práctico pre-producción. Marcar cada ítem al verificarlo en **local**.

**Local:** WEB http://localhost:3001 · API http://localhost:3000 · Health `/api/health`

**Producción (referencia):** API https://api.automotorestrujillo.com · WEB Vercel (`NEXT_PUBLIC_API_URL` → API HTTPS)

No ejecutar contra producción datos reales salvo ventana controlada.

---

## A. Clienta

- [ ] Registrar nueva clienta
- [ ] Intentar registrar email duplicado → 409
- [ ] Login correcto → `/mi-tarjeta`
- [ ] Login contraseña incorrecta → mensaje claro
- [ ] Ver Mi Tarjeta
- [ ] Ver puntos iniciales
- [ ] Generar / ver QR (`studios:qr:…`)
- [ ] Logout
- [ ] Login nuevamente

## B. Admin

- [ ] Login admin
- [ ] Dashboard
- [ ] Clientas (listado + detalle)
- [ ] Acceso al portal (crear / desactivar / restablecer password)
- [ ] Servicios
- [ ] Recompensas
- [ ] QR (`/admin/qr`)
- [ ] Servicios realizados
- [ ] Puntos
- [ ] Canjes
- [ ] Auditoría

## C. QR

- [ ] Escanear QR válido → clienta correcta
- [ ] QR inválido → error
- [ ] QR revocado → 409
- [ ] QR expirado → 409
- [ ] **No** otorgar puntos solo por escanear

## D. Multi-servicio

Clienta X · Servicios A + B + C

- [ ] Seleccionar A, B, C
- [ ] Ver resumen (cantidad, total, puntos)
- [ ] Registrar atención
- [ ] Éxito + nuevo saldo
- [ ] Movimientos de puntos correctos
- [ ] Filas en servicios realizados

## E. Idempotencia (atención)

- [ ] Registrar atención con `idempotency_key` K
- [ ] Reenviar misma operación (misma K) → no duplica puntos ni líneas
- [ ] Nueva K → nueva atención

## F. Canje

- [ ] Canje con puntos suficientes → descuento + movimiento `CANJE`
- [ ] Estado `SOLICITADO`
- [ ] Entregar → `ENTREGADO`
- [ ] Intentar anular `ENTREGADO` → 409
- [ ] Canje sin puntos suficientes → 409
- [ ] Doble click en “Registrar canje” → un solo canje (UI + saldo condicional)

> **Nota:** idempotencia HTTP de canje (misma key) **requiere cambio de schema**. Hoy: UI anti-doble-click + `updateMany` condicional de saldo/stock.

## G. Permisos

Probar roles: SUPER_ADMIN · ADMINISTRADOR · RECEPCIONISTA

- [ ] Frontend oculta acciones sin permiso
- [ ] Backend rechaza (403) aunque se invoque la API

## H. Sesiones

- [ ] Token admin inválido / expirado → 401 → `/login`
- [ ] Token clienta inválido / expirado → 401 → `/clienta/login`
- [ ] Token admin en endpoint clienta → 401
- [ ] Token clienta en endpoint admin → 401

## I. Errores (no exponer secretos)

Probar / forzar y confirmar UI/logs seguros:

- [ ] 400 · 401 · 403 · 404 · 409 · 429 · 500

No deben aparecer al usuario: SQL, Prisma internals, stack, `password`, `password_hash`, `token_hash`, `JWT_SECRET`, `DB_PASSWORD`.

## J. Deploy / CORS

- [ ] Health producción: `database: connected`
- [ ] `NEXT_PUBLIC_API_URL=https://api.automotorestrujillo.com`
- [ ] Dominio Vercel real agregado a `CORS_ORIGINS` (sin `*` ni `true`)
- [ ] Secretos solo en entorno servidor (no en repo)

## Reset password

UI `/clienta/olvide-password` y `/clienta/reset-password` son **informativas**. Recuperación operativa: recepción → ficha clienta → Acceso al portal. Ver `docs/PASSWORD_RESET.md`.
