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
import { login as apiLogin, logout as apiLogout, me } from '@/lib/api/auth';
import { getStoredToken } from '@/lib/api/client';
import { listRoles } from '@/lib/api';
import type { AuthUser } from '@/types/api';

type AuthState = {
  user: AuthUser | null;
  permisos: string[];
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [permisos, setPermisos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPermisos = useCallback(async (u: AuthUser) => {
    try {
      const data = await listRoles();
      const rol = data.roles.find((r) => r.id_rol === u.id_rol);
      setPermisos(rol?.permisos?.map((p) => p.codigo) ?? []);
    } catch {
      // Sin ROLES_GESTIONAR o bootstrap: lista vacía = acceso amplio (como el backend)
      setPermisos([]);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!getStoredToken()) {
      setUser(null);
      setPermisos([]);
      setLoading(false);
      return;
    }
    try {
      const u = await me();
      setUser(u);
      await loadPermisos(u);
    } catch {
      apiLogout();
      setUser(null);
      setPermisos([]);
    } finally {
      setLoading(false);
    }
  }, [loadPermisos]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await apiLogin(email, password);
      setUser(data.user);
      await loadPermisos(data.user);
    },
    [loadPermisos],
  );

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
    setPermisos([]);
  }, []);

  const value = useMemo(
    () => ({ user, permisos, loading, login, logout, refresh }),
    [user, permisos, loading, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
