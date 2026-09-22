'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BrandLogo } from '@/components/brand/logo';
import { LoadingState } from '@/components/ui/feedback';

function ResetPasswordBody() {
  const search = useSearchParams();
  const hasToken = Boolean(search.get('token'));

  return (
    <div className="w-full max-w-md space-y-6 rounded-3xl border border-ink/5 bg-white/80 p-8 shadow-sm">
      <div className="flex justify-center">
        <BrandLogo href="/" size="lg" priority />
      </div>
      <div>
        <h1 className="font-display text-3xl text-ink">Restablecer contraseña</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Este enlace aún no está conectado al backend. La recuperación por email requiere
          aprobación de schema y un proveedor de correo (ver documentación).
        </p>
      </div>
      <div className="rounded-2xl bg-[color-mix(in_srgb,var(--color-brass)_14%,white)] px-4 py-3 text-sm text-ink">
        {hasToken ? (
          <p>
            Recibiste un enlace con token, pero el servicio de restablecimiento todavía no está
            activo. Pedí a recepción que restablezca tu acceso desde la ficha de clienta.
          </p>
        ) : (
          <p>
            No hay un flujo self-service activo. Pedí a recepción que restablezca tu acceso
            desde <strong>Admin → Clientas → Acceso al portal</strong>.
          </p>
        )}
      </div>
      <p className="text-sm text-ink-soft">
        <Link href="/clienta/login" className="font-semibold text-lacquer underline">
          Ir al login
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(165deg,#fffcfa,#f3ebe4)] px-4 py-12">
      <Suspense fallback={<LoadingState />}>
        <ResetPasswordBody />
      </Suspense>
    </main>
  );
}
