'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrandLogo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth/auth-context';
import { ApiClientError } from '@/lib/api/client';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      void remember;
      router.replace('/admin/dashboard');
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'No se pudo iniciar sesión',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-porcelain md:grid md:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-ink md:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(176,141,87,0.28),transparent_40%),radial-gradient(circle_at_70%_80%,rgba(168,40,59,0.35),transparent_45%)]" />
        <div className="relative flex h-full flex-col justify-between p-10 text-porcelain">
          <BrandLogo href="/" size="lg" priority />
          <div>
            <h1 className="font-display text-5xl leading-tight">
              Tu belleza.
              <br />
              Tus puntos.
              <br />
              Tus recompensas.
            </h1>
            <p className="mt-4 max-w-sm text-sm text-porcelain/70">
              Acceso al sistema Studio S. Panel administrativo de fidelización.
            </p>
          </div>
          <p className="text-xs text-porcelain/40">Salón de uñas premium · Trujillo</p>
        </div>
      </aside>

      <main className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-[1.8rem] bg-form p-7 shadow-[var(--shadow-soft)] md:p-9">
          <div className="mb-6 flex justify-center md:hidden">
            <BrandLogo href="/" size="md" priority />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brass">
            Bienvenida
          </p>
          <h2 className="mt-2 font-display text-3xl text-ink">Ingresar</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Usá tu correo administrativo para continuar.
          </p>

          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            <Input
              label="Correo electrónico"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
            />
            <Input
              label="Contraseña"
              type="password"
              autoComplete="current-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-ink-soft">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="accent-lacquer"
                />
                Recordarme
              </label>
              <span className="text-ink-soft/70">¿Olvidaste tu contraseña?</span>
            </div>
            {error ? (
              <p className="rounded-xl bg-[color-mix(in_srgb,var(--color-lacquer)_10%,white)] px-3 py-2 text-sm text-lacquer-dark">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" loading={loading}>
              INGRESAR
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-soft">
            ¿Primera vez?{' '}
            <Link href="/registro" className="font-semibold text-lacquer">
              Crear mi cuenta
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
