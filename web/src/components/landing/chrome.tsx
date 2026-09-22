'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, MessageCircle } from 'lucide-react';
import { BrandLogo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';

const nav = [
  { href: '#propuesta', label: 'Experiencia' },
  { href: '#galeria', label: 'Galería' },
  { href: '#servicios', label: 'Servicios' },
  { href: '#fidelizacion', label: 'Puntos' },
  { href: '#contacto', label: 'Contacto' },
];

export function LandingNavbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-ink/5 bg-porcelain/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
        <BrandLogo size="sm" showWordmark />
        <nav className="hidden items-center gap-7 md:flex">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-ink-soft transition hover:text-lacquer"
            >
              {item.label}
            </a>
          ))}
          <Link href="/clienta/login">
            <Button size="sm">Mi tarjeta</Button>
          </Link>
          <Link href="/login">
            <Button size="sm" variant="ghost">
              Admin
            </Button>
          </Link>
        </nav>
        <button
          className="rounded-xl p-2 text-ink md:hidden"
          aria-label="Menú"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open ? (
        <div className="border-t border-ink/5 bg-porcelain px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm text-ink-soft"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <Link href="/clienta/login" onClick={() => setOpen(false)}>
              <Button className="w-full">Mi tarjeta</Button>
            </Link>
            <Link href="/login" onClick={() => setOpen(false)}>
              <Button className="w-full" variant="ghost">
                Admin
              </Button>
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}

export function WhatsAppFloat() {
  return (
    <a
      href="https://wa.me/51999999999"
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-lacquer text-porcelain shadow-[0_12px_30px_rgba(168,40,59,0.35)] transition hover:bg-lacquer-dark"
      aria-label="WhatsApp"
    >
      <MessageCircle size={22} />
    </a>
  );
}

export function LandingFooter() {
  return (
    <footer className="bg-ink text-porcelain">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-3 md:px-6">
        <div>
          <BrandLogo href="/" size="md" />
          <p className="mt-4 font-display text-2xl text-porcelain">Studio S</p>
          <p className="mt-3 max-w-xs text-sm text-porcelain/70">
            Salón de uñas premium. Belleza editorial, cuidado impecable y un programa de
            fidelización hecho para vos.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brass">
            Navegación
          </p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-porcelain/75">
            <a href="#servicios">Servicios</a>
            <a href="#fidelizacion">Puntos</a>
            <Link href="/clienta/login">Ingresar</Link>
            <Link href="/registro">Únete</Link>
            <Link href="/login">Admin</Link>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brass">
            Contacto
          </p>
          <p className="mt-3 text-sm text-porcelain/75">Trujillo, Perú</p>
          <p className="text-sm text-porcelain/75">hola@studiosalon.pe</p>
        </div>
      </div>
      <div className="border-t border-porcelain/10 py-4 text-center text-xs text-porcelain/50">
        © {new Date().getFullYear()} Studio S. Todos los derechos reservados.
      </div>
    </footer>
  );
}
