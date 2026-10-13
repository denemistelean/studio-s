'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Instagram, MapPin, Menu, MessageCircle, X } from 'lucide-react';
import { BrandLogo } from '@/components/brand/logo';
import { QrCodeImage } from '@/components/qr/qr-code-image';
import { Button } from '@/components/ui/button';

const WHATSAPP_NUMBER = '51956246255';
const WHATSAPP_LABEL = '+51 956 246 255';
const MAPS_REVIEW_URL = 'https://maps.app.goo.gl/dBL3kYQYJFXpesmZ8';
const ADDRESS = 'Calle Obispo, Martínez de Compañón 946, Víctor Larco Herrera 13008';
const INSTAGRAM = 'studios_pe';

const nav = [
  { href: '#propuesta', label: 'Experiencia' },
  { href: '#portafolio', label: 'Portafolio' },
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
      href={`https://wa.me/${WHATSAPP_NUMBER}`}
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
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-14 md:grid-cols-[1.15fr_1fr_auto] md:px-6">
        <a
          href={MAPS_REVIEW_URL}
          target="_blank"
          rel="noreferrer"
          className="group relative block overflow-hidden rounded-[1.4rem] ring-1 ring-porcelain/15"
          aria-label="Abrir Studio S en Google Maps"
        >
          <img
            src="/maps/studio-s.jpg"
            alt="Mapa de Studio S en Víctor Larco Herrera"
            className="h-56 w-full object-cover transition duration-500 group-hover:scale-105 md:h-64"
          />
          <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full text-lacquer drop-shadow">
            <MapPin size={36} fill="currentColor" />
          </span>
          <span className="absolute bottom-3 left-3 rounded-full bg-porcelain px-3 py-1 text-xs font-semibold text-ink">
            Ver en Google Maps
          </span>
        </a>

        <div>
          <BrandLogo href="/" size="md" />
          <p className="mt-4 font-display text-2xl text-porcelain">Studio S</p>
          <div className="mt-4 space-y-3 text-sm text-porcelain/80">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 hover:text-porcelain"
            >
              <MessageCircle size={16} className="text-brass" />
              WhatsApp: {WHATSAPP_LABEL}
            </a>
            <p className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0 text-brass" />
              <span>{ADDRESS}</span>
            </p>
            <a
              href={`https://www.instagram.com/${INSTAGRAM}/`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 hover:text-porcelain"
            >
              <Instagram size={16} className="text-brass" />
              @{INSTAGRAM}
            </a>
          </div>
        </div>

        <div className="flex flex-col items-center text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brass">
            Reseña en Google
          </p>
          <a
            href={MAPS_REVIEW_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-3 rounded-[1.2rem] bg-porcelain p-3"
            aria-label="Abrir la reseña de Studio S en Google Maps"
          >
            <QrCodeImage
              payload={MAPS_REVIEW_URL}
              size={148}
              alt="Código QR de la reseña de Studio S en Google Maps"
            />
          </a>
          <p className="mt-2 max-w-[10rem] text-xs text-porcelain/60">Escaneá para dejar tu reseña</p>
        </div>
      </div>
      <div className="border-t border-porcelain/10 py-4 text-center text-xs text-porcelain/50">
        © {new Date().getFullYear()} Studio S. Todos los derechos reservados.
      </div>
    </footer>
  );
}
