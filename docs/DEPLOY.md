# Deploy Studio S

Documentación para **deploy manual**. No ejecutar deploy desde aquí.

| Capa | Destino |
|------|---------|
| API (Fastify + Prisma) | cPanel Node.js → `https://api.automotorestrujillo.com` |
| WEB (Next.js) | Vercel |
| BD | MariaDB cPanel (`automot1_studios`) |

---

## A. Deploy API cPanel

### Requisitos confirmados en el proyecto

| Ítem | Valor real en repo |
|------|-------------------|
| Node | `>=20.20.0` (`api/package.json` → `engines`) |
| Build | `npm run build` → TypeScript → `dist/` |
| Startup file | `dist/server.js` |
| Start | `npm start` (= `node dist/server.js`) |
| Main | `dist/server.js` |

### Campos en cPanel (completar en el panel; no inventar rutas)

| Campo cPanel | Qué poner |
|--------------|-----------|
| **Application Root** | Ruta absoluta a la carpeta `api` en el hosting (la define cPanel al crear la Node App) |
| **Startup File** | `dist/server.js` |
| **Application URL** | Subdominio API ya previsto: `api.automotorestrujillo.com` (HTTPS) |
| **Node.js version** | **20.x** (≥ 20.20) |
| **Variables de entorno** | Ver sección B (solo en cPanel; nunca en Git) |

### Pasos manuales

1. Subir/clonar el código en el servidor.
2. Crear **Setup Node.js App** (Node 20.x).
3. Application root = carpeta `api`.
4. Startup file = `dist/server.js`.
5. Cargar variables de entorno (sección B).
6. Instalar dependencias (`npm ci` o NPM Install del panel).
7. `npx prisma generate`
8. `npm run build`
9. Restart de la aplicación.
10. Probar health (sección E).

**No** ejecutar desde esta fase: acciones reales en cPanel, `db push`, `migrate reset`, import automático de BD local.

---

## B. Variables API

| VARIABLE | OBLIGATORIA | EJEMPLO (no secretos reales) | DÓNDE CONFIGURAR |
|----------|-------------|------------------------------|------------------|
| `NODE_ENV` | Sí | `production` | cPanel → Node App → Environment |
| `HOST` | Sí | `0.0.0.0` | cPanel Environment |
| `PORT` | Sí | El que asigne cPanel a la app | cPanel Environment |
| `DATABASE_URL` | Sí | `mysql://USER:PASS@HOST:3306/automot1_studios` | cPanel Environment |
| `DB_HOST` | Sí | host MariaDB del cPanel | cPanel Environment |
| `DB_PORT` | Sí | `3306` | cPanel Environment |
| `DB_NAME` | Sí | `automot1_studios` | cPanel Environment |
| `DB_USER` | Sí | usuario DB de producción | cPanel Environment |
| `DB_PASSWORD` | Sí | *(secreto — solo cPanel)* | cPanel Environment |
| `JWT_SECRET` | Sí | ≥ 32 chars aleatorios *(secreto)* | cPanel Environment |
| `JWT_EXPIRES_IN` | Sí | `8h` | cPanel Environment |
| `CORS_ORIGINS` | Sí | `https://<DOMINIO-VERCEL-REAL>` | cPanel Environment |

Plantilla sin secretos: `api/.env.example`.

Prohibido en `CORS_ORIGINS`: `*`, `true`.

---

## C. Build (API)

```bash
cd api
npm ci
npx prisma generate
npm run build
```

Salida esperada: `dist/server.js` y resto de `dist/`.

---

## D. Startup (API)

```bash
npm start
# equivalente: node dist/server.js
```

En cPanel: **Startup File** = `dist/server.js` (tras el build).

---

## E. Health check

```http
GET https://api.automotorestrujillo.com/api/health
```

Resultado esperado:

```json
{
  "success": true,
  "message": "Studio S API funcionando",
  "data": {
    "database": "connected",
    "service": "studio-s-api"
  }
}
```

Local (dev): `GET http://localhost:3000/api/health`

---

## F. Deploy WEB Vercel

| Ítem | Valor |
|------|--------|
| Framework | Next.js |
| Carpeta | `web/` (root del proyecto Vercel o monorepo root = `web`) |
| Build | `npm run build` |
| Dev local | `npm run dev` → puerto **3001** (`-H 0.0.0.0 -p 3001`) |

Pasos manuales (dashboard Vercel):

1. Importar repo `denemistelean/studio-s`.
2. Root Directory: `web` (si monorepo).
3. Framework preset: Next.js.
4. Configurar variable (sección G).
5. Deploy desde el dashboard (no desde este agente).

**No** poner en Vercel: `JWT_SECRET`, `DB_*`, passwords.

---

## G. Variable `NEXT_PUBLIC_API_URL`

| Entorno | Valor |
|---------|--------|
| Local | `http://localhost:3000` (`web/.env.local` / `.env.example`) |
| Producción (Vercel) | `https://api.automotorestrujillo.com` |

La producción **depende** de esta variable. Fallback en código si falta: `https://api.automotorestrujillo.com` (`web/src/lib/api/client.ts`).

---

## H. Configuración CORS

| Entorno | Valor |
|---------|--------|
| Local | `http://localhost:3001` |
| Producción | **PENDIENTE DEL DOMINIO REAL DE VERCEL** |

**Dónde agregarlo:** variable de entorno `CORS_ORIGINS` de la **API en cPanel** (CSV).

