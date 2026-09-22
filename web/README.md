# Studio S Web

Frontend Next.js (App Router) + TypeScript + Tailwind CSS 4 para el salón Studio S.

## Identidad

Tokens oficiales en `src/app/globals.css` (Porcelain / Ink / Lacquer / Brass / Clay).

Tipografías: **Fraunces** (display) + **Manrope** (body).

## Arranque

```bash
cd studio-s-web
npm install
cp .env.example .env.local   # si aplica
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Variables

| Variable | Uso |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL del API (`https://api.automotorestrujillo.com`) |

Solo consume la API Fastify. **No** conecta a MariaDB.

## Rutas

| Ruta | Descripción |
|---|---|
| `/` | Landing |
| `/login` | Login admin → `POST /api/auth/login` |
| `/registro` | Placeholder (sin endpoint público de clientas aún) |
| `/admin/*` | Panel (JWT en `sessionStorage`) |
| `/mi-tarjeta` | Vista premium de tarjeta digital (UI lista; auth clienta pendiente en API) |

## Permisos

Códigos reales MariaDB (`CLIENTAS_VER`, etc.). Menú filtrado vía `GET /api/roles` cuando el rol tiene acceso; si la matriz está vacía, se muestra todo (bootstrap del backend).

## Nota importante

`POST /api/auth/login` autentica **usuarios_admin**. El login/registro público de clientas no existe todavía en la API.
