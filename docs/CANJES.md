# Canjes — notas técnicas (pre-E2E)

## Flujo

| Acción | Endpoint | Transacción | Efectos |
|--------|----------|-------------|---------|
| Crear | `POST /api/canjes` | Sí | Valida clienta/recompensa · descuenta puntos (condicional) · stock (condicional) · crea canje `SOLICITADO` · movimiento `CANJE` · auditoría |
| Entregar | `PATCH /api/canjes/:id/entregar` | Sí | Solo si `SOLICITADO` → `ENTREGADO` (`updateMany` condicional) |
| Anular | `PATCH /api/canjes/:id/anular` | Sí | Solo si no `ENTREGADO` · reverso puntos · restock · movimiento `REVERSO` |

## Idempotencia HTTP

`canjes_recompensas` **no** tiene `idempotency_key`.

**Idempotency de canje requiere cambio de schema.**

Mitigaciones actuales (sin schema):

- Frontend: deshabilitar submit + `busyRef`
- Backend: `updateMany` con `puntos_saldo >= costo` y `stock >= 1`

## Concurrencia

Dos requests simultáneos con 100 pts / costo 80:

- Antes: ambos podían leer 100 y escribir saldo=20 → doble canje inconsistente
- Ahora: solo un `updateMany` condicional gana; el otro recibe 409 `Puntos insuficientes`

Riesgo residual: `limite_por_clienta` (count + insert) sin índice único compuesto — raro; remedio futuro: constraint o lock.

Permiso: `CANJES_REGISTRAR`.
