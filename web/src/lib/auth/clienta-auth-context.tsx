'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  loginClienta as apiLogin,
  logoutClienta as apiLogout,
  meClienta,
  type ClientaAuthProfile,
} from '@/lib/api/auth-clienta';
import { getClientaStoredToken } from '@/lib/api/clienta-token';
import type { Clienta } from '@/types/api';

type ClientaAuthState = {
  clienta: Clienta | null;
  email: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const ClientaAuthContext = createContext<ClientaAuthState | null>(null);

export function ClientaAuthProvider({ children }: { children: ReactNode }) {
  const [clienta, setClienta] = useState<Clienta | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const applyProfile = useCallback((profile: ClientaAuthProfile) => {
    setClienta(profile.clienta);
    setEmail(profile.email);
  }, []);

  const refresh = useCallback(async () => {
    if (!getClientaStoredToken()) {
      setClienta(null);
      setEmail(null);
      setLoading(false);
      return;
    }
    try {
      const profile = await meClienta();
      applyProfile(profile);
    } catch {
      await apiLogout();
      setClienta(null);
      setEmail(null);
    } finally {
      setLoading(false);
    }
  }, [applyProfile]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(
    async (mail: string, password: string) => {
      const data = await apiLogin(mail, password);
      setClienta(data.clienta);
      setEmail(data.email);
    },
    [],
  );

  const logout = useCallback(async () => {
    await apiLogout();
    setClienta(null);
    setEmail(null);
  }, []);

  const value = useMemo(
    () => ({ clienta, email, loading, login, logout, refresh }),
    [clienta, email, loading, login, logout, refresh],
  );

  return (
    <ClientaAuthContext.Provider value={value}>{children}</ClientaAuthContext.Provider>
  );
}

export function useClientaAuth() {
  const ctx = useContext(ClientaAuthContext);
  if (!ctx) throw new Error('useClientaAuth debe usarse dentro de ClientaAuthProvider');
  return ctx;
}
