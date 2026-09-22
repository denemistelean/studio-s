'use client';

import { useEffect, useState } from 'react';
import { listUsuarios } from '@/lib/api';
import { ApiClientError } from '@/lib/api/client';
import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  StatusBadge,
} from '@/components/ui/feedback';
import { formatDate } from '@/lib/utils';

type Row = {
  id_usuario?: number;
  idUsuario?: number;
  nombres: string;
  apellidos: string;
  email: string;
  estado: string;
  id_rol?: number;
  idRol?: number;
  ultimo_acceso_en?: string | null;
  ultimoAccesoEn?: string | null;
};

export default function UsuariosPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    listUsuarios({ limit: 50 })
      .then((d) => setItems(d.items as unknown as Row[]))
      .catch((e) => setError(e instanceof ApiClientError ? e.message : 'Error'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Usuarios"
        description="Administradores del sistema Studio S."
      />
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && items.length === 0 ? (
        <EmptyState title="No hay usuarios administrativos." />
      ) : null}
      <div className="space-y-2">
        {items.map((u) => (
          <Card key={u.id_usuario ?? u.idUsuario}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-display text-xl text-ink">
                  {u.nombres} {u.apellidos}
                </p>
                <p className="text-sm text-ink-soft">{u.email}</p>
                <p className="text-xs text-ink-soft">
                  Rol {u.id_rol ?? u.idRol} · Último acceso{' '}
                  {formatDate(u.ultimo_acceso_en ?? u.ultimoAccesoEn)}
                </p>
              </div>
              <StatusBadge estado={u.estado} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
