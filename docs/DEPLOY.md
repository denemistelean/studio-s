# Deploy Studio S

## Arquitectura

| Capa | Destino |
|------|---------|
| WEB (Next.js) | Vercel |
| API (Fastify) | `https://api.automotorestrujillo.com` |
| DB | MariaDB cPanel (`automot1_studios`) |

## Variables WEB (Vercel)

| Variable | Local | Producción |
|----------|-------|------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000` | `https://api.automotorestrujillo.com` |

Opcional: dominio Vercel del proyecto (ej. `https://studio-s-xxx.vercel.app`) para CORS en la API.

## Variables API (producción)

Usadas en runtime (`api/src/config/env.ts` + Prisma adapter):

| Variable | Uso |
|----------|-----|
| `NODE_ENV` | `production` |
| `HOST` | `0.0.0.0` |
| `PORT` | puerto del proceso |
| `DATABASE_URL` | URL MySQL/MariaDB |
| `DB_HOST` | host MariaDB |
| `DB_PORT` | `3306` típico |
| `DB_NAME` | `automot1_studios` |
| `DB_USER` | usuario DB |
| `DB_PASSWORD` | password DB |
| `JWT_SECRET` | ≥ 32 chars |
| `JWT_EXPIRES_IN` | ej. `8h` |
| `CORS_ORIGINS` | lista CSV **sin** `*` ni `true` |

Ejemplo CORS producción (ajustar dominio Vercel real):

```
CORS_ORIGINS=https://TU_PROYECTO.vercel.app,https://tudominio.com
```

Desarrollo:

```
CORS_ORIGINS=http://localhost:3001
```

## Local vs producción

| | Local | Producción |
|--|-------|------------|
| WEB | http://localhost:3001 | Vercel (dominio real pendiente de anotar en CORS) |
| API | http://localhost:3000 | https://api.automotorestrujillo.com |
| Health | http://localhost:3000/api/health | https://api.automotorestrujillo.com/api/health |

## Checklist E2E manual (pre-producción)

Ver checklist completo: [`docs/E2E_MANUAL.md`](./E2E_MANUAL.md).

Notas de canjes (concurrencia / idempotencia): [`docs/CANJES.md`](./CANJES.md).

Pendiente documentado: recuperación self-service por email (`docs/PASSWORD_RESET.md`).

## Rate limiting (auth)

Aplicado en:

- `POST /api/auth/login`
- `POST /api/auth/clienta/login`
- `POST /api/auth/clienta/registro`

Límite: **20 intentos / 15 min / IP / ruta** (en memoria del proceso).

## Checklist deploy

1. [ ] Build API: `cd api && npm test && npm run build`
2. [ ] Build WEB: `cd web && npm run build`
3. [ ] Configurar `NEXT_PUBLIC_API_URL` en Vercel
4. [ ] Configurar env API en el servidor
5. [ ] Agregar origen Vercel a `CORS_ORIGINS`
6. [ ] Probar `/api/health` → `database: connected`
7. [ ] Probar login admin y clienta desde el dominio WEB
8. [ ] Confirmar que QR y atención multi-servicio funcionan

## Reglas

- No `prisma db push` / `migrate reset` en producción.
- No `origin: *` ni `origin: true`.
- No imprimir JWT, tokens QR ni passwords en logs.
