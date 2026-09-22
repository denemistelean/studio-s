'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { ScanLine } from 'lucide-react';
import { listServicios } from '@/lib/api/servicios';
import { listRecompensas, createCanje, getSaldoClienta } from '@/lib/api';
import { validateQr, type QrValidateResult } from '@/lib/api/qr';
import { ApiClientError } from '@/lib/api/client';
import { AtencionMultiServicioForm } from '@/components/admin/atencion-multi-servicio-form';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/form-controls';
import { Input } from '@/components/ui/input';
import {
  Card,
  ErrorState,
  LoadingState,
  PageHeader,
  StatusBadge,
} from '@/components/ui/feedback';
import { canAccess, PERMISOS } from '@/lib/permissions';
import { useAuth } from '@/lib/auth/auth-context';
import type { Recompensa, Servicio } from '@/types/api';

export default function AdminQrPage() {
  const { permisos } = useAuth();
  const canScan = canAccess(permisos, [PERMISOS.CLIENTAS_VER, PERMISOS.SERVICIOS_REGISTRAR]);
  const canRegister = canAccess(permisos, PERMISOS.SERVICIOS_REGISTRAR);
  const canCanje = canAccess(permisos, PERMISOS.CANJES_REGISTRAR);

  const [scanning, setScanning] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [result, setResult] = useState<QrValidateResult | null>(null);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [recompensas, setRecompensas] = useState<Recompensa[]>([]);
  const [idRecompensa, setIdRecompensa] = useState('');
  const [savingCanje, setSavingCanje] = useState(false);
  const [loadingServicios, setLoadingServicios] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const busyRef = useRef(false);
  const canjeBusyRef = useRef(false);

  useEffect(() => {
    return () => {
      void stopScanner();
    };
  }, []);

  async function stopScanner() {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    setScanning(false);
    if (!scanner) return;
    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
      await scanner.clear();
    } catch {
      // cámara ya detenida
    }
  }

  async function refreshSaldo(clientaId: number) {
    try {
      const saldo = await getSaldoClienta(clientaId);
      setResult((prev) =>
        prev
          ? {
              ...prev,
              clienta: { ...prev.clienta, puntos_saldo: saldo.puntos_saldo },
            }
          : prev,
      );
    } catch {
      // el saldo se verá al reescanear
    }
  }

  async function onValidated(data: QrValidateResult) {
    setResult(data);
    setMsg('Clienta identificada');
    setError('');
    setIdRecompensa('');
    await stopScanner();
    if (canRegister || canCanje) {
      setLoadingServicios(true);
      try {
        const [list, rec] = await Promise.all([
          canRegister
            ? listServicios({ limit: 100, estado: 'ACTIVO' })
            : Promise.resolve({ items: [] as Servicio[] }),
          canCanje
            ? listRecompensas({ limit: 100, estado: 'ACTIVA' })
            : Promise.resolve({ items: [] as Recompensa[] }),
        ]);
        setServicios(list.items);
        setRecompensas(rec.items);
      } catch {
        setError('Clienta OK, pero no se pudieron cargar catálogos.');
      } finally {
        setLoadingServicios(false);
      }
    }
  }

  async function handleScanValue(raw: string) {
    if (busyRef.current) return;
    busyRef.current = true;
    setError('');
    try {
      const data = await validateQr(raw.trim());
      await onValidated(data);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'QR no válido');
    } finally {
      busyRef.current = false;
    }
  }

  async function startScanner() {
    setError('');
    setMsg('');
    setResult(null);
    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      setScanning(true);
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 8, qrbox: { width: 240, height: 240 } },
        (decoded) => {
          void handleScanValue(decoded);
        },
        () => undefined,
      );
    } catch {
      setScanning(false);
      setError('No se pudo abrir la cámara. Usá el ingreso manual del código.');
    }
  }

  async function onManualSubmit(e: FormEvent) {
    e.preventDefault();
    await handleScanValue(manualToken);
  }

  async function onCanje(e: FormEvent) {
    e.preventDefault();
    if (!result || !idRecompensa || canjeBusyRef.current) return;
    canjeBusyRef.current = true;
    setSavingCanje(true);
    setError('');
    setMsg('');
    try {
      const data = await createCanje({
        id_clienta: result.clienta.id_clienta,
        id_recompensa: Number(idRecompensa),
      });
      setMsg(`Canje registrado: ${data.canje.codigo_canje}`);
      setIdRecompensa('');
      await refreshSaldo(result.clienta.id_clienta);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo registrar el canje');
    } finally {
      canjeBusyRef.current = false;
      setSavingCanje(false);
    }
  }

  if (!canScan) {
    return (
      <ErrorState message="No tenés permiso para escanear QR (CLIENTAS_VER o SERVICIOS_REGISTRAR)." />
    );
  }

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title="Escanear QR"
        description="Identificá la clienta. Registrá varios servicios o un canje desde la misma ficha."
        actions={
          scanning ? (
            <Button variant="ghost" onClick={() => void stopScanner()}>
              Detener cámara
            </Button>
          ) : (
            <Button onClick={() => void startScanner()}>
              <ScanLine size={16} /> Abrir cámara
            </Button>
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-form">
          <h2 className="font-display text-2xl text-ink">Cámara</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Escaneá el QR de /mi-tarjeta. También podés pegar el código manualmente.
          </p>
          <div
            id="qr-reader"
            className="mt-4 overflow-hidden rounded-2xl border border-input-border bg-ink/5"
          />
          <form className="mt-4 space-y-3" onSubmit={onManualSubmit}>
            <Input
              label="Código / payload QR"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder="studios:qr:…"
            />
            <Button type="submit" variant="secondary">
              Validar código
            </Button>
          </form>
        </Card>

        <Card>
          <h2 className="font-display text-2xl text-ink">Clienta</h2>
          {!result ? (
            <p className="mt-3 text-sm text-ink-soft">Esperando escaneo…</p>
          ) : (
            <div className="mt-4 space-y-4">
              <div>
                <p className="font-display text-3xl text-ink">
                  {result.clienta.nombres} {result.clienta.apellidos}
                </p>
                <p className="text-sm text-ink-soft">
                  {result.clienta.telefono || 'Sin teléfono'} ·{' '}
                  {result.clienta.public_id.slice(0, 8)}…
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusBadge estado={result.clienta.estado} />
                  <span className="rounded-full bg-lacquer/10 px-3 py-1 text-sm font-semibold text-lacquer">
                    {result.clienta.puntos_saldo} pts
                  </span>
                </div>
              </div>

              {loadingServicios ? <LoadingState label="Cargando…" /> : null}

              {canRegister ? (
                <div className="border-t border-ink/5 pt-4">
                  <p className="mb-3 text-sm font-semibold text-ink">Registrar atención</p>
                  <AtencionMultiServicioForm
                    idClienta={result.clienta.id_clienta}
                    puntosSaldo={result.clienta.puntos_saldo}
                    servicios={servicios}
                    onSuccess={async (r) => {
                      setMsg(
                        r.duplicated
                          ? 'Atención ya registrada (idempotente)'
                          : `Atención OK · ${r.cantidad} servicios · +${r.puntos} pts`,
                      );
                      await refreshSaldo(result.clienta.id_clienta);
                    }}
                    onError={(m) => setError(m)}
                  />
                </div>
              ) : (
                <p className="text-sm text-ink-soft">
                  Identificación OK. Para registrar servicios necesitás SERVICIOS_REGISTRAR.
                </p>
              )}

              {canCanje ? (
                <form
                  className="space-y-3 border-t border-ink/5 pt-4"
                  onSubmit={onCanje}
                >
                  <p className="text-sm font-semibold text-ink">Registrar canje</p>
                  <Select
                    label="Recompensa"
                    value={idRecompensa}
                    onChange={(e) => setIdRecompensa(e.target.value)}
                  >
                    <option value="">Seleccionar…</option>
                    {recompensas.map((r) => (
                      <option key={r.id_recompensa} value={r.id_recompensa}>
                        {r.nombre} · {r.puntos_requeridos} pts
                        {r.stock != null ? ` · stock ${r.stock}` : ''}
                      </option>
                    ))}
                  </Select>
                  <Button type="submit" loading={savingCanje} disabled={!idRecompensa}>
                    Confirmar canje
                  </Button>
                </form>
              ) : null}
            </div>
          )}
        </Card>
      </div>

      {error ? <ErrorState message={error} /> : null}
      {msg ? (
        <p className="rounded-2xl bg-[color-mix(in_srgb,var(--color-brass)_16%,white)] px-4 py-3 text-sm text-ink">
          {msg}
        </p>
      ) : null}
    </div>
  );
}
