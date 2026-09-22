'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getClienta, updateClienta } from '@/lib/api/clientas';
import { listMovimientosClienta, listCanjes, listServiciosRealizados } from '@/lib/api';
import {
  getCredencialesClienta,
  upsertCredencialesClienta,
  updateCredencialEstado,
  updateCredencialPassword,
  type CredencialClienta,
} from '@/lib/api/credenciales';
import { ApiClientError } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  ErrorState,
  LoadingState,
  PageHeader,
  StatusBadge,
} from '@/components/ui/feedback';
import { formatDate } from '@/lib/utils';
import type { Canje, Clienta, MovimientoPuntos, ServicioRealizado } from '@/types/api';

function toDateInput(value: string | null) {
  if (!value) return '';
  return value.slice(0, 10);
}

export default function ClientaDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [clienta, setClienta] = useState<Clienta | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoPuntos[]>([]);
  const [servicios, setServicios] = useState<ServicioRealizado[]>([]);
  const [canjes, setCanjes] = useState<Canje[]>([]);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    nombres: '',
    apellidos: '',
    telefono: '',
    fecha_nacimiento: '',
  });
  const [credencial, setCredencial] = useState<CredencialClienta | null>(null);
  const [credLoading, setCredLoading] = useState(true);
  const [credMsg, setCredMsg] = useState('');
  const [credError, setCredError] = useState('');
  const [credBusy, setCredBusy] = useState(false);
  const [accesoForm, setAccesoForm] = useState({ email: '', password: '' });
  const [resetPassword, setResetPassword] = useState('');

  useEffect(() => {
    if (!Number.isFinite(id)) return;
    setLoading(true);
    setCredLoading(true);
    Promise.all([
      getClienta(id),
      listMovimientosClienta(id, { limit: 20 }),
      listServiciosRealizados({ id_clienta: id, limit: 20 }),
      listCanjes({ id_clienta: id, limit: 20 }),
      getCredencialesClienta(id),
    ])
      .then(([c, m, s, cj, cred]) => {
        setClienta(c.clienta);
        setForm({
          nombres: c.clienta.nombres,
          apellidos: c.clienta.apellidos,
          telefono: c.clienta.telefono || '',
          fecha_nacimiento: toDateInput(c.clienta.fecha_nacimiento),
        });
        setMovimientos(m.items);
        setServicios(s.items);
        setCanjes(cj.items);
        setCredencial(cred);
        if (cred) setAccesoForm((f) => ({ ...f, email: cred.email }));
      })
      .catch((e) => setError(e instanceof ApiClientError ? e.message : 'Error'))
      .finally(() => {
        setLoading(false);
        setCredLoading(false);
      });
  }, [id]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!clienta) return;
    setSaving(true);
    setFormError('');
    try {
      const data = await updateClienta(clienta.id_clienta, {
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        telefono: form.telefono.trim() || null,
        fecha_nacimiento: form.fecha_nacimiento || null,
      });
      setClienta(data.clienta);
      setEditing(false);
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!clienta) return <ErrorState message="Clienta no encontrada" />;

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title={`${clienta.nombres} ${clienta.apellidos}`}
        description={clienta.telefono || 'Sin teléfono'}
        actions={
          <Button
            variant={editing ? 'ghost' : 'secondary'}
            onClick={() => {
              setEditing((v) => !v);
              setFormError('');
              setForm({
                nombres: clienta.nombres,
                apellidos: clienta.apellidos,
                telefono: clienta.telefono || '',
                fecha_nacimiento: toDateInput(clienta.fecha_nacimiento),
              });
            }}
          >
            {editing ? 'Cancelar' : 'Editar datos'}
          </Button>
        }
      />

      {editing ? (
        <Card className="bg-form">
          <form className="grid gap-3 md:grid-cols-2" onSubmit={onSave}>
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
            {formError ? (
              <p className="md:col-span-2 text-sm text-lacquer-dark">{formError}</p>
            ) : null}
            <div className="md:col-span-2">
              <Button type="submit" loading={saving}>
                Guardar cambios
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1 bg-[linear-gradient(160deg,#fffcfa,#f7f1ec)]">
          <p className="text-xs uppercase tracking-[0.16em] text-brass">Saldo</p>
          <p className="mt-2 font-display text-5xl text-lacquer">{clienta.puntos_saldo}</p>
          <p className="text-sm text-ink-soft">puntos disponibles</p>
          <div className="mt-4">
            <StatusBadge estado={clienta.estado} />
          </div>
        </Card>
        <Card className="md:col-span-2 space-y-2 text-sm text-ink-soft">
          <p>
            <span className="font-medium text-ink">Nacimiento:</span>{' '}
            {clienta.fecha_nacimiento || '—'}
          </p>
          <p>
            <span className="font-medium text-ink">Public ID:</span> {clienta.public_id}
          </p>
          <p>
            <span className="font-medium text-ink">Alta:</span> {formatDate(clienta.creado_en)}
          </p>
        </Card>
      </div>

      <Card className="bg-form">
        <h2 className="font-display text-2xl text-ink">Acceso al portal</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Credenciales de /clienta/login. La contraseña nunca se muestra ni se envía en claro al
          listar.
        </p>
        {credLoading ? <LoadingState label="Cargando acceso…" /> : null}
        {credError ? <p className="mt-2 text-sm text-lacquer-dark">{credError}</p> : null}
        {credMsg ? <p className="mt-2 text-sm text-lacquer">{credMsg}</p> : null}

        {!credLoading && !credencial ? (
          <form
            className="mt-4 grid gap-3 md:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              setCredBusy(true);
              setCredError('');
              setCredMsg('');
              void upsertCredencialesClienta(clienta.id_clienta, {
                email: accesoForm.email.trim(),
                password: accesoForm.password,
                estado: 'ACTIVA',
              })
                .then((c) => {
                  setCredencial(c);
                  setAccesoForm({ email: c.email, password: '' });
                  setCredMsg('Acceso creado.');
                })
                .catch((err) =>
                  setCredError(
                    err instanceof ApiClientError ? err.message : 'No se pudo crear el acceso',
                  ),
                )
                .finally(() => setCredBusy(false));
            }}
          >
            <Input
              label="Email"
              type="email"
              required
              value={accesoForm.email}
              onChange={(e) => setAccesoForm({ ...accesoForm, email: e.target.value })}
            />
            <Input
              label="Contraseña temporal"
              type="password"
              required
              minLength={8}
              value={accesoForm.password}
              onChange={(e) => setAccesoForm({ ...accesoForm, password: e.target.value })}
            />
            <div className="md:col-span-2">
              <Button type="submit" loading={credBusy}>
                Crear acceso
              </Button>
            </div>
          </form>
        ) : null}

        {!credLoading && credencial ? (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge estado={credencial.estado} />
              <span className="text-sm text-ink-soft">{credencial.email}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                loading={credBusy}
                onClick={() => {
                  const next = credencial.estado === 'ACTIVA' ? 'INACTIVA' : 'ACTIVA';
                  setCredBusy(true);
                  setCredError('');
                  setCredMsg('');
                  void updateCredencialEstado(clienta.id_clienta, next)
                    .then((c) => {
                      setCredencial(c);
                      setCredMsg(
                        next === 'INACTIVA' ? 'Acceso desactivado.' : 'Acceso activado.',
                      );
                    })
                    .catch((err) =>
                      setCredError(
                        err instanceof ApiClientError
                          ? err.message
                          : 'No se pudo cambiar el estado',
                      ),
                    )
                    .finally(() => setCredBusy(false));
                }}
              >
                {credencial.estado === 'ACTIVA' ? 'Desactivar acceso' : 'Activar acceso'}
              </Button>
            </div>
            <form
              className="grid max-w-md gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (resetPassword.length < 8) return;
                setCredBusy(true);
                setCredError('');
                setCredMsg('');
                void updateCredencialPassword(clienta.id_clienta, resetPassword)
                  .then(() => {
                    setResetPassword('');
                    setCredMsg('Contraseña restablecida.');
                  })
                  .catch((err) =>
                    setCredError(
                      err instanceof ApiClientError
                        ? err.message
                        : 'No se pudo restablecer la contraseña',
                    ),
                  )
                  .finally(() => setCredBusy(false));
              }}
            >
              <Input
                label="Restablecer contraseña"
                type="password"
                minLength={8}
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                placeholder="Nueva contraseña (mín. 8)"
              />
              <Button type="submit" loading={credBusy} disabled={resetPassword.length < 8}>
                Restablecer contraseña
              </Button>
            </form>
          </div>
        ) : null}
      </Card>

      <section>
        <h2 className="font-display text-2xl">Historial de puntos</h2>
        <div className="mt-3 space-y-2">
          {movimientos.map((m) => (
            <Card key={m.id_movimiento} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-semibold text-ink">{m.tipo}</p>
                <p className="text-xs text-ink-soft">{formatDate(m.creado_en)}</p>
              </div>
              <p
                className={
                  m.puntos >= 0 ? 'font-semibold text-lacquer' : 'font-semibold text-ink'
                }
              >
                {m.puntos >= 0 ? '+' : ''}
                {m.puntos}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="font-display text-2xl">Servicios realizados</h2>
          <div className="mt-3 space-y-2">
            {servicios.map((s) => (
              <Card key={s.id_servicio_realizado} className="text-sm">
                <div className="flex justify-between">
                  <span>#{s.id_servicio_realizado}</span>
                  <StatusBadge estado={s.estado} />
                </div>
                <p className="mt-1 text-ink-soft">
                  +{s.puntos_otorgados} pts · {formatDate(s.realizado_en)}
                </p>
              </Card>
            ))}
          </div>
        </div>
        <div>
          <h2 className="font-display text-2xl">Canjes</h2>
          <div className="mt-3 space-y-2">
            {canjes.map((c) => (
              <Card key={c.id_canje} className="text-sm">
                <div className="flex justify-between">
                  <span className="font-mono">{c.codigo_canje}</span>
                  <StatusBadge estado={c.estado} />
                </div>
                <p className="mt-1 text-ink-soft">-{c.puntos_utilizados} pts</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
