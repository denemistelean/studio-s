'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { ajustarPuntos, listMovimientos } from '@/lib/api';
import { listClientas } from '@/lib/api/clientas';
import { ApiClientError } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/form-controls';
import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
} from '@/components/ui/feedback';
import { formatDate } from '@/lib/utils';
import type { Clienta, MovimientoPuntos } from '@/types/api';

export default function PuntosPage() {
  const [items, setItems] = useState<MovimientoPuntos[]>([]);
  const [clientas, setClientas] = useState<Clienta[]>([]);
  const [tipo, setTipo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    id_clienta: '',
    tipo: 'AJUSTE_POSITIVO',
    puntos: '10',
    descripcion: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listMovimientos({
        limit: 40,
        tipo: tipo || undefined,
      });
      setItems(data.items);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [tipo]);

  useEffect(() => {
    void listClientas({ limit: 100, estado: 'ACTIVA' }).then((d) => setClientas(d.items));
    void load();
  }, [load]);

  async function onAjuste(e: FormEvent) {
    e.preventDefault();
    try {
      await ajustarPuntos({
        id_clienta: Number(form.id_clienta),
        tipo: form.tipo as 'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO',
        puntos: Number(form.puntos),
        descripcion: form.descripcion || null,
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo ajustar');
    }
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Puntos"
        description="Historial de movimientos y ajustes manuales."
      />
      <Card className="mb-6 bg-form">
        <form className="grid gap-3 md:grid-cols-4" onSubmit={onAjuste}>
          <Select
            label="Clienta"
            required
            value={form.id_clienta}
            onChange={(e) => setForm({ ...form, id_clienta: e.target.value })}
          >
            <option value="">Seleccionar…</option>
            {clientas.map((c) => (
              <option key={c.id_clienta} value={c.id_clienta}>
                {c.nombres} {c.apellidos}
              </option>
            ))}
          </Select>
          <Select
            label="Tipo"
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
          >
            <option value="AJUSTE_POSITIVO">AJUSTE_POSITIVO</option>
            <option value="AJUSTE_NEGATIVO">AJUSTE_NEGATIVO</option>
          </Select>
          <Input
            label="Puntos"
            type="number"
            min={1}
            required
            value={form.puntos}
            onChange={(e) => setForm({ ...form, puntos: e.target.value })}
          />
          <Input
            label="Descripción"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          />
          <Button type="submit">Registrar ajuste</Button>
        </form>
      </Card>
      <div className="mb-4 max-w-xs">
        <Select label="Filtrar historial" value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="">Todos</option>
          <option value="ACUMULACION">ACUMULACION</option>
          <option value="CANJE">CANJE</option>
          <option value="REVERSO">REVERSO</option>
          <option value="AJUSTE_POSITIVO">AJUSTE_POSITIVO</option>
          <option value="AJUSTE_NEGATIVO">AJUSTE_NEGATIVO</option>
        </Select>
      </div>
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && items.length === 0 ? (
        <EmptyState title="Sin movimientos de puntos." />
      ) : null}
      <div className="space-y-2">
        {items.map((m) => (
          <Card key={m.id_movimiento} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">
                {m.tipo} · clienta {m.id_clienta}
              </p>
              <p className="text-xs text-ink-soft">
                {m.descripcion || '—'} · {formatDate(m.creado_en)}
              </p>
            </div>
            <p
              className={
                m.puntos >= 0 ? 'font-display text-2xl text-lacquer' : 'font-display text-2xl text-ink'
              }
            >
              {m.puntos >= 0 ? '+' : ''}
              {m.puntos}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
