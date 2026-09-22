'use client';

import Link from 'next/link';
import { BrandLogo } from '@/components/brand/logo';

/**
 * Recuperación self-service pendiente (sin tabla de tokens ni SMTP).
 * No simula envío de correo.
 */
export default function OlvidePasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(165deg,#fffcfa,#f3ebe4)] px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-ink/5 bg-white/80 p-8 shadow-sm">
        <div className="flex justify-center">
          <BrandLogo href="/" size="lg" priority />
        </div>
        <div>
          <h1 className="font-display text-3xl text-ink">Recuperar acceso</h1>
          <p className="mt-2 text-sm text-ink-soft">
            El restablecimiento automático por correo todavía no está disponible en Studio S.
          </p>
        </div>
        <div className="rounded-2xl bg-[color-mix(in_srgb,var(--color-brass)_14%,white)] px-4 py-3 text-sm text-ink">
          <p className="font-semibold">Cómo recuperar tu cuenta ahora</p>
          <p className="mt-2 text-ink-soft">
            Contactá a recepción del salón y pedí que restablezcan tu contraseña desde tu ficha
            (Acceso al portal).
          </p>
        </div>
        <p className="text-sm text-ink-soft">
          <Link href="/clienta/login" className="font-semibold text-lacquer underline">
            Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
