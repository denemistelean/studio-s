'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import {
  anularCanje,
  createCanje,
  entregarCanje,
  listCanjes,
  listRecompensas,
} from '@/lib/api';
import { listClientas } from '@/lib/api/clientas';
import { ApiClientError } from '@/lib/api/client';
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
import type { Canje, Clienta, Recompensa } from '@/types/api';

export default function CanjesPage() {
  const [items, setItems] = useState<Canje[]>([]);
  const [clientas, setClientas] = useState<Clienta[]>([]);
  const [recompensas, setRecompensas] = useState<Recompensa[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ id_clienta: '', id_recompensa: '' });
  const busyRef = useRef(false);
  const actionBusyRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listCanjes({ limit: 50 });
      setItems(data.items);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.all([
      listClientas({ limit: 100, estado: 'ACTIVA' }),
      listRecompensas({ limit: 100, estado: 'ACTIVA' }),
    ]).then(([c, r]) => {
      setClientas(c.items);
      setRecompensas(r.items);
    });
    void load();
  }, [load]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (busyRef.current || !form.id_clienta || !form.id_recompensa) return;
    busyRef.current = true;
    setSaving(true);
    setError('');
    setMsg('');
    try {
      const data = await createCanje({
        id_clienta: Number(form.id_clienta),
        id_recompensa: Number(form.id_recompensa),
      });
      setMsg(`Canje registrado: ${data.canje.codigo_canje}`);
      setForm({ id_clienta: '', id_recompensa: '' });
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo canjear');
    } finally {
      busyRef.current = false;
      setSaving(false);
    }
  }

  async function onEntregar(id: number) {
    if (actionBusyRef.current != null) return;
    actionBusyRef.current = id;
    setError('');
    try {
      await entregarCanje(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo entregar');
    } finally {
      actionBusyRef.current = null;
    }
  }

  async function onAnular(id: number) {
    if (actionBusyRef.current != null) return;
    actionBusyRef.current = id;
    setError('');
    try {
      await anularCanje(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo anular');
    } finally {
      actionBusyRef.current = null;
    }
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title="Canjes" description="Solicitudes, entregas y anulaciones." />
      <Card className="mb-6 bg-form">
        <form className="grid gap-3 md:grid-cols-3" onSubmit={onCreate}>
          <Select
            label="Clienta"
            required
            value={form.id_clienta}
            onChange={(e) => setForm({ ...form, id_clienta: e.target.value })}
            disabled={saving}
          >
            <option value="">Seleccionar…</option>
            {clientas.map((c) => (
              <option key={c.id_clienta} value={c.id_clienta}>
                {c.nombres} {c.apellidos} ({c.puntos_saldo} pts)
              </option>
            ))}
          </Select>
          <Select
            label="Recompensa"
            required
            value={form.id_recompensa}
            onChange={(e) => setForm({ ...form, id_recompensa: e.target.value })}
            disabled={saving}
          >
            <option value="">Seleccionar…</option>
            {recompensas.map((r) => (
              <option key={r.id_recompensa} value={r.id_recompensa}>
                {r.nombre} · {r.puntos_requeridos} pts
              </option>
            ))}
          </Select>
          <div className="flex items-end">
            <Button type="submit" className="w-full" loading={saving} disabled={saving}>
              Registrar canje
            </Button>
          </div>
        </form>
        {msg ? <p className="mt-3 text-sm text-lacquer">{msg}</p> : null}
      </Card>
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && items.length === 0 ? (
        <EmptyState title="No hay canjes todavía." />
      ) : null}
      <div className="space-y-2">
        {items.map((c) => (
          <Card key={c.id_canje} className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-sm font-semibold text-lacquer">{c.codigo_canje}</p>
              <p className="text-xs text-ink-soft">
                Clienta {c.id_clienta} · Recompensa {c.id_recompensa} · -{c.puntos_utilizados}{' '}
                pts · {formatDate(c.solicitado_en)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge estado={c.estado} />
              {c.estado === 'SOLICITADO' ? (
                <>
                  <Button size="sm" onClick={() => void onEntregar(c.id_canje)}>
                    Entregar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => void onAnular(c.id_canje)}>
                    Anular
                  </Button>
                </>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
