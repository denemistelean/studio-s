'use client';

import Link from 'next/link';
import { FormEvent, Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BrandLogo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingState } from '@/components/ui/feedback';
import { ApiClientError } from '@/lib/api/client';
import { useClientaAuth } from '@/lib/auth/clienta-auth-context';

export default function ClientaLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-porcelain">
          <LoadingState label="Cargando…" />
        </div>
      }
    >
      <ClientaLoginForm />
    </Suspense>
  );
}

function ClientaLoginForm() {
  const { login } = useClientaAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const registrada = useMemo(() => searchParams.get('registrada') === '1', [searchParams]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/mi-tarjeta');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-porcelain px-4 py-12">
      <div className="w-full max-w-md rounded-[1.8rem] bg-form p-8 shadow-[var(--shadow-soft)]">
        <div className="mb-6 flex justify-center">
          <BrandLogo href="/" size="lg" priority />
        </div>
        <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-brass">
          Portal clienta
        </p>
        <h1 className="mt-2 text-center font-display text-3xl text-ink">Ingresar</h1>
        <p className="mt-2 text-center text-sm text-ink-soft">
          Accedé a tu tarjeta digital y tus puntos.
        </p>

        {registrada ? (
          <p className="mt-4 rounded-xl bg-[color-mix(in_srgb,var(--color-brass)_18%,white)] px-3 py-2 text-sm text-ink">
            Cuenta creada. Iniciá sesión con tu correo y contraseña.
          </p>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <Input
            label="Correo electrónico"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Contraseña"
            type="password"
            required
            minLength={8}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error ? (
            <p className="rounded-xl bg-[color-mix(in_srgb,var(--color-lacquer)_10%,white)] px-3 py-2 text-sm text-lacquer-dark">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" loading={loading}>
            Ingresar
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-ink-soft">
          <Link href="/clienta/olvide-password" className="font-semibold text-lacquer">
            ¿Olvidaste tu contraseña?
          </Link>
        </p>

        <p className="mt-6 text-center text-sm text-ink-soft">
          ¿Primera vez?{' '}
          <Link href="/registro" className="font-semibold text-lacquer">
            Crear mi cuenta
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-ink-soft/70">
          Personal del salón:{' '}
          <Link href="/login" className="underline">
            acceso admin
          </Link>
        </p>
      </div>
    </div>
  );
}
