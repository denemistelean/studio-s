const CLIENTA_TOKEN_KEY = 'studios_clienta_token';

export function getClientaStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(CLIENTA_TOKEN_KEY);
}

export function setClientaStoredToken(token: string) {
  sessionStorage.setItem(CLIENTA_TOKEN_KEY, token);
}

export function clearClientaStoredToken() {
  sessionStorage.removeItem(CLIENTA_TOKEN_KEY);
}
