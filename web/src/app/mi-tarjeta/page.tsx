'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrandLogo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { Card, LoadingState, StatusBadge } from '@/components/ui/feedback';
import {
  listMisCanjes,
  listMisMovimientos,
  listMisServiciosRealizados,
  listRecompensasPortal,
  ensureMiQr,
} from '@/lib/api/auth-clienta';
import { QrCodeImage } from '@/components/qr/qr-code-image';
import { useClientaAuth } from '@/lib/auth/clienta-auth-context';
import { formatDate } from '@/lib/utils';

export default function MiTarjetaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-porcelain">
          <LoadingState label="Cargando tarjeta…" />
        </div>
      }
    >
      <MiTarjetaContent />
    </Suspense>
  );
}

function MiTarjetaContent() {
  const { clienta, email, loading, logout } = useClientaAuth();
  const router = useRouter();
  const [movimientos, setMovimientos] = useState<
    Array<{
      id_movimiento: number;
      tipo: string;
      puntos: number;
      descripcion: string | null;
      creado_en: string;
    }>
  >([]);
  const [servicios, setServicios] = useState<
    Array<{
      id_servicio_realizado: number;
      servicio_nombre: string;
      puntos_otorgados: number;
      estado: string;
      realizado_en: string;
    }>
  >([]);
  const [recompensas, setRecompensas] = useState<
    Array<{
      id_recompensa: number;
      nombre: string;
      puntos_requeridos: number;
      descripcion: string | null;
    }>
  >([]);
  const [canjes, setCanjes] = useState<
    Array<{
      id_canje: number;
      codigo_canje: string;
      recompensa_nombre: string;
      puntos_utilizados: number;
      estado: string;
      solicitado_en: string;
    }>
  >([]);
  const [portalError, setPortalError] = useState('');
  const [qrPayload, setQrPayload] = useState('');
  const [qrError, setQrError] = useState('');
  const [qrLoading, setQrLoading] = useState(false);

  useEffect(() => {
    if (!loading && !clienta) {
      router.replace('/clienta/login');
    }
  }, [loading, clienta, router]);

  useEffect(() => {
    if (!clienta) return;
    Promise.all([
      listMisMovimientos({ limit: 10 }),
      listMisServiciosRealizados({ limit: 10 }),
      listRecompensasPortal({ limit: 12 }),
      listMisCanjes({ limit: 10 }),
    ])
      .then(([m, s, r, c]) => {
        setMovimientos(m.items);
        setServicios(s.items);
        setRecompensas(r.items);
        setCanjes(c.items);
      })
      .catch(() => setPortalError('No se pudo cargar parte del historial.'));

    setQrLoading(true);
    setQrError('');
    ensureMiQr()
      .then((data) => setQrPayload(data.qr_payload))
      .catch(() => setQrError('No se pudo generar tu QR. Intentá de nuevo.'))
      .finally(() => setQrLoading(false));
  }, [clienta]);

  if (loading || !clienta) {
    return (
      <div className="min-h-screen bg-porcelain">
        <LoadingState label="Cargando tu tarjeta…" />
      </div>
    );
  }

  const nextReward = recompensas.find((r) => r.puntos_requeridos > clienta.puntos_saldo);
  const progress = nextReward
    ? Math.min(100, Math.round((clienta.puntos_saldo / nextReward.puntos_requeridos) * 100))
    : 100;

  return (
    <div className="min-h-screen bg-porcelain px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <BrandLogo href="/" size="sm" showWordmark />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              void logout().then(() => router.replace('/clienta/login'));
            }}
          >
            Cerrar sesión
          </Button>
        </div>

        <div className="overflow-hidden rounded-[1.8rem] border-2 border-lacquer bg-[linear-gradient(165deg,#fffcfa,#f7f1ec_60%,#d8b4a033)] shadow-[var(--shadow-soft)]">
          <div className="border-b border-brass/30 px-6 py-5">
            <p className="font-display text-2xl text-ink">
              Studio <span className="text-lacquer">S</span>
            </p>
            <p className="text-xs uppercase tracking-[0.16em] text-brass">Tarjeta digital</p>
          </div>
          <div className="px-6 py-6">
            <p className="text-sm text-ink-soft">Clienta</p>
            <h1 className="font-display text-3xl text-ink">
              {clienta.nombres} {clienta.apellidos}
            </h1>
            <p className="mt-1 text-sm text-ink-soft">{email}</p>
            <p className="mt-1 text-xs text-ink-soft/70">ID {clienta.public_id.slice(0, 8)}…</p>
            <p className="mt-6 text-xs uppercase tracking-[0.16em] text-brass">
              Puntos disponibles
            </p>
            <p className="font-display text-5xl text-lacquer">{clienta.puntos_saldo}</p>
            <div className="mt-4">
              <StatusBadge estado={clienta.estado} />
            </div>
            <div className="mx-auto mt-8 flex flex-col items-center">
              {qrLoading ? (
                <div className="h-56 w-56 animate-pulse rounded-[1.2rem] bg-input" />
              ) : qrError ? (
                <div className="space-y-3 text-center">
                  <p className="text-sm text-lacquer-dark">{qrError}</p>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setQrLoading(true);
                      setQrError('');
                      ensureMiQr()
                        .then((data) => setQrPayload(data.qr_payload))
                        .catch(() => setQrError('No se pudo generar tu QR.'))
                        .finally(() => setQrLoading(false));
                    }}
                  >
                    Reintentar QR
                  </Button>
                </div>
              ) : qrPayload ? (
                <>
                  <div className="rounded-[1.2rem] border border-lacquer/40 bg-porcelain p-3">
                    <QrCodeImage payload={qrPayload} size={200} />
                  </div>
                  <p className="mt-3 text-center text-xs text-ink-soft">
                    Mostrá este QR en recepción para registrar tu servicio.
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-2"
                    onClick={() => {
                      setQrLoading(true);
                      ensureMiQr()
                        .then((data) => setQrPayload(data.qr_payload))
                        .catch(() => setQrError('No se pudo renovar el QR.'))
                        .finally(() => setQrLoading(false));
                    }}
                  >
                    Renovar QR
                  </Button>
                </>
              ) : null}
            </div>
          </div>
          <div className="space-y-3 bg-form px-6 py-5">
            <p className="text-sm font-semibold text-ink">
              {nextReward
                ? `Próxima: ${nextReward.nombre} (${nextReward.puntos_requeridos} pts)`
                : 'Alcanzaste las recompensas disponibles'}
            </p>
            <div className="h-2 overflow-hidden rounded-full bg-input">
              <div
                className="h-full rounded-full bg-lacquer transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-ink-soft">
              {nextReward
                ? `Te faltan ${Math.max(0, nextReward.puntos_requeridos - clienta.puntos_saldo)} puntos.`
                : 'Consultá recompensas abajo o pedí un canje en el salón.'}
            </p>
          </div>
        </div>

        {portalError ? (
          <p className="text-sm text-lacquer-dark">{portalError}</p>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2">
          <Card>
            <h2 className="font-display text-2xl">Historial de puntos</h2>
            <div className="mt-3 space-y-2">
              {movimientos.length === 0 ? (
                <p className="text-sm text-ink-soft">Todavía no hay movimientos.</p>
              ) : (
                movimientos.map((m) => (
                  <div
                    key={m.id_movimiento}
                    className="flex items-center justify-between border-b border-ink/5 py-2 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-ink">{m.tipo}</p>
                      <p className="text-xs text-ink-soft">{formatDate(m.creado_en)}</p>
                    </div>
                    <p className={m.puntos >= 0 ? 'font-semibold text-lacquer' : 'font-semibold'}>
                      {m.puntos >= 0 ? '+' : ''}
                      {m.puntos}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <h2 className="font-display text-2xl">Servicios</h2>
            <div className="mt-3 space-y-2">
              {servicios.length === 0 ? (
                <p className="text-sm text-ink-soft">Sin servicios registrados.</p>
              ) : (
                servicios.map((s) => (
                  <div
                    key={s.id_servicio_realizado}
                    className="border-b border-ink/5 py-2 text-sm"
                  >
                    <div className="flex justify-between gap-2">
                      <p className="font-semibold text-ink">{s.servicio_nombre}</p>
                      <StatusBadge estado={s.estado} />
                    </div>
                    <p className="text-xs text-ink-soft">
                      +{s.puntos_otorgados} pts · {formatDate(s.realizado_en)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </section>

        <Card>
          <h2 className="font-display text-2xl">Recompensas disponibles</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Para canjear, pedí asistencia en el salón (el canje lo registra el personal).
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {recompensas.length === 0 ? (
              <p className="text-sm text-ink-soft">No hay recompensas activas.</p>
            ) : (
              recompensas.map((r) => (
                <div
                  key={r.id_recompensa}
                  className="rounded-2xl border border-brass/25 bg-surface p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brass">
                    {r.puntos_requeridos} pts
                  </p>
                  <p className="mt-1 font-display text-xl text-ink">{r.nombre}</p>
                  <p className="mt-1 text-xs text-ink-soft">{r.descripcion || '—'}</p>
                  <p className="mt-2 text-xs text-ink-soft">
                    {clienta.puntos_saldo >= r.puntos_requeridos
                      ? 'Alcanzaste esta recompensa'
                      : `Faltan ${r.puntos_requeridos - clienta.puntos_saldo} pts`}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-2xl">Mis canjes</h2>
          <div className="mt-3 space-y-2">
            {canjes.length === 0 ? (
              <p className="text-sm text-ink-soft">Todavía no tenés canjes.</p>
            ) : (
              canjes.map((c) => (
                <div
                  key={c.id_canje}
                  className="flex items-center justify-between border-b border-ink/5 py-2 text-sm"
                >
                  <div>
                    <p className="font-semibold text-ink">{c.recompensa_nombre}</p>
                    <p className="font-mono text-xs text-ink-soft">{c.codigo_canje}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge estado={c.estado} />
                    <p className="mt-1 text-xs text-ink-soft">-{c.puntos_utilizados} pts</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <div className="flex justify-center gap-3 pb-8">
          <Link href="/">
            <Button variant="ghost">Inicio</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
