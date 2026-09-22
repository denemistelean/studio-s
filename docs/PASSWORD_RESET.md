# Recuperación de contraseña (clientas) — pendiente de schema

## Estado actual

- UI informativa (no engañosa):
  - `/clienta/olvide-password` — indica que el self-service **no está disponible**
  - `/clienta/reset-password` — no simula cambio de contraseña
- Admin **sí** puede restablecer desde la ficha:
  `PATCH /api/clientas/:id/credenciales/password` (bcrypt, sin devolver hash)
- **No hay** tabla de tokens de reset en el schema actual
- **No hay** proveedor de correo configurado

## Por qué se detuvo el backend self-service

Sin una tabla para tokens de un solo uso con expiración, no se puede implementar el flujo seguro sin inventar persistencia.

## Propuesta (requiere aprobación)

Tabla sugerida `password_reset_clientas` (orientativa; **no ejecutar sin aprobación**):

| Columna | Tipo | Notas |
|---------|------|--------|
| id | BIGINT PK | |
| id_clienta | BIGINT FK | |
| token_hash | CHAR(64) | SHA-256 del token opaco |
| expira_en | DATETIME | p.ej. 1 hora |
| usado_en | DATETIME NULL | un solo uso |
| creado_en | DATETIME | |

Flujo propuesto:

1. `POST /api/auth/clienta/olvide-password` `{ email }` → siempre 200 mensaje genérico
2. Si existe credencial ACTIVA: generar token, guardar **hash**, enviar link por email
3. `POST /api/auth/clienta/reset-password` `{ token, password }` → validar → bcrypt → marcar usado → revocar sesiones

## Integración email

Pendiente decidir proveedor. Variables orientativas: `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM`, `APP_WEB_URL`.

## Alternativa inmediata (operativa)

Recepción: **Admin → Clientas → Acceso al portal → Restablecer contraseña**.
