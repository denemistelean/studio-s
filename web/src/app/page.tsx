import fs from 'node:fs';
import path from 'node:path';
import Link from 'next/link';
import { BrandLogo } from '@/components/brand/logo';
import { Portafolio, type PortafolioCategoria } from '@/components/landing/portafolio';
import { Button } from '@/components/ui/button';
import { LandingFooter, LandingNavbar, WhatsAppFloat } from '@/components/landing/chrome';

const categoriasServicios: {
  nombre: string;
  items: { nombre: string; desc?: string }[];
}[] = [
  {
    nombre: 'Manicure',
    items: [
      { nombre: 'Manicure Tradicional', desc: 'Belleza natural, clásica y fresca.' },
      { nombre: 'Manicure Color Gel', desc: 'Brillo espectacular y mayor duración.' },
      {
        nombre: 'Manicure Rubber',
        desc: 'Flexibilidad, refuerzo y protección para tus uñas naturales.',
      },
      {
        nombre: 'Manicure Builder Gel',
        desc: 'Mayor resistencia, estructura y uñas con acabado impecable.',
      },
      {
        nombre: 'Manicure Acrílico',
        desc: 'Uñas resistentes, longitud personalizada y diseños impactantes.',
      },
      {
        nombre: 'Manicure Polygel',
        desc: 'Ligereza, resistencia y uñas hermosas con forma perfecta.',
      },
    ],
  },
  {
    nombre: 'Sistemas de alargamiento con tip',
    items: [
      { nombre: 'Soft Gel' },
      { nombre: 'Builder Gel' },
      { nombre: 'Acrílico' },
      { nombre: 'Polygel' },
    ],
  },
  {
    nombre: 'Sistemas de alargamiento esculpidas',
    items: [
      { nombre: 'Acrílico' },
      { nombre: 'Polygel' },
    ],
  },
  {
    nombre: 'Pedicure',
    items: [
      { nombre: 'Limpieza' },
      { nombre: 'Pedicure Tradicional' },
      { nombre: 'Pedicure Color Gel' },
    ],
  },
  {
    nombre: 'Retiro',
    items: [
      { nombre: 'Gel' },
      { nombre: 'Rubber' },
      { nombre: 'Soft Gel / Builder Gel' },
      { nombre: 'Acrílico / Polygel' },
    ],
  },
];

const portafolioBase: Omit<PortafolioCategoria, 'fotos'>[] = [
  {
    id: 'tendencias-inn',
    nombre: 'Tendencias Inn',
    fondo: 'bg-[linear-gradient(160deg,#e7d3c8,#f7f1ec_55%,#d8b4a0)]',
  },
  {
    id: 'top-5',
    nombre: 'Top 5',
    fondo: 'bg-[linear-gradient(160deg,#f3e6df,#fff8f4_50%,#c4a484)]',
  },
  {
    id: 'disenos-complejos',
    nombre: 'Diseños Complejos',
    fondo: 'bg-[linear-gradient(160deg,#ead7d4,#f7f1ec_45%,#a8283b33)]',
  },
  {
    id: 'diseno-sencillos',
    nombre: 'Diseño Sencillos',
    fondo: 'bg-[linear-gradient(160deg,#f6efe9,#fffdfb_60%,#e4d2c4)]',
  },
];

function fotosDe(carpeta: string): string[] {
  const dir = path.join(process.cwd(), 'public', 'portafolio', carpeta);
  try {
    return fs
      .readdirSync(dir)
      .filter((archivo) => /\.(jpe?g|png|webp|avif|gif)$/i.test(archivo))
      .sort((a, b) => a.localeCompare(b, 'es'))
      .map((archivo) => `/portafolio/${carpeta}/${archivo}`);
  } catch {
    return [];
  }
}

function origenPortafolio() {
  return (
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ||
    'https://api.automotorestrujillo.com'
  );
}

