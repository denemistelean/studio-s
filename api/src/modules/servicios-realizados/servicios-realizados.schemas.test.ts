import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createAtencionSchema,
  createServicioRealizadoSchema,
  listServiciosRealizadosQuerySchema,
} from './servicios-realizados.schemas';
import {
  attentionLineIdempotencyKey,
  attentionMarker,
} from '../../shared/utils/ids';

const UUID = '550e8400-e29b-41d4-a716-446655440000';
const UUID2 = '550e8400-e29b-41d4-a716-446655440001';

describe('servicios-realizados.schemas', () => {
  it('exige idempotency_key UUID', () => {
    const ok = createServicioRealizadoSchema.safeParse({
      id_clienta: 1,
      id_servicio: 2,
      cantidad: 1,
      idempotency_key: UUID,
    });
    assert.equal(ok.success, true);

    const bad = createServicioRealizadoSchema.safeParse({
      id_clienta: 1,
      id_servicio: 2,
      idempotency_key: 'no-uuid',
    });
    assert.equal(bad.success, false);
  });

  it('lista con filtros de estado reales', () => {
    const parsed = listServiciosRealizadosQuerySchema.safeParse({ estado: 'REGISTRADO' });
    assert.equal(parsed.success, true);
  });

  it('atención con 1 servicio', () => {
    const one = createAtencionSchema.safeParse({
      id_clienta: 1,
      idempotency_key: UUID,
      items: [{ id_servicio: 10, cantidad: 1 }],
    });
    assert.equal(one.success, true);
  });

  it('atención con 2 servicios', () => {
    const two = createAtencionSchema.safeParse({
      id_clienta: 1,
      idempotency_key: UUID,
      items: [{ id_servicio: 1 }, { id_servicio: 2 }],
    });
    assert.equal(two.success, true);
  });

  it('atención con 3+ servicios', () => {
    const three = createAtencionSchema.safeParse({
      id_clienta: 1,
      idempotency_key: UUID2,
      items: [{ id_servicio: 1 }, { id_servicio: 2 }, { id_servicio: 3 }],
    });
    assert.equal(three.success, true);
  });

  it('rechaza items vacío', () => {
    const empty = createAtencionSchema.safeParse({
      id_clienta: 1,
      idempotency_key: UUID,
      items: [],
    });
    assert.equal(empty.success, false);
  });

  it('rechaza servicios duplicados en la misma atención', () => {
    const dup = createAtencionSchema.safeParse({
      id_clienta: 1,
      idempotency_key: UUID,
      items: [{ id_servicio: 1 }, { id_servicio: 1 }],
    });
    assert.equal(dup.success, false);
  });

  it('rechaza idempotency_key inválida', () => {
    const badKey = createAtencionSchema.safeParse({
      id_clienta: 1,
      idempotency_key: 'x',
      items: [{ id_servicio: 1 }],
    });
    assert.equal(badKey.success, false);
  });
});

describe('atención idempotencia determinista', () => {
  it('misma atención key → mismas line keys (sin duplicar en retry)', () => {
    const items = [10, 20, 30];
    const first = items.map((id, i) => attentionLineIdempotencyKey(UUID, i, id));
    const second = items.map((id, i) => attentionLineIdempotencyKey(UUID, i, id));
    assert.deepEqual(first, second);
    assert.equal(new Set(first).size, 3);
  });

  it('otra atención key → line keys distintas', () => {
    const a = attentionLineIdempotencyKey(UUID, 0, 1);
    const b = attentionLineIdempotencyKey(UUID2, 0, 1);
    assert.notEqual(a, b);
  });

  it('marcador agrupa líneas de la misma atención', () => {
    assert.equal(attentionMarker(UUID), `[atencion:${UUID}]`);
  });
});
