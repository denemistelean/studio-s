import { apiRequest } from './client';

export type QrValidateResult = {
  qr: {
    id_qr: number;
    id_clienta: number;
    activo: boolean;
    expira_en: string | null;
    ultimo_uso_en: string | null;
    creado_en: string;
    revocado_en: string | null;
  };
  clienta: {
    id_clienta: number;
    public_id: string;
    nombres: string;
    apellidos: string;
    telefono: string | null;
    estado: string;
    puntos_saldo: number;
  };
};

export function validateQr(tokenOrPayload: string) {
  return apiRequest<QrValidateResult>('/api/qr-clientas/validar', {
    method: 'POST',
    body: { token: tokenOrPayload },
  });
}

export function generateQrAdmin(body: {
  id_clienta: number;
  revocar_anteriores?: boolean;
  expira_en?: string | null;
}) {
  return apiRequest<{
    qr: QrValidateResult['qr'];
    token: string;
    qr_payload: string;
  }>('/api/qr-clientas', {
    method: 'POST',
    body,
  });
}
