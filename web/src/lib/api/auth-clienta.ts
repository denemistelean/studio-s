import { apiRequest } from './client';
import {
  clearClientaStoredToken,
  getClientaStoredToken,
  setClientaStoredToken,
} from './clienta-token';
import type { Clienta, PaginationMeta } from '@/types/api';

export type ClientaAuthProfile = {
  clienta: Clienta;
  email: string;
};

export type ClientaLoginResult = {
  accessToken: string;
  expiresAt: string;
  clienta: Clienta;
  email: string;
};

function withClientaToken() {
  return getClientaStoredToken();
}

export async function registroClienta(body: {
  nombres: string;
  apellidos: string;
  telefono?: string | null;
  fecha_nacimiento?: string | null;
  email: string;
  password: string;
}) {
  return apiRequest<{ clienta: Clienta; email: string }>('/api/auth/clienta/registro', {
    method: 'POST',
    body,
    token: null,
    skipAuthRedirect: true,
  });
}

export async function loginClienta(email: string, password: string) {
  const data = await apiRequest<ClientaLoginResult>('/api/auth/clienta/login', {
    method: 'POST',
    body: { email, password },
    token: null,
    skipAuthRedirect: true,
  });
  setClientaStoredToken(data.accessToken);
  return data;
}

export async function meClienta() {
  return apiRequest<ClientaAuthProfile>('/api/auth/clienta/me', {
    token: withClientaToken(),
  });
}

export async function logoutClienta() {
  const token = withClientaToken();
  if (token) {
    try {
      await apiRequest('/api/auth/clienta/logout', {
        method: 'POST',
        body: {},
        token,
      });
    } catch {
      // Si la sesión ya expiró, igual limpiamos localmente.
    }
  }
  clearClientaStoredToken();
}

export async function logoutTodasClienta() {
  const token = withClientaToken();
  if (token) {
    await apiRequest('/api/auth/clienta/logout-todas', {
      method: 'POST',
      body: {},
      token,
    });
  }
  clearClientaStoredToken();
}

export async function listMisMovimientos(query: Record<string, string | number | undefined> = {}) {
  return apiRequest<{
    items: Array<{
      id_movimiento: number;
      tipo: string;
      puntos: number;
      saldo_anterior: number;
      saldo_posterior: number;
      descripcion: string | null;
      creado_en: string;
    }>;
    meta: PaginationMeta;
  }>('/api/clienta/movimientos-puntos', {
    query,
    token: withClientaToken(),
  });
}

export async function listMisServiciosRealizados(
  query: Record<string, string | number | undefined> = {},
) {
  return apiRequest<{
    items: Array<{
      id_servicio_realizado: number;
      id_servicio: number;
      servicio_nombre: string;
      cantidad: number;
      precio_unitario: string;
      puntos_otorgados: number;
      estado: string;
      realizado_en: string;
    }>;
    meta: PaginationMeta;
  }>('/api/clienta/servicios-realizados', {
    query,
    token: withClientaToken(),
  });
}

export async function listRecompensasPortal(
  query: Record<string, string | number | undefined> = {},
) {
  return apiRequest<{
    items: Array<{
      id_recompensa: number;
      nombre: string;
      descripcion: string | null;
      puntos_requeridos: number;
      stock: number | null;
      limite_por_clienta: number | null;
      estado: string;
    }>;
    meta: PaginationMeta;
  }>('/api/clienta/recompensas', {
    query,
    token: withClientaToken(),
  });
}

export async function listMisCanjes(query: Record<string, string | number | undefined> = {}) {
  return apiRequest<{
    items: Array<{
      id_canje: number;
      codigo_canje: string;
      recompensa_nombre: string;
      puntos_utilizados: number;
      estado: string;
      solicitado_en: string;
      entregado_en: string | null;
    }>;
    meta: PaginationMeta;
  }>('/api/clienta/canjes', {
    query,
    token: withClientaToken(),
  });
}

export async function ensureMiQr() {
  return apiRequest<{
    qr: {
      id_qr: number;
      id_clienta: number;
      activo: boolean;
      expira_en: string | null;
      creado_en: string;
    };
    qr_payload: string;
  }>('/api/clienta/qr', {
    method: 'POST',
    body: {},
    token: withClientaToken(),
  });
}
