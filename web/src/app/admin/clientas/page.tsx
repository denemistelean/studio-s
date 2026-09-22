'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  createClienta,
  listClientas,
  updateClienta,
  updateClientaEstado,
} from '@/lib/api/clientas';
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
  PointsBadge,
  StatusBadge,
} from '@/components/ui/feedback';
import type { Clienta } from '@/types/api';

const emptyForm = {
  nombres: '',
  apellidos: '',
  telefono: '',
  fecha_nacimiento: '',
};

function toDateInput(value: string | null) {
  if (!value) return '';
  return value.slice(0, 10);
}

export default function ClientasPage() {
  const [items, setItems] = useState<Clienta[]>([]);
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listClientas({
        q: q || undefined,
        estado: estado || undefined,
        limit: 50,
      });
      setItems(data.items);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'Error al listar clientas');
    } finally {
      setLoading(false);
    }
  }, [q, estado]);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setError('');
  }

  function openEdit(c: Clienta) {
    setEditingId(c.id_clienta);
    setForm({
      nombres: c.nombres,
      apellidos: c.apellidos,
      telefono: c.telefono || '',
      fecha_nacimiento: toDateInput(c.fecha_nacimiento),
    });
    setShowForm(true);
    setError('');
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      nombres: form.nombres.trim(),
      apellidos: form.apellidos.trim(),
      telefono: form.telefono.trim() || null,
      fecha_nacimiento: form.fecha_nacimiento || null,
    };
    try {
      if (editingId != null) {
        await updateClienta(editingId, payload);
      } else {
        await createClienta(payload);
      }
      closeForm();
      await load();
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : editingId != null
            ? 'No se pudo actualizar'
            : 'No se pudo crear',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Clientas"
        description="Directorio y saldos del programa Studio S."
        actions={
          <Button onClick={() => (showForm ? closeForm() : openCreate())}>
            {showForm ? 'Cerrar' : 'Nueva clienta'}
          </Button>
        }
      />

      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_180px_auto]">
        <Input
          placeholder="Buscar por nombre, teléfono o public_id"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Select value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="ACTIVA">ACTIVA</option>
          <option value="INACTIVA">INACTIVA</option>
          <option value="BLOQUEADA">BLOQUEADA</option>
        </Select>
        <Button variant="secondary" onClick={() => void load()}>
          Buscar
        </Button>
      </div>

      {showForm ? (
        <Card className="mb-6 bg-form">
          <h3 className="mb-4 font-display text-xl text-ink">
            {editingId != null ? 'Editar clienta' : 'Nueva clienta'}
          </h3>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
            <Input
              label="Nombres"
              required
              value={form.nombres}
              onChange={(e) => setForm({ ...form, nombres: e.target.value })}
            />
            <Input
              label="Apellidos"
              required
              value={form.apellidos}
              onChange={(e) => setForm({ ...form, apellidos: e.target.value })}
            />
            <Input
              label="Teléfono"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            />
            <Input
              label="Fecha de nacimiento"
              type="date"
              value={form.fecha_nacimiento}
              onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })}
            />
            <div className="flex flex-wrap gap-2 md:col-span-2">
              <Button type="submit" loading={saving}>
                {editingId != null ? 'Guardar cambios' : 'Guardar clienta'}
              </Button>
              <Button type="button" variant="ghost" onClick={closeForm}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && !error && items.length === 0 ? (
        <EmptyState
          title="No hay clientas registradas todavía."
          description="Creá la primera clienta para comenzar a acumular puntos."
        />
      ) : null}

      <div className="grid gap-3">
        {items.map((c) => (
          <Card
            key={c.id_clienta}
            className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <Link
                href={`/admin/clientas/${c.id_clienta}`}
                className="font-display text-xl text-ink hover:text-lacquer"
              >
                {c.nombres} {c.apellidos}
              </Link>
              <p className="text-sm text-ink-soft">
                {c.telefono || 'Sin teléfono'} · {c.public_id.slice(0, 8)}…
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <PointsBadge points={c.puntos_saldo} />
              <StatusBadge estado={c.estado} />
              <Button size="sm" variant="secondary" onClick={() => openEdit(c)}>
                Editar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  void updateClientaEstado(
                    c.id_clienta,
                    c.estado === 'ACTIVA' ? 'INACTIVA' : 'ACTIVA',
                  ).then(load)
                }
              >
                {c.estado === 'ACTIVA' ? 'Desactivar' : 'Activar'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
