import { apiRequest } from './client';
import type {
  Canje,
  DashboardResumen,
  MovimientoPuntos,
  PaginationMeta,
  Recompensa,
  ServicioRealizado,
  UsuarioAdmin,
  Rol,
  AuditoriaItem,
} from '@/types/api';

export function getDashboardResumen() {
  return apiRequest<DashboardResumen>('/api/dashboard/resumen');
}

export function listServiciosRealizados(query: Record<string, string | number | undefined> = {}) {
  return apiRequest<{ items: ServicioRealizado[]; meta: PaginationMeta }>(
    '/api/servicios-realizados',
    { query },
  );
}

export function createServicioRealizado(body: {
  id_clienta: number;
  id_servicio: number;
  cantidad?: number;
  idempotency_key: string;
  observaciones?: string | null;
}) {
  return apiRequest<{ servicio_realizado: ServicioRealizado; duplicated: boolean }>(
    '/api/servicios-realizados',
    { method: 'POST', body },
  );
}

export type AtencionResult = {
  duplicated: boolean;
  servicios_realizados: ServicioRealizado[];
  resumen: {
    cantidad_servicios: number;
    puntos_otorgados: number;
    nuevo_saldo: number | null;
  };
};

/** Atención multi-servicio (transacción + idempotencia). */
export function createAtencion(body: {
  id_clienta: number;
  idempotency_key: string;
  items: Array<{ id_servicio: number; cantidad?: number }>;
  observaciones?: string | null;
}) {
  return apiRequest<AtencionResult>('/api/servicios-realizados/atencion', {
    method: 'POST',
    body,
  });
}

export function anularServicioRealizado(id: number) {
  return apiRequest<{ servicio_realizado: ServicioRealizado }>(
    `/api/servicios-realizados/${id}/anular`,
    { method: 'PATCH' },
  );
}

export function getSaldoClienta(id: number) {
  return apiRequest<{
    id_clienta: number;
    nombres: string;
    apellidos: string;
    estado: string;
    puntos_saldo: number;
  }>(`/api/clientas/${id}/puntos`);
}

export function listMovimientos(query: Record<string, string | number | undefined> = {}) {
  return apiRequest<{ items: MovimientoPuntos[]; meta: PaginationMeta }>('/api/puntos', {
    query,
  });
}

export function listMovimientosClienta(
  id: number,
  query: Record<string, string | number | undefined> = {},
) {
  return apiRequest<{ items: MovimientoPuntos[]; meta: PaginationMeta }>(
    `/api/clientas/${id}/movimientos-puntos`,
    { query },
  );
}

export function ajustarPuntos(body: {
  id_clienta: number;
  tipo: 'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO';
  puntos: number;
  descripcion?: string | null;
}) {
  return apiRequest<{ movimiento: MovimientoPuntos }>('/api/puntos/otorgar', {
    method: 'POST',
    body,
  });
}

export function listRecompensas(query: Record<string, string | number | undefined> = {}) {
  return apiRequest<{ items: Recompensa[]; meta: PaginationMeta }>('/api/recompensas', {
    query,
  });
}

export function createRecompensa(body: {
  nombre: string;
  descripcion?: string | null;
  puntos_requeridos: number;
  stock?: number | null;
  limite_por_clienta?: number | null;
  estado?: 'ACTIVA' | 'INACTIVA';
}) {
  return apiRequest<{ recompensa: Recompensa }>('/api/recompensas', { method: 'POST', body });
}

export function updateRecompensa(
  id: number,
  body: Partial<{
    nombre: string;
    descripcion: string | null;
    puntos_requeridos: number;
    stock: number | null;
    limite_por_clienta: number | null;
  }>,
) {
  return apiRequest<{ recompensa: Recompensa }>(`/api/recompensas/${id}`, {
    method: 'PATCH',
    body,
  });
}

export function updateRecompensaEstado(id: number, estado: 'ACTIVA' | 'INACTIVA') {
  return apiRequest<{ recompensa: Recompensa }>(`/api/recompensas/${id}/estado`, {
    method: 'PATCH',
    body: { estado },
  });
}

export function listCanjes(query: Record<string, string | number | undefined> = {}) {
  return apiRequest<{ items: Canje[]; meta: PaginationMeta }>('/api/canjes', { query });
}

export function createCanje(body: {
  id_clienta: number;
  id_recompensa: number;
  observaciones?: string | null;
}) {
  return apiRequest<{ canje: Canje }>('/api/canjes', { method: 'POST', body });
}

export function entregarCanje(id: number) {
  return apiRequest<{ canje: Canje }>(`/api/canjes/${id}/entregar`, { method: 'PATCH' });
}

export function anularCanje(id: number) {
  return apiRequest<{ canje: Canje }>(`/api/canjes/${id}/anular`, { method: 'PATCH' });
}

export function listUsuarios(query: Record<string, string | number | undefined> = {}) {
  return apiRequest<{ items: UsuarioAdmin[]; meta: PaginationMeta }>('/api/usuarios-admin', {
    query,
  });
}

export function listRoles() {
  return apiRequest<{ roles: Rol[] }>('/api/roles');
}

export function listPermisosCatalogo() {
  return apiRequest<{
    permisos: { id_permiso: number; codigo: string; nombre: string; descripcion: string | null }[];
  }>('/api/permisos');
}

export function listAuditoria(query: Record<string, string | number | undefined> = {}) {
  return apiRequest<{ items: AuditoriaItem[]; meta: PaginationMeta }>('/api/auditoria', {
    query,
  });
}
