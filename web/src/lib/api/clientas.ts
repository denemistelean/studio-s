import { apiRequest } from './client';
import type { Clienta, PaginationMeta } from '@/types/api';

export function listClientas(query: Record<string, string | number | undefined> = {}) {
  return apiRequest<{ items: Clienta[]; meta: PaginationMeta }>('/api/clientas', { query });
}

export function getClienta(id: number) {
  return apiRequest<{ clienta: Clienta }>(`/api/clientas/${id}`);
}

export function createClienta(body: {
  nombres: string;
  apellidos: string;
  telefono?: string | null;
  fecha_nacimiento?: string | null;
  estado?: 'ACTIVA' | 'INACTIVA' | 'BLOQUEADA';
}) {
  return apiRequest<{ clienta: Clienta }>('/api/clientas', { method: 'POST', body });
}

export function updateClienta(
  id: number,
  body: Partial<{
    nombres: string;
    apellidos: string;
    telefono: string | null;
    fecha_nacimiento: string | null;
  }>,
) {
  return apiRequest<{ clienta: Clienta }>(`/api/clientas/${id}`, { method: 'PATCH', body });
}

export function updateClientaEstado(id: number, estado: 'ACTIVA' | 'INACTIVA' | 'BLOQUEADA') {
  return apiRequest<{ clienta: Clienta }>(`/api/clientas/${id}/estado`, {
    method: 'PATCH',
    body: { estado },
  });
}
