import { apiRequest } from './client';
import type { PaginationMeta, Servicio } from '@/types/api';

export function listServicios(query: Record<string, string | number | undefined> = {}) {
  return apiRequest<{ items: Servicio[]; meta: PaginationMeta }>('/api/servicios', { query });
}

export function getServicio(id: number) {
  return apiRequest<{ servicio: Servicio }>(`/api/servicios/${id}`);
}

export function createServicio(body: {
  nombre: string;
  descripcion?: string | null;
  precio: number;
  puntos_otorgados?: number;
  estado?: 'ACTIVO' | 'INACTIVO';
}) {
  return apiRequest<{ servicio: Servicio }>('/api/servicios', { method: 'POST', body });
}

export function updateServicio(
  id: number,
  body: Partial<{
    nombre: string;
    descripcion: string | null;
    precio: number;
    puntos_otorgados: number;
  }>,
) {
  return apiRequest<{ servicio: Servicio }>(`/api/servicios/${id}`, { method: 'PATCH', body });
}

export function updateServicioEstado(id: number, estado: 'ACTIVO' | 'INACTIVO') {
  return apiRequest<{ servicio: Servicio }>(`/api/servicios/${id}/estado`, {
    method: 'PATCH',
    body: { estado },
  });
}
