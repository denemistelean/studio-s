import { apiRequest } from './client';

export type CredencialClienta = {
  id_credencial: number;
  id_clienta: number;
  email: string;
  email_verificado_en: string | null;
  ultimo_acceso_en: string | null;
  estado: 'ACTIVA' | 'INACTIVA';
  creado_en: string;
  actualizado_en: string;
};

export async function getCredencialesClienta(idClienta: number) {
  try {
    const data = await apiRequest<{ credencial: CredencialClienta }>(
      `/api/clientas/${idClienta}/credenciales`,
    );
    return data.credencial;
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 404) {
      return null;
    }
    throw err;
  }
}

export function upsertCredencialesClienta(
  idClienta: number,
  body: { email: string; password: string; estado?: 'ACTIVA' | 'INACTIVA' },
) {
  return apiRequest<{ credencial: CredencialClienta }>(
    `/api/clientas/${idClienta}/credenciales`,
    { method: 'PUT', body },
  ).then((d) => d.credencial);
}

export function updateCredencialEstado(idClienta: number, estado: 'ACTIVA' | 'INACTIVA') {
  return apiRequest<{ credencial: CredencialClienta }>(
    `/api/clientas/${idClienta}/credenciales/estado`,
    { method: 'PATCH', body: { estado } },
  ).then((d) => d.credencial);
}

export function updateCredencialPassword(idClienta: number, password: string) {
  return apiRequest<{ credencial: CredencialClienta }>(
    `/api/clientas/${idClienta}/credenciales/password`,
    { method: 'PATCH', body: { password } },
  ).then((d) => d.credencial);
}
