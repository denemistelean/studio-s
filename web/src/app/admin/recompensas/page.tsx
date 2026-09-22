'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  createRecompensa,
  listRecompensas,
  updateRecompensaEstado,
} from '@/lib/api';
import { ApiClientError } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/form-controls';
import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  StatusBadge,
} from '@/components/ui/feedback';
import type { Recompensa } from '@/types/api';

export default function RecompensasPage() {
  const [items, setItems] = useState<Recompensa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    puntos_requeridos: '100',
    stock: '5',
    limite_por_clienta: '1',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listRecompensas({ limit: 100 });
      setItems(data.items);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    try {
      await createRecompensa({
        nombre: form.nombre,
        descripcion: form.descripcion || null,
        puntos_requeridos: Number(form.puntos_requeridos),
        stock: form.stock === '' ? null : Number(form.stock),
        limite_por_clienta:
          form.limite_por_clienta === '' ? null : Number(form.limite_por_clienta),
      });
      setOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo crear');
    }
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Recompensas"
        description="Catálogo premium del programa de fidelización."
        actions={<Button onClick={() => setOpen((v) => !v)}>Nueva recompensa</Button>}
      />
      {open ? (
        <Card className="mb-6 bg-form">
          <form className="grid gap-3 md:grid-cols-2" onSubmit={onCreate}>
            <Input
              label="Nombre"
              required
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
            <Input
              label="Puntos requeridos"
              type="number"
              min={1}
              required
              value={form.puntos_requeridos}
              onChange={(e) => setForm({ ...form, puntos_requeridos: e.target.value })}
            />
            <Input
              label="Stock"
              type="number"
              min={0}
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
            />
            <Input
              label="Límite por clienta"
              type="number"
              min={1}
              value={form.limite_por_clienta}
              onChange={(e) => setForm({ ...form, limite_por_clienta: e.target.value })}
            />
            <div className="md:col-span-2">
              <Textarea
                label="Descripción"
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              />
            </div>
            <Button type="submit">Guardar</Button>
          </form>
        </Card>
      ) : null}
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && items.length === 0 ? (
        <EmptyState title="No hay recompensas todavía." />
      ) : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((r) => (
          <Card
            key={r.id_recompensa}
            className="border border-brass/25 bg-[linear-gradient(180deg,#fffcfa,#f7f1ec)]"
          >
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brass">
                {r.puntos_requeridos} pts
              </p>
              <StatusBadge estado={r.estado} />
            </div>
            <h3 className="mt-2 font-display text-2xl text-ink">{r.nombre}</h3>
            <p className="mt-2 text-sm text-ink-soft">{r.descripcion || '—'}</p>
            <p className="mt-3 text-xs text-ink-soft">
              Stock: {r.stock ?? '∞'} · Límite: {r.limite_por_clienta ?? '—'}
            </p>
            <Button
              size="sm"
              variant="ghost"
              className="mt-3"
              onClick={() =>
                void updateRecompensaEstado(
                  r.id_recompensa,
                  r.estado === 'ACTIVA' ? 'INACTIVA' : 'ACTIVA',
                ).then(load)
              }
            >
              {r.estado === 'ACTIVA' ? 'Desactivar' : 'Activar'}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
