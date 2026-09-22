'use client';

import { useEffect, useState } from 'react';
import { getDashboardResumen } from '@/lib/api';
import { ApiClientError } from '@/lib/api/client';
import {
  ErrorState,
  LoadingState,
  PageHeader,
  StatCard,
} from '@/components/ui/feedback';
import type { DashboardResumen } from '@/types/api';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResumen | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardResumen()
      .then(setData)
      .catch((e) =>
        setError(e instanceof ApiClientError ? e.message : 'No se pudo cargar el resumen'),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Dashboard"
        description="Resumen del salón y del programa de fidelización."
      />
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      {data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Clientas" value={data.clientas.total} hint={`${data.clientas.activas} activas`} />
          <StatCard label="Servicios activos" value={data.servicios_activos} />
          <StatCard
            label="Recompensas activas"
            value={data.recompensas_activas}
            accent="brass"
          />
          <StatCard label="Canjes pendientes" value={data.canjes_solicitados} />
          <StatCard
            label="Puntos hoy"
            value={data.hoy.movimientos_puntos}
            hint="movimientos"
          />
          <StatCard
            label="Atenciones hoy"
            value={data.hoy.servicios_realizados}
            accent="ink"
          />
          <StatCard
            label="Usuarios admin"
            value={data.usuarios_admin.total}
            hint={`${data.usuarios_admin.activos} activos`}
            accent="ink"
          />
        </div>
      ) : null}
    </div>
  );
}
