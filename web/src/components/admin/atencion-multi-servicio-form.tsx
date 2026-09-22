'use client';

import { FormEvent, useMemo, useRef, useState } from 'react';
import { createAtencion } from '@/lib/api';
import { ApiClientError } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import type { Clienta, Servicio } from '@/types/api';

type Props = {
  idClienta: number;
  clientaLabel?: string;
  puntosSaldo?: number;
  telefono?: string | null;
  servicios: Servicio[];
  onSuccess?: (result: {
    cantidad: number;
    puntos: number;
    nuevoSaldo: number | null;
    duplicated: boolean;
  }) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
};

export function AtencionMultiServicioForm({
  idClienta,
  clientaLabel,
  puntosSaldo,
  telefono,
  servicios,
  onSuccess,
  onError,
  disabled,
}: Props) {
  const [selected, setSelected] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [localMsg, setLocalMsg] = useState('');
  const [localError, setLocalError] = useState('');
  const busyRef = useRef(false);
  /** Misma key ante reintentos/doble click hasta éxito. */
  const idempotencyRef = useRef<string | null>(null);

  const selectedServicios = useMemo(
    () => servicios.filter((s) => selected.includes(s.id_servicio)),
    [servicios, selected],
  );

  const totalPrecio = selectedServicios.reduce(
    (acc, s) => acc + Number(s.precio || 0),
    0,
  );
  const totalPuntos = selectedServicios.reduce((acc, s) => acc + s.puntos_otorgados, 0);

  function toggle(id: number) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    setLocalMsg('');
    setLocalError('');
    idempotencyRef.current = null;
  }

  function remove(id: number) {
    setSelected((prev) => prev.filter((x) => x !== id));
    idempotencyRef.current = null;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (selected.length === 0 || busyRef.current || disabled) return;
    busyRef.current = true;
    setSaving(true);
    setLocalMsg('');
    setLocalError('');
    if (!idempotencyRef.current) {
      idempotencyRef.current = crypto.randomUUID();
    }
    const idempotency_key = idempotencyRef.current;
    try {
      const data = await createAtencion({
        id_clienta: idClienta,
        idempotency_key,
        items: selected.map((id_servicio) => ({ id_servicio, cantidad: 1 })),
      });
      const resumen = {
        cantidad: data.resumen.cantidad_servicios,
        puntos: data.resumen.puntos_otorgados,
        nuevoSaldo: data.resumen.nuevo_saldo,
        duplicated: data.duplicated,
      };
      const msg = data.duplicated
        ? `Atención ya registrada (idempotente). Servicios: ${resumen.cantidad}. Puntos: +${resumen.puntos}.`
        : `Atención registrada correctamente. Servicios: ${resumen.cantidad}. Puntos otorgados: +${resumen.puntos}.${
            resumen.nuevoSaldo != null ? ` Nuevo saldo: ${resumen.nuevoSaldo}.` : ''
          }`;
      setLocalMsg(msg);
      setSelected([]);
      idempotencyRef.current = null;
      onSuccess?.(resumen);
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : 'No se pudo registrar la atención. Intenta nuevamente.';
      setLocalError(message);
      onError?.(message);
    } finally {
      busyRef.current = false;
      setSaving(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      {(clientaLabel || puntosSaldo != null) && (
        <div className="rounded-2xl border border-ink/5 bg-[linear-gradient(160deg,#fffcfa,#f7f1ec)] px-4 py-3">
          {clientaLabel ? (
            <p className="font-display text-2xl text-ink">{clientaLabel}</p>
          ) : null}
          {telefono ? <p className="text-sm text-ink-soft">{telefono}</p> : null}
          {puntosSaldo != null ? (
            <p className="mt-1 text-sm font-semibold text-lacquer">
              Saldo actual: {puntosSaldo} pts
            </p>
          ) : null}
        </div>
      )}

      <fieldset disabled={disabled || saving}>
        <legend className="mb-2 text-sm font-semibold text-ink">Servicios activos</legend>
        <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
          {servicios.map((s) => {
            const checked = selected.includes(s.id_servicio);
            return (
              <li key={s.id_servicio}>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-ink/8 bg-white/70 px-3 py-2.5 hover:border-lacquer/30">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-[var(--color-lacquer)]"
                    checked={checked}
                    onChange={() => toggle(s.id_servicio)}
                    aria-label={`Seleccionar ${s.nombre}`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-ink">{s.nombre}</span>
                    <span className="text-xs text-ink-soft">
                      S/ {Number(s.precio).toFixed(2)} · +{s.puntos_otorgados} puntos
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>

      {selectedServicios.length > 0 ? (
        <div className="space-y-2 rounded-2xl border border-brass/30 bg-[color-mix(in_srgb,var(--color-brass)_10%,white)] px-4 py-3">
          <p className="text-sm font-semibold text-ink">Seleccionados</p>
          <ul className="space-y-1">
            {selectedServicios.map((s) => (
              <li
                key={s.id_servicio}
                className="flex items-center justify-between gap-2 text-sm text-ink-soft"
              >
                <span>
                  {s.nombre} · S/ {Number(s.precio).toFixed(2)} · +{s.puntos_otorgados}
                </span>
                <button
                  type="button"
                  className="text-xs font-semibold text-lacquer underline"
                  onClick={() => remove(s.id_servicio)}
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-ink/10 pt-2 text-sm text-ink">
            <p>
              {selectedServicios.length} servicio
              {selectedServicios.length === 1 ? '' : 's'} · Total: S/{' '}
              {totalPrecio.toFixed(2)} · Puntos: +{totalPuntos}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-ink-soft">Seleccioná uno o varios servicios.</p>
      )}

      <Button
        type="submit"
        loading={saving}
        disabled={disabled || selected.length === 0 || saving}
      >
        Registrar atención
      </Button>

      {localMsg ? <p className="text-sm text-lacquer">{localMsg}</p> : null}
      {localError ? <p className="text-sm text-lacquer-dark">{localError}</p> : null}
    </form>
  );
}

/** Tipado auxiliar para páginas que ya tienen Clienta. */
export type AtencionClientaPreview = Pick<
  Clienta,
  'id_clienta' | 'nombres' | 'apellidos' | 'telefono' | 'puntos_saldo'
>;
