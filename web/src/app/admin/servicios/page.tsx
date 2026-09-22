'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  createServicio,
  listServicios,
  updateServicio,
  updateServicioEstado,
} from '@/lib/api/servicios';
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
  PointsBadge,
  StatusBadge,
} from '@/components/ui/feedback';
import { formatMoney } from '@/lib/utils';
import type { Servicio } from '@/types/api';

const emptyForm = {
  nombre: '',
  descripcion: '',
  precio: '45.5',
  puntos_otorgados: '10',
};

export default function ServiciosPage() {
  const [items, setItems] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listServicios({ limit: 100 });
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

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
    setError('');
  }

  function openEdit(s: Servicio) {
    setEditingId(s.id_servicio);
    setForm({
      nombre: s.nombre,
      descripcion: s.descripcion || '',
      precio: String(s.precio),
      puntos_otorgados: String(s.puntos_otorgados),
    });
    setOpen(true);
    setError('');
  }

  function closeForm() {
    setOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      precio: Number(form.precio),
      puntos_otorgados: Number(form.puntos_otorgados),
    };
    try {
      if (editingId != null) {
        await updateServicio(editingId, payload);
      } else {
        await createServicio(payload);
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
        title="Servicios"
        description="Catálogo del salón y puntos otorgados."
        actions={
          <Button onClick={() => (open ? closeForm() : openCreate())}>
            {open ? 'Cerrar' : 'Nuevo servicio'}
          </Button>
        }
      />
      {open ? (
        <Card className="mb-6 bg-form">
          <h3 className="mb-4 font-display text-xl text-ink">
            {editingId != null ? 'Editar servicio' : 'Nuevo servicio'}
          </h3>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
            <Input
              label="Nombre"
              required
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
            <Input
              label="Precio"
              required
              type="number"
              min={0}
              step="0.01"
              value={form.precio}
              onChange={(e) => setForm({ ...form, precio: e.target.value })}
            />
            <Input
              label="Puntos otorgados"
              type="number"
              min={0}
              value={form.puntos_otorgados}
              onChange={(e) => setForm({ ...form, puntos_otorgados: e.target.value })}
            />
            <div className="md:col-span-2">
              <Textarea
                label="Descripción"
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              />
            </div>
            <div className="flex flex-wrap gap-2 md:col-span-2">
              <Button type="submit" loading={saving}>
                {editingId != null ? 'Guardar cambios' : 'Guardar'}
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
      {!loading && items.length === 0 ? (
        <EmptyState title="No hay servicios todavía." />
      ) : null}
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((s) => (
          <Card key={s.id_servicio}>
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-2xl">{s.nombre}</h3>
              <StatusBadge estado={s.estado} />
            </div>
            <p className="mt-2 text-sm text-ink-soft">{s.descripcion || 'Sin descripción'}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-ink">{formatMoney(s.precio)}</span>
              <PointsBadge points={s.puntos_otorgados} />
              <Button size="sm" variant="secondary" onClick={() => openEdit(s)}>
                Editar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  void updateServicioEstado(
                    s.id_servicio,
                    s.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO',
                  ).then(load)
                }
              >
                {s.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
