'use client';

import { useEffect, useState } from 'react';
import { listPermisosCatalogo, listRoles } from '@/lib/api';
import { ApiClientError } from '@/lib/api/client';
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  StatusBadge,
} from '@/components/ui/feedback';
import type { Rol } from '@/types/api';

export default function RolesPage() {
  const [roles, setRoles] = useState<Rol[]>([]);
  const [permisos, setPermisos] = useState<{ codigo: string; nombre: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([listRoles(), listPermisosCatalogo()])
      .then(([r, p]) => {
        setRoles(r.roles);
        setPermisos(p.permisos);
      })
      .catch((e) => setError(e instanceof ApiClientError ? e.message : 'Error'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-up space-y-8">
      <PageHeader
        title="Roles"
        description="Roles y catálogo de los 14 permisos reales de MariaDB."
      />
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && roles.length === 0 ? (
        <EmptyState title="No hay roles para mostrar." />
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        {roles.map((rol) => (
          <Card key={rol.id_rol}>
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-2xl">{rol.nombre}</h3>
              <StatusBadge estado={rol.estado} />
            </div>
            <p className="mt-2 text-sm text-ink-soft">{rol.descripcion || '—'}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(rol.permisos || []).map((p) => (
                <Badge key={p.codigo} tone="lacquer">
                  {p.codigo}
                </Badge>
              ))}
              {(rol.permisos || []).length === 0 ? (
                <span className="text-xs text-ink-soft">Sin permisos asignados (bootstrap)</span>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
      <section>
        <h2 className="font-display text-2xl">Catálogo de permisos</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {permisos.map((p) => (
            <Badge key={p.codigo} tone="brass">
              {p.codigo}
            </Badge>
          ))}
        </div>
      </section>
    </div>
  );
}
