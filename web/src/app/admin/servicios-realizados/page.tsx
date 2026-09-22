'use client';

import { useEffect, useMemo, useState } from 'react';
import { listClientas } from '@/lib/api/clientas';
import { listServicios } from '@/lib/api/servicios';
import { anularServicioRealizado, listServiciosRealizados } from '@/lib/api';
import { ApiClientError } from '@/lib/api/client';
import { AtencionMultiServicioForm } from '@/components/admin/atencion-multi-servicio-form';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/form-controls';
import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  StatusBadge,
} from '@/components/ui/feedback';
import { formatDate } from '@/lib/utils';
import type { Clienta, Servicio, ServicioRealizado } from '@/types/api';

export default function ServiciosRealizadosPage() {
  const [clientas, setClientas] = useState<Clienta[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [items, setItems] = useState<ServicioRealizado[]>([]);
  const [idClienta, setIdClienta] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const clienta = useMemo(
    () => clientas.find((c) => String(c.id_clienta) === idClienta) ?? null,
    [clientas, idClienta],
  );

  async function refresh() {
    const data = await listServiciosRealizados({ limit: 30 });
    setItems(data.items);
  }

  useEffect(() => {
    Promise.all([
      listClientas({ limit: 100, estado: 'ACTIVA' }),
      listServicios({ limit: 100, estado: 'ACTIVO' }),
      listServiciosRealizados({ limit: 30 }),
    ])
      .then(([c, s, sr]) => {
        setClientas(c.items);
        setServicios(s.items);
        setItems(sr.items);
      })
      .catch((e) => setError(e instanceof ApiClientError ? e.message : 'Error'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Servicios realizados"
        description="Registrá una atención con uno o varios servicios. Todo en una sola operación."
      />
      <Card className="mb-6 bg-form">
        <div className="mb-4 max-w-md">
          <Select
            label="Buscar clienta"
            required
            value={idClienta}
            onChange={(e) => {
              setIdClienta(e.target.value);
              setMsg('');
              setError('');
            }}
          >
            <option value="">Seleccionar…</option>
            {clientas.map((c) => (
              <option key={c.id_clienta} value={c.id_clienta}>
                {c.nombres} {c.apellidos} ({c.puntos_saldo} pts)
              </option>
            ))}
          </Select>
        </div>

        {clienta ? (
          <AtencionMultiServicioForm
            idClienta={clienta.id_clienta}
            clientaLabel={`${clienta.nombres} ${clienta.apellidos}`}
            telefono={clienta.telefono}
            puntosSaldo={clienta.puntos_saldo}
            servicios={servicios}
            onSuccess={async (r) => {
              setMsg(
                r.duplicated
                  ? 'Operación idempotente: atención existente'
                  : `Atención OK · ${r.cantidad} servicios · +${r.puntos} pts`,
              );
              if (r.nuevoSaldo != null) {
                setClientas((prev) =>
                  prev.map((c) =>
                    c.id_clienta === clienta.id_clienta
                      ? { ...c, puntos_saldo: r.nuevoSaldo! }
                      : c,
                  ),
                );
              }
              await refresh();
            }}
            onError={(m) => setError(m)}
          />
        ) : (
          <p className="text-sm text-ink-soft">Seleccioná una clienta para continuar.</p>
        )}
        {msg ? <p className="mt-3 text-sm text-lacquer">{msg}</p> : null}
      </Card>
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && items.length === 0 ? (
        <EmptyState title="Todavía no hay atenciones registradas." />
      ) : null}
      <div className="space-y-2">
        {items.map((item) => (
          <Card
            key={item.id_servicio_realizado}
            className="flex flex-wrap items-center justify-between gap-3"
          >
            <div>
              <p className="font-semibold text-ink">#{item.id_servicio_realizado}</p>
              <p className="text-xs text-ink-soft">
                Clienta {item.id_clienta} · Servicio {item.id_servicio} ·{' '}
                {formatDate(item.realizado_en)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-lacquer">+{item.puntos_otorgados} pts</span>
              <StatusBadge estado={item.estado} />
              {item.estado === 'REGISTRADO' ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    void anularServicioRealizado(item.id_servicio_realizado)
                      .then(refresh)
                      .catch((e) =>
                        setError(e instanceof ApiClientError ? e.message : 'Error'),
                      )
                  }
                >
                  Anular
                </Button>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
