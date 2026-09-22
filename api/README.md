# Studio S API

Backend de fidelización **Studio S - Salón de Uñas**.

- Runtime: Node.js 20 + Fastify + TypeScript
- ORM: Prisma 7.10.0 + MariaDB 11.4
- Auth admin: JWT (`@fastify/jwt`) + bcryptjs
- API pública: `https://api.automotorestrujillo.com`
- Frontend previsto: Next.js en Vercel
- Schema: **14 modelos** documentados en `docs/DATABASE_SCHEMA_ANALYSIS.md`
- Catálogo HTTP: `docs/API.md`

## Requisitos

- Node.js ≥ 20.20.0 (cPanel 20.20.2)
- MariaDB 11.4 (estructura ya existente; **sin migraciones destructivas**)
- Variables de entorno (ver `.env.example`)

## Instalación local

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run dev
```

## Variables de entorno

| Variable | Uso |
|---|---|
| `NODE_ENV` | `development` / `production` / `test` |
| `HOST` | Escucha (`0.0.0.0` en cPanel) |
| `PORT` | Puerto HTTP |
| `DATABASE_URL` | URL MySQL/MariaDB |
| `DB_HOST` `DB_PORT` `DB_NAME` `DB_USER` `DB_PASSWORD` | Adaptador Prisma MariaDB |
| `JWT_SECRET` | Secreto JWT (mín. 32 caracteres) |
| `JWT_EXPIRES_IN` | Expiración (default `8h`) |
| `CORS_ORIGINS` | Orígenes Next.js/Vercel, separados por coma |
| `CORS_ORIGIN` | Respaldo si no hay `CORS_ORIGINS` |

## Comandos

```bash
npm run dev
npm run typecheck
npm test
npm run build
npm start
npm run prisma:generate
npm run prisma:validate
npm run admin:create -- --help
```

**No** ejecutar `prisma migrate` / `db push` contra producción sin proceso explícito.

## Autorización

Códigos **exactos** de MariaDB (`permisos.codigo`): ver `docs/PERMISSIONS.md` y `src/shared/auth/permisos.ts`.

Ejemplos: `CLIENTAS_VER`, `SERVICIOS_GESTIONAR`, `CANJES_REGISTRAR` (no `clientas.ver`).

Si el rol no tiene filas en `rol_permisos`, el guard permite acceso autenticado (modo bootstrap documentado).


## Endpoints (resumen)

### Públicos
| Método | Ruta |
|---|---|
| GET | `/api/health` |
| POST | `/api/auth/login` |

### Auth / admin
| Método | Ruta |
|---|---|
| GET | `/api/auth/me` |
| GET/POST/PATCH | `/api/usuarios-admin` … |
| GET | `/api/dashboard/resumen` |

### Fidelización
| Dominio | Rutas base |
|---|---|
| Clientas | `/api/clientas` |
| Servicios | `/api/servicios` |
| Puntos | `/api/puntos`, `/api/clientas/:id/puntos` |
| Servicios realizados | `/api/servicios-realizados` |
| Recompensas | `/api/recompensas` |
| Canjes | `/api/canjes` |
| QR | `/api/qr-clientas`, `/api/clientas/:id/qr` |
| Credenciales | `/api/clientas/:id/credenciales` |
| Sesiones | `/api/sesiones-clientas`, `/api/clientas/:id/sesiones` |
| Roles/permisos | `/api/roles`, `/api/permisos` |
| Auditoría | `/api/auditoria` |

Detalle, ejemplos y códigos HTTP: **`docs/API.md`**.

Nunca se expone `password_hash` / `passwordHash`.

## Ejemplo login

```bash
curl -sS -X POST https://api.automotorestrujillo.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"usuario@dominio.com\",\"password\":\"********\"}"
```

## CORS (Next.js / Vercel)

```text
CORS_ORIGINS=https://tu-app.vercel.app,https://tu-dominio.com
```

- `credentials: true`, sin `*`
- Headers: `Authorization`, `Content-Type`

## Despliegue cPanel

1. Startup: `dist/server.js` · Node 20.20.2 · Production  
2. Subir código sin `node_modules` ni `.env`  
3. `npm install --include=dev && npm run prisma:generate && npm run build`  
4. Reiniciar · probar `/api/health` y login  

## Documentación

- `docs/API.md` — endpoints, authz, ejemplos  
- `docs/PERMISSIONS.md` — 14 permisos reales + mapeo + bootstrap  
- `docs/DATABASE_SCHEMA_ANALYSIS.md` — modelos reales y límites del schema  
