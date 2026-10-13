'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export type PortafolioCategoria = {
  id: string;
  nombre: string;
  fotos: string[];
  fondo: string;
};

export function Portafolio({ categorias }: { categorias: PortafolioCategoria[] }) {
  const [abierta, setAbierta] = useState<PortafolioCategoria | null>(null);
  const [fotoActiva, setFotoActiva] = useState<number | null>(null);

  useEffect(() => {
    if (!abierta) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (fotoActiva != null) setFotoActiva(null);
        else setAbierta(null);
      }
      if (fotoActiva == null || !abierta.fotos.length) return;
      if (event.key === 'ArrowRight') {
        setFotoActiva((index) => (index == null ? 0 : (index + 1) % abierta.fotos.length));
      }
      if (event.key === 'ArrowLeft') {
        setFotoActiva((index) =>
          index == null ? 0 : (index - 1 + abierta.fotos.length) % abierta.fotos.length,
        );
      }
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [abierta, fotoActiva]);

  function cerrar() {
    setFotoActiva(null);
    setAbierta(null);
  }

  return (
    <>
      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {categorias.map((categoria) => {
          const portada = categoria.fotos[0];
          return (
            <button
              key={categoria.id}
              type="button"
              onClick={() => {
                setFotoActiva(null);
                setAbierta(categoria);
              }}
              className="group relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-[1.4rem] text-center shadow-[var(--shadow-soft)] focus:outline-none focus:ring-2 focus:ring-lacquer"
            >
              {portada ? (
                <img
                  src={portada}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              ) : (
                <span className={`absolute inset-0 ${categoria.fondo}`} />
              )}
              <span className="absolute inset-0 bg-ink/10 transition group-hover:bg-ink/25" />
              <span className="relative mx-4 rounded-xl border border-porcelain/80 bg-porcelain/90 px-3 py-2 text-sm font-medium text-ink">
                {categoria.nombre}
              </span>
            </button>
          );
        })}
      </div>

      {abierta ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/70 p-3 sm:items-center sm:p-6"
          role="presentation"
          onClick={cerrar}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="portafolio-titulo"
            className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[1.6rem] bg-porcelain shadow-[var(--shadow-soft)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-ink/5 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brass">
                  Portafolio
                </p>
                <h3 id="portafolio-titulo" className="font-display text-3xl text-ink">
                  {abierta.nombre}
                </h3>
              </div>
              <button
                type="button"
                onClick={cerrar}
                className="rounded-full p-2 text-ink-soft hover:bg-ink/5 hover:text-ink"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto p-5">
              {abierta.fotos.length === 0 ? (
                <p className="py-16 text-center text-sm text-ink-soft">
                  Todavía no hay fotos en {abierta.nombre}.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {abierta.fotos.map((src, index) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setFotoActiva(index)}
                      className="overflow-hidden rounded-[1rem] focus:outline-none focus:ring-2 focus:ring-lacquer"
                    >
                      <img
                        src={src}
                        alt={`${abierta.nombre} ${index + 1}`}
                        className="aspect-[4/5] h-full w-full object-cover transition hover:scale-105"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {fotoActiva != null && abierta.fotos[fotoActiva] ? (
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/90 p-4"
              onClick={(event) => {
                event.stopPropagation();
                setFotoActiva(null);
              }}
            >
              <button
                type="button"
                className="absolute right-4 top-4 rounded-full bg-porcelain/90 p-2 text-ink"
                aria-label="Cerrar foto"
                onClick={() => setFotoActiva(null)}
              >
                <X size={18} />
              </button>
              <button
                type="button"
                className="absolute left-3 rounded-full bg-porcelain/90 px-3 py-2 text-sm text-ink sm:left-6"
                onClick={(event) => {
                  event.stopPropagation();
                  setFotoActiva((index) =>
                    index == null
                      ? 0
                      : (index - 1 + abierta.fotos.length) % abierta.fotos.length,
                  );
                }}
              >
                Anterior
              </button>
              <img
                src={abierta.fotos[fotoActiva]}
                alt={`${abierta.nombre} ${fotoActiva + 1}`}
                className="max-h-[85vh] max-w-[80vw] rounded-[1rem] object-contain"
                onClick={(event) => event.stopPropagation()}
              />
              <button
                type="button"
                className="absolute right-3 rounded-full bg-porcelain/90 px-3 py-2 text-sm text-ink sm:right-6"
                onClick={(event) => {
                  event.stopPropagation();
                  setFotoActiva((index) =>
                    index == null ? 0 : (index + 1) % abierta.fotos.length,
                  );
                }}
              >
                Siguiente
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