Ejemplo cuando exista el dominio:

```text
CORS_ORIGINS=https://TU-PROYECTO.vercel.app
```

Opcional: dominio custom HTTPS adicional, separado por coma.

En `NODE_ENV=development` la API también acepta orígenes LAN privados solo en puerto `:3001` (pruebas en celular). En **production** solo vale la allowlist de `CORS_ORIGINS`.

No usar: `*`, `true`.

---

## I. Verificación post-deploy

Ver sección **POST DEPLOY** abajo.

Además:

1. Confirmar que la BD de **producción** ya tiene las 14 tablas/modelos, roles, permisos, usuario admin y servicios (y recompensas si aplica).
2. Si la BD ya está preparada: solo configurar credenciales en cPanel.
3. **No** importar la BD local a producción automáticamente.
4. **No** `db push` / `migrate reset` / `DROP` / `TRUNCATE` en producción.

---

## J. Rollback básico

### API (cPanel)

1. Restaurar release/código anterior en Application Root.
2. `npm ci` + `npx prisma generate` + `npm run build` si hace falta.
3. Restart Node App.
4. Verificar `/api/health`.

### WEB (Vercel)

1. Dashboard → Deployments → **Promote** / redeploy del deployment anterior estable.
2. Verificar que `NEXT_PUBLIC_API_URL` sigue apuntando a la API HTTPS.

### BD

No revertir schema desde esta guía. Si hubo cambio de datos accidental, restaurar desde backup de cPanel (fuera de este proceso).

---

## Auditoría previa de BD de producción

Ejecutar **en el servidor cPanel** (Application Root = carpeta `api`), donde `DB_HOST=localhost` es correcto.

```bash
export AUDIT_PRODUCTION=YES
# o configurar AUDIT_PRODUCTION=YES en Node.js App → Environment
npm run audit:production
```

El script (`api/scripts/audit-production-db.ts`) es **READ-ONLY**:

- Solo `SELECT` / `SHOW` / `DESCRIBE` (escritura bloqueada en código)
- No modifica tablas ni datos
- No ejecuta `db push`, migrations ni seed
- No imprime passwords, JWT, `password_hash` ni `token_hash`
- Genera `production-db-audit.txt` (reporte seguro para compartir)

**No** ejecutar `npm run audit:production` desde el PC local contra `localhost` confundiendo eso con producción remota.

---

## Producción BD — checklist previo

Antes del primer uso de la API en producción, confirmar (manual o con `audit:production` en cPanel):

- [ ] Existen las tablas/modelos Studio S (14 entidades del schema)
- [ ] Roles (SUPER_ADMIN, ADMINISTRADOR, RECEPCIONISTA)
- [ ] Permisos (14 códigos)
- [ ] Usuario admin operativo
- [ ] Servicios del catálogo
- [ ] Recompensas (si el negocio las usa)

Si todo eso ya está: solo env vars. **No** clonar datos E2E locales.

---

## Referencias localhost (clasificación)

| Ubicación | Coincidencia | Clasificación |
|-----------|--------------|---------------|
| `web/.env.example` | `localhost:3000` | Desarrollo válido (API local) |
| `web/README.md` | `localhost:3000` | Doc plantilla Next (desactualizada vs puerto WEB 3001 del proyecto) |
| `api/.env.example` | `localhost:3001` CORS | Desarrollo válido |
| `api/.env.example` | `192.168.x` ejemplo LAN | Desarrollo / celular |
| `api/src/**/*.test.ts` | `localhost:3000` en tests CORS | Test unitario válido |
| `api/scripts/cleanup-e2e.ts` | localhost / 127.0.0.1 | Guardrail anti-prod |
| `docs/*` | localhost | Documentación |
| `web/src/lib/api/client.ts` | rewrite a `http://{LAN}:3000` | Solo si hostname es IP privada (dev celular); en Vercel usa `NEXT_PUBLIC_API_URL` |

Producción: **no** depende de localhost; usa `NEXT_PUBLIC_API_URL` + CORS allowlist.

---

## Seguridad Git

- `api/.env` y `web/.env.local` **ignorados** (no versionados).
- En repo solo placeholders: `api/.env.example`, `web/.env.example`.
- No hay `JWT_SECRET` ni `DB_PASSWORD` reales en Git.

---

## Rate limiting (auth)

20 req / 15 min / IP en:

- `POST /api/auth/login`
- `POST /api/auth/clienta/login`
- `POST /api/auth/clienta/registro`

---

# POST DEPLOY

- [ ] API responde HTTPS
- [ ] `/api/health` PASS
- [ ] `database` = `connected`
- [ ] CORS correcto (origen Vercel real en `CORS_ORIGINS`)
- [ ] WEB carga
- [ ] Login admin
- [ ] Dashboard
- [ ] Login clienta
- [ ] Mi tarjeta
- [ ] QR
- [ ] Registro de servicio
- [ ] Multi-servicio
- [ ] Puntos
- [ ] Canje
- [ ] Logout
- [ ] 401 correcto

---

## Referencias

- E2E manual: [`E2E_MANUAL.md`](./E2E_MANUAL.md)
- Limpieza E2E local: [`E2E_CLEANUP_REPORT.md`](./E2E_CLEANUP_REPORT.md)
- Canjes: [`CANJES.md`](./CANJES.md)
- Password reset (pendiente schema/SMTP): [`PASSWORD_RESET.md`](./PASSWORD_RESET.md)
