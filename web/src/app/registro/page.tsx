'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrandLogo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiClientError } from '@/lib/api/client';
import { registroClienta } from '@/lib/api/auth-clienta';

export default function RegistroPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nombres: '',
    apellidos: '',
    telefono: '',
    fecha_nacimiento: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await registroClienta({
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        telefono: form.telefono.trim() || null,
        fecha_nacimiento: form.fecha_nacimiento || null,
        email: form.email.trim(),
        password: form.password,
      });
      router.replace('/clienta/login?registrada=1');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo registrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-porcelain px-4 py-12">
      <div className="w-full max-w-lg rounded-[1.8rem] bg-form p-8 shadow-[var(--shadow-soft)]">
        <div className="mb-6 flex justify-center">
          <BrandLogo href="/" size="lg" priority />
        </div>
        <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-brass">
          Únete a Studio S
        </p>
        <h1 className="mt-3 text-center font-display text-4xl text-ink">Tu tarjeta digital</h1>
        <p className="mt-3 text-center text-sm leading-relaxed text-ink-soft">
          Creá tu cuenta para ver puntos, historial y recompensas.
        </p>

        <form className="mt-8 grid gap-3" onSubmit={onSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Nombres"
              required
              value={form.nombres}
              onChange={(e) => setForm({ ...form, nombres: e.target.value })}
            />
            <Input
              label="Apellidos"
              required
              value={form.apellidos}
              onChange={(e) => setForm({ ...form, apellidos: e.target.value })}
            />
          </div>
          <Input
            label="Teléfono"
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
          />
          <Input
            label="Fecha de nacimiento"
            type="date"
            value={form.fecha_nacimiento}
            onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })}
          />
          <Input
            label="Correo electrónico"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Contraseña"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Mínimo 8 caracteres"
          />
          {error ? (
            <p className="rounded-xl bg-[color-mix(in_srgb,var(--color-lacquer)_10%,white)] px-3 py-2 text-sm text-lacquer-dark">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" loading={loading}>
            Crear mi cuenta
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-soft">
          ¿Ya tenés cuenta?{' '}
          <Link href="/clienta/login" className="font-semibold text-lacquer">
            Ingresar
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-ink-soft/70">
          Acceso del salón:{' '}
          <Link href="/login" className="underline">
            panel administrativo
          </Link>
        </p>
      </div>
    </div>
  );
}
