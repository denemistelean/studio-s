# E2E CLEANUP REPORT

## Entorno

| Campo | Valor |
|-------|-------|
| NODE_ENV | development |
| DB_HOST | localhost |
| DB_PORT | 3306 |
| DB_NAME | automot1_studios |
| DB_USER | automot1_studioapp |

**¿Producción?** NO — host `localhost`, `NODE_ENV=development`.

Secretos no incluidos en este documento.

## Criterio de confirmación E2E

Solo se marcan clientas con evidencia inequívoca:

- email `@example.com` de fases de desarrollo (`fase2`, `fase3`)
- nombres/apellidos de prueba: Demo / Test / QR

## Clientas E2E detectadas

| ID | Nombre | Email | Evidencia |
|----|--------|-------|-----------|
| 3 | Lucia Demo | clienta.fase2.e68ff29b@example.com | registro fase2 + Demo |
| 4 | Ana Test | clienta.fase2.139a7855@example.com | registro fase2 + Test |
| 5 | Rosa QR | qr.fase3.0bdbe516@example.com | registro fase3 QR |

## Credenciales

| ID | Clienta | Email |
|----|---------|-------|
| 1 | 3 | clienta.fase2.e68ff29b@example.com |
| 2 | 4 | clienta.fase2.139a7855@example.com |
| 3 | 5 | qr.fase3.0bdbe516@example.com |

## Sesiones

| Clienta | IDs sesión |
|---------|------------|
| 3 | 1, 2, 3 |
| 4 | 4, 5, 6 |
| 5 | 7 |

## QR

| ID | Clienta | Activo |
|----|---------|--------|
| 1 | 5 | no |
| 2 | 5 | sí |

## Servicios realizados

Ninguno ligado a clientas 3/4/5.

## Movimientos

Ninguno ligado a clientas 3/4/5.

## Recompensas E2E

Ninguna (tabla vacía).

## Canjes E2E

Ninguno (tabla vacía).

## Registros que NO serán eliminados

| ID | Registro | Motivo |
|----|----------|--------|
| 2 | Clienta GERALDINE RABANAL ULLILEN | Sin marcador E2E; creada por admin |
| 6 | Clienta CINDY ELIZABET RIJALBA DIAZ | Email corporativo real; teléfono real; sesión/uso real |
| 4 | Credencial erijalba_truji@… | Pertenece a clienta 6 |
| 21 | Servicio realizado | Clienta 6 |
| 24 | Movimiento puntos | Clienta 6 |
| — | QR clienta 6 (13) | Clienta real |
| — | Sesiones clienta 6 | Clienta real |
| 1 | Admin studios.admi@gmail.com | Usuario real |
| — | roles (3), permisos (14), servicios (3) | Datos base |
| — | auditoria (59 filas) | Se conserva trazabilidad; no se purga |

## Orden de eliminación planificado

1. `sesiones_clientas` WHERE id_clienta IN (3,4,5)
2. `qr_clientas` WHERE id_clienta IN (3,4,5)
3. `credenciales_clientas` WHERE id_clienta IN (3,4,5)
4. `clientas` WHERE id_clienta IN (3,4,5)

Transacción única. Confirmación: `CONFIRM_CLEANUP=YES`.

## Resultado de ejecución

Ejecutado: `CONFIRM_CLEANUP=YES npm run cleanup:e2e`

| Acción | Resultado |
|--------|-----------|
| sesiones eliminadas | 7 |
| QR eliminados | 2 |
| credenciales eliminadas | 3 |
| clientas eliminadas | 3 (IDs 3, 4, 5) |
| clientas restantes | 2 (IDs 2 y 6) |
| verificación IDs 3/4/5 | 0 registros |
| admin / roles / permisos / servicios | intactos |
| backup | `D:\xampp\backups\studio-s\` (fuera del repo) |
