import Link from 'next/link';
import { BrandLogo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { LandingFooter, LandingNavbar, WhatsAppFloat } from '@/components/landing/chrome';

const servicios = [
  { nombre: 'Manicure clásica', pts: 10, desc: 'Cuidado esencial con acabado impecable.' },
  { nombre: 'Soft gel', pts: 25, desc: 'Brillo duradero y silueta limpia.' },
  { nombre: 'Nail art editorial', pts: 40, desc: 'Diseños con carácter boutique.' },
];

const recompensas = [
  { nombre: 'Esmalte cortesía', pts: 100 },
  { nombre: 'Upgrade soft gel', pts: 180 },
  { nombre: 'Sesión beauty', pts: 300 },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-porcelain text-ink">
      <LandingNavbar />
      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(216,180,160,0.35),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(168,40,59,0.12),transparent_40%)]" />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:items-center md:px-6 md:py-24">
            <div className="animate-fade-up">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brass">
                Salón de uñas premium
              </p>
              <h1 className="mt-4 font-display text-5xl leading-[1.05] text-ink md:text-6xl">
                Tu belleza.
                <br />
                Tus puntos.
                <br />
                <span className="text-lacquer">Tus recompensas.</span>
              </h1>
              <p className="mt-5 max-w-md text-base leading-relaxed text-ink-soft">
                Studio S combina estética editorial con un programa de fidelización elegante:
                cada visita suma, cada detalle importa.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/registro">
                  <Button size="lg">Únete a Studio S</Button>
                </Link>
                <Link href="/clienta/login">
                  <Button size="lg" variant="secondary">
                    Ya tengo mi tarjeta
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative flex min-h-[360px] items-center justify-center overflow-hidden rounded-[2rem] bg-ink shadow-[var(--shadow-soft)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(176,141,87,0.28),transparent_55%),radial-gradient(circle_at_80%_80%,rgba(168,40,59,0.22),transparent_45%)]" />
              <div className="relative animate-fade-up">
                <BrandLogo href={null} size="xl" priority />
              </div>
              <div className="absolute bottom-6 left-6 right-6 rounded-[1.4rem] bg-porcelain/95 p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.16em] text-brass">Fidelización</p>
                <p className="mt-2 font-display text-2xl text-ink">Tarjeta digital Studio S</p>
                <p className="mt-1 text-sm text-ink-soft">
                  Acumulá puntos y canjeá recompensas premium.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="propuesta" className="mx-auto max-w-6xl px-4 py-16 md:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brass">
            Propuesta de valor
          </p>
          <h2 className="mt-3 max-w-xl font-display text-4xl text-ink">
            Una experiencia boutique, no una rutina de salón.
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              ['Cuidado impecable', 'Protocolos precisos y acabados limpios.'],
              ['Estética editorial', 'Diseños con identidad y proporción.'],
              ['Puntos con sentido', 'Cada servicio suma hacia recompensas reales.'],
            ].map(([t, d]) => (
              <div key={t} className="rounded-[1.5rem] bg-surface p-6 shadow-[var(--shadow-soft)]">
                <h3 className="font-display text-2xl text-ink">{t}</h3>
                <p className="mt-2 text-sm text-ink-soft">{d}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="galeria" className="bg-clay/35 py-16">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <h2 className="font-display text-4xl text-ink">Galería de trabajos</h2>
            <p className="mt-2 text-ink-soft">Selección editorial de manicures y nail art.</p>
            <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[4/5] rounded-[1.2rem] bg-[linear-gradient(145deg,#d8b4a0,#f7f1ec_55%,#a8283b33)]"
                />
              ))}
            </div>
          </div>
        </section>

        <section id="servicios" className="mx-auto max-w-6xl px-4 py-16 md:px-6">
          <h2 className="font-display text-4xl text-ink">Servicios</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {servicios.map((s) => (
              <article
                key={s.nombre}
                className="rounded-[1.5rem] bg-surface p-6 ring-1 ring-ink/5"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-2xl">{s.nombre}</h3>
                  <span className="rounded-full bg-[color-mix(in_srgb,var(--color-lacquer)_12%,white)] px-2.5 py-1 text-xs font-semibold text-lacquer">
                    +{s.pts} pts
                  </span>
                </div>
                <p className="mt-3 text-sm text-ink-soft">{s.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="fidelizacion" className="bg-ink py-16 text-porcelain">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brass">
              Programa de fidelización
            </p>
            <h2 className="mt-3 font-display text-4xl">Cómo funcionan tus puntos</h2>
            <ol className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                'Visita el salón y disfrutá tu servicio.',
                'Acumulás puntos automáticamente.',
                'Canjeás recompensas cuando quieras.',
              ].map((step, i) => (
                <li key={step} className="rounded-[1.4rem] bg-porcelain/5 p-5 ring-1 ring-porcelain/10">
                  <span className="font-display text-3xl text-lacquer">{i + 1}</span>
                  <p className="mt-3 text-sm text-porcelain/80">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="recompensas" className="mx-auto max-w-6xl px-4 py-16 md:px-6">
          <h2 className="font-display text-4xl text-ink">Recompensas</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {recompensas.map((r) => (
              <div
                key={r.nombre}
                className="rounded-[1.5rem] border border-brass/30 bg-[linear-gradient(180deg,#fffcfa,#f7f1ec)] p-6"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brass">
                  {r.pts} pts
                </p>
                <h3 className="mt-2 font-display text-2xl text-ink">{r.nombre}</h3>
              </div>
            ))}
          </div>
          <div className="mt-10 rounded-[1.8rem] bg-form px-6 py-10 text-center md:px-10">
            <h3 className="font-display text-3xl text-ink">Empezá a sumar hoy</h3>
            <p className="mx-auto mt-2 max-w-lg text-sm text-ink-soft">
              Creá tu cuenta o ingresá con tu tarjeta digital Studio S.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/registro">
                <Button>Únete a Studio S</Button>
              </Link>
              <Link href="/clienta/login">
                <Button variant="ghost">Ya tengo mi tarjeta</Button>
              </Link>
            </div>
          </div>
        </section>

        <section id="contacto" className="border-t border-ink/5 py-14">
          <div className="mx-auto max-w-6xl px-4 text-center md:px-6">
            <h2 className="font-display text-3xl text-ink">Reservá tu momento</h2>
            <p className="mt-2 text-ink-soft">Escribinos por WhatsApp o visitanos en el salón.</p>
          </div>
        </section>
      </main>
      <LandingFooter />
      <WhatsAppFloat />
    </div>
  );
}
