'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Sparkles,
  ClipboardList,
  Coins,
  Gift,
  Ticket,
  Shield,
  KeyRound,
  ScrollText,
  Menu,
  LogOut,
  X,
  ScanLine,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand/logo';
import { useAuth } from '@/lib/auth/auth-context';
import { canAccess, PERMISOS } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { LoadingState } from '@/components/ui/feedback';

const menu = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, perm: PERMISOS.DASHBOARD_VER },
  { href: '/admin/clientas', label: 'Clientas', icon: Users, perm: PERMISOS.CLIENTAS_VER },
  {
    href: '/admin/qr',
    label: 'Escanear QR',
    icon: ScanLine,
    perm: [PERMISOS.CLIENTAS_VER, PERMISOS.SERVICIOS_REGISTRAR],
  },
  { href: '/admin/servicios', label: 'Servicios', icon: Sparkles, perm: PERMISOS.SERVICIOS_VER },
  {
    href: '/admin/servicios-realizados',
    label: 'Servicios realizados',
    icon: ClipboardList,
    perm: [PERMISOS.SERVICIOS_VER, PERMISOS.SERVICIOS_REGISTRAR],
  },
  { href: '/admin/puntos', label: 'Puntos', icon: Coins, perm: PERMISOS.CLIENTAS_VER },
  { href: '/admin/recompensas', label: 'Recompensas', icon: Gift, perm: PERMISOS.RECOMPENSAS_VER },
  {
    href: '/admin/canjes',
    label: 'Canjes',
    icon: Ticket,
    perm: [PERMISOS.CLIENTAS_VER, PERMISOS.CANJES_REGISTRAR],
  },
  { href: '/admin/usuarios', label: 'Usuarios', icon: Shield, perm: PERMISOS.USUARIOS_GESTIONAR },
  { href: '/admin/roles', label: 'Roles', icon: KeyRound, perm: PERMISOS.ROLES_GESTIONAR },
  { href: '/admin/auditoria', label: 'Auditoría', icon: ScrollText, perm: PERMISOS.AUDITORIA_VER },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, permisos, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-porcelain">
        <LoadingState label="Preparando Studio S…" />
      </div>
    );
  }

  const items = menu.filter((item) => canAccess(permisos, item.perm));

  const Nav = (
    <div className="flex h-full flex-col">
      <div className="border-b border-porcelain/10 px-5 py-6">
        <BrandLogo href="/admin/dashboard" size="md" />
        <p className="mt-3 font-display text-xl text-porcelain">
          Studio <span className="text-brass">S</span>
        </p>
        <p className="mt-1 text-xs text-porcelain/50">Panel administrativo</p>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const Icon = item.icon;
          // Exacto o subruta (`/clientas/5`), sin confundir `/servicios` con `/servicios-realizados`.
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setDrawer(false)}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition',
                active
                  ? 'bg-lacquer text-porcelain'
                  : 'text-porcelain/75 hover:bg-porcelain/5 hover:text-porcelain',
              )}
            >
              <Icon size={16} className={active ? 'text-porcelain' : 'text-brass'} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-porcelain/10 p-4">
        <p className="truncate text-sm text-porcelain">
          {user.nombres} {user.apellidos}
        </p>
        <p className="truncate text-xs text-porcelain/50">{user.email}</p>
        <button
          type="button"
          onClick={() => {
            logout();
            router.replace('/login');
          }}
          className="mt-3 inline-flex items-center gap-2 text-xs text-porcelain/60 hover:text-lacquer"
        >
          <LogOut size={14} /> Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-porcelain md:grid md:grid-cols-[260px_1fr]">
      <aside className="hidden bg-ink md:block">{Nav}</aside>
      {drawer ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            className="absolute inset-0 bg-ink/50"
            aria-label="Cerrar"
            onClick={() => setDrawer(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[280px] bg-ink shadow-xl">{Nav}</aside>
        </div>
      ) : null}
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink/5 bg-porcelain/90 px-4 py-3 backdrop-blur md:px-8">
          <button
            type="button"
            className="rounded-xl p-2 text-ink md:hidden"
            aria-label="Abrir menú"
            onClick={() => setDrawer(true)}
          >
            {drawer ? <X size={18} /> : <Menu size={18} />}
          </button>
          <p className="text-sm text-ink-soft">
            Hola, <span className="font-semibold text-ink">{user.nombres}</span>
          </p>
          <Link href="/mi-tarjeta" className="text-xs font-semibold text-lacquer">
            Vista tarjeta
          </Link>
        </header>
        <main className="px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