async function fotosSubidas(): Promise<Record<string, string[]>> {
  const origen = origenPortafolio();
  try {
    const res = await fetch(`${origen}/api/portafolio`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return {};
    const json = (await res.json()) as {
      data?: { categorias?: { id: string; fotos: { url: string }[] }[] };
    };
    const out: Record<string, string[]> = {};
    for (const categoria of json.data?.categorias ?? []) {
      out[categoria.id] = categoria.fotos.map((foto) =>
        foto.url.startsWith('http') ? foto.url : `${origen}${foto.url}`,
      );
    }
    return out;
  } catch {
    return {};
  }
}

const recompensas = [
  { nombre: 'Esmalte cortesía', pts: 100 },
  { nombre: 'Upgrade soft gel', pts: 180 },
  { nombre: 'Sesión beauty', pts: 300 },
];

export default async function HomePage() {
  const subidas = await fotosSubidas();
  return (
    <div className="min-h-screen bg-porcelain text-ink">
      <LandingNavbar />
      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(216,180,160,0.35),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(168,40,59,0.12),transparent_40%)]" />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:items-center md:px-6 md:py-24">
            <div className="animate-fade-up">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brass">
                Salón de uñas.
              </p>
              <h1 className="mt-4 font-display text-5xl leading-[1.05] text-ink md:text-6xl">
                Engríete
                <br />
                Consientete y
                <br />
                <span className="text-lacquer">Acumula Puntos</span>
              </h1>
              <div className="mt-5 max-w-xl space-y-2 text-base leading-relaxed text-ink-soft">
                <p className="font-bold text-ink">Tu belleza merece ser recompensada.</p>
                <p>¡Bienvenida a una nueva forma de disfrutar tus momentos!</p>
                <p className="text-pretty">
                  En <span className="font-bold text-ink">STUDIO S</span> creemos que cada visita
                  es especial. Por eso, queremos agradecerte por elegirnos y permitirnos ser parte
                  de tu estilo.
                </p>
              </div>
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
            <div className="relative flex min-h-[360px] items-start justify-center overflow-hidden rounded-[2rem] bg-ink pt-8 shadow-[var(--shadow-soft)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(176,141,87,0.28),transparent_55%),radial-gradient(circle_at_80%_80%,rgba(168,40,59,0.22),transparent_45%)]" />
              <div className="relative -translate-y-2 animate-fade-up">
                <BrandLogo href={null} size="xl" priority />
              </div>
              <div className="absolute bottom-6 left-6 right-6 rounded-[1.4rem] bg-porcelain/95 p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.16em] text-brass">Fidelización</p>
                <p className="mt-2 font-display text-2xl text-ink">Tarjeta digital Studio S</p>
                <p className="mt-1 text-sm text-ink-soft">
                  Acumula puntos y canjea recompensas.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="propuesta" className="mx-auto max-w-6xl px-4 py-16 md:px-6">
          <h2 className="font-display text-4xl uppercase leading-[1.05] tracking-[0.06em] text-ink md:text-5xl">
            Vive la experiencia
            <span className="mt-1 block text-lacquer">Studio S</span>
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <article className="flex h-full flex-col rounded-[1.5rem] bg-surface p-6 shadow-[var(--shadow-soft)]">
              <h3 className="font-display text-2xl font-bold text-ink">Cuidado Natural</h3>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm font-normal leading-relaxed text-ink-soft">
                <li>En STUDIO S, brindamos belleza, cuidado y amor por tus uñas naturales</li>
                <li>No solo embellecemos tus uñas, las cuidamos!</li>
              </ul>
            </article>
            <article className="flex h-full flex-col rounded-[1.5rem] bg-surface p-6 shadow-[var(--shadow-soft)]">
              <h3 className="font-display text-2xl font-bold leading-snug text-ink">
                La experiencia en STUDIO S incluye:
              </h3>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm font-normal leading-relaxed text-ink-soft">
                <li>Bebidas</li>
                <li>Activaciones</li>
                <li>Alianzas estratégicas</li>
                <li>Seguimiento continuo</li>
              </ul>
            </article>
            <article className="flex h-full flex-col rounded-[1.5rem] bg-surface p-6 shadow-[var(--shadow-soft)]">
              <h3 className="font-display text-2xl font-bold text-ink">Puntos con Studio S</h3>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm font-normal leading-relaxed text-ink-soft">
                <li>
                  Cuanto más disfrutes de tus uñas, más oportunidades tienes de recibir recompensas.
                </li>
                <li>Beneficios especiales para nuestras clientas.</li>
                <li>Recompensas especiales para nuestras clientas.</li>
                <li>Sorpresas y promociones exclusivas.</li>
                <li>Una experiencia pensada especialmente para ti.</li>
              </ul>
            </article>
          </div>
        </section>

        <section id="portafolio" className="bg-clay/35 py-16">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <h2 className="font-display text-4xl text-ink">Portafolio</h2>
            <p className="mt-2 text-ink-soft">Selección editorial de manicures y nail art.</p>
            <Portafolio
              categorias={portafolioBase.map((categoria) => ({
                ...categoria,
                fotos: [...fotosDe(categoria.id), ...(subidas[categoria.id] ?? [])],
              }))}
            />
          </div>
        </section>

        <section id="servicios" className="mx-auto max-w-6xl px-4 py-16 md:px-6">
          <h2 className="font-display text-4xl text-ink">Servicios</h2>
          <div className="mt-10 space-y-12">
            {categoriasServicios.map((categoria) => (
              <div key={categoria.nombre}>
                <h3 className="inline-flex rounded-full bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-porcelain">
                  {categoria.nombre}
                </h3>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {categoria.items.map((servicio) => (
                    <article
                      key={`${categoria.nombre}-${servicio.nombre}`}
                      className="flex h-full flex-col rounded-[1.5rem] bg-surface p-5 ring-1 ring-ink/5"
                    >
                      <h4 className="font-display text-xl leading-snug text-ink">{servicio.nombre}</h4>
                      {servicio.desc ? (
                        <p className="mt-3 text-sm leading-relaxed text-ink-soft">{servicio.desc}</p>
                      ) : null}
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="fidelizacion" className="bg-ink py-16 text-porcelain">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brass">
              Programa de fidelización
            </p>
            <h2 className="mt-3 font-display text-4xl">Cómo funcionan tus puntos</h2>
            <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {[
                {
                  titulo: 'Afíliate gratis.',
                  texto: 'Registra tus datos y forma parte de nuestra comunidad de clientas.',
                },
                {
                  titulo: 'Disfruta tus servicios favoritos.',
                  texto: 'Realiza tus servicios de manicure, pedicure y uñas con nuestro equipo.',
                },
                {
                  titulo: 'Acumula puntos.',
                  texto:
                    'Por cada compra elegible, suma puntos en tu cuenta de acuerdo con las condiciones del programa.',
                },
                {
                  titulo: 'Canjea tus recompensas.',
                  texto:
                    'Utiliza tus puntos para acceder a beneficios, descuentos o servicios seleccionados.',
                },
                {
                  titulo: 'Sigue acumulando.',
                  texto: 'Cada nueva visita es una oportunidad para acercarte a tu próxima recompensa.',
                },
              ].map((step, i) => (
                <li
                  key={step.titulo}
                  className="flex h-full flex-col rounded-[1.4rem] bg-porcelain/5 p-5 ring-1 ring-porcelain/10"
                >
                  <span className="font-display text-3xl text-lacquer">{i + 1}</span>
                  <p className="mt-3 text-sm font-bold text-porcelain">{step.titulo}</p>
                  <p className="mt-2 text-sm font-normal leading-relaxed text-porcelain/80">
                    {step.texto}
                  </p>
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
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brass">
              En <span className="text-ink">STUDIO S</span>
            </p>
            <h3 className="mt-3 font-display text-4xl leading-tight text-ink">
              Tu belleza tiene recompensa.
            </h3>
            <div className="mx-auto mt-5 max-w-md space-y-2 text-sm leading-relaxed text-ink-soft">
              <p>Beneficios exclusivos por tu preferencia.</p>
              <p>Una experiencia que continúa después de tu cita.</p>
              <p>Cada visita te acerca a un nuevo beneficio.</p>
            </div>
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
