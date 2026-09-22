import { apiRequest, clearStoredToken, setStoredToken } from './client';
import type { AuthUser } from '@/types/api';

export async function login(email: string, password: string) {
  const data = await apiRequest<{
    accessToken: string;
    expiresIn: string;
    user: AuthUser;
  }>('/api/auth/login', {
    method: 'POST',
    body: { email, password },
    token: null,
    skipAuthRedirect: true,
  });
  setStoredToken(data.accessToken);
  return data;
}

export async function me() {
  const data = await apiRequest<{ user: AuthUser }>('/api/auth/me');
  return data.user;
}

export function logout() {
  clearStoredToken();
}
