'use client';

import { useEffect, useState } from 'react';
import { listAuditoria } from '@/lib/api';
import { ApiClientError } from '@/lib/api/client';
import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
} from '@/components/ui/feedback';
import { formatDate } from '@/lib/utils';
import type { AuditoriaItem } from '@/types/api';

export default function AuditoriaPage() {
  const [items, setItems] = useState<AuditoriaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    listAuditoria({ limit: 40 })
      .then((d) => setItems(d.items))
      .catch((e) => setError(e instanceof ApiClientError ? e.message : 'Error'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Auditoría"
        description="Trazabilidad de operaciones administrativas."
      />
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && items.length === 0 ? (
        <EmptyState title="Sin registros de auditoría." />
      ) : null}
      <div className="space-y-2">
        {items.map((a) => (
          <Card key={a.id_auditoria}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-ink">{a.accion}</p>
              <p className="text-xs text-ink-soft">{formatDate(a.creado_en)}</p>
            </div>
            <p className="mt-1 text-xs text-ink-soft">
              {a.tabla_afectada || '—'} #{a.registro_id ?? '—'} · admin{' '}
              {a.id_usuario_admin ?? '—'}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
