'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { ApiClientError, apiRequest, getApiBaseUrl } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, ErrorState, LoadingState, PageHeader } from '@/components/ui/feedback';

const TARJETAS = [
  { id: 'tendencias-inn', nombre: 'Tendencias Inn' },
  { id: 'top-5', nombre: 'Top 5' },
  { id: 'disenos-complejos', nombre: 'Diseños Complejos' },
  { id: 'diseno-sencillos', nombre: 'Diseño Sencillos' },
] as const;

type Foto = { nombre: string; url: string; bytes: number };
type Categoria = { id: string; nombre: string; fotos: Foto[] };

const GUIA =
  'Subí fotos nítidas, en WebP o JPG. Lo ideal es que pesen menos de 500 KB y midan cerca de 1600 px de ancho. Si la imagen fue generada con IA y es un PNG pesado, exportala como WebP: se ve igual de bien y no sobrecarga la web.';

function urlFoto(url: string) {
  return url.startsWith('http') ? url : `${getApiBaseUrl()}${url}`;
}

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.readAsDataURL(blob);
  });
}

async function prepararImagen(file: File): Promise<{ blob: Blob; aviso: string }> {
  const convieneConvertir = file.type === 'image/png' || file.size > 500 * 1024;
  if (!convieneConvertir && (file.type === 'image/webp' || file.type === 'image/jpeg')) {
    return { blob: file, aviso: '' };
  }

  const bitmap = await createImageBitmap(file);
  const max = 1600;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new Error('No se pudo preparar la imagen. Exportala como WebP y volvé a intentar.');
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const calidades = [0.82, 0.7, 0.58];
  for (const calidad of calidades) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', calidad),
    );
    if (blob && blob.size <= 1_200_000) {
      return {
        blob,
        aviso: `Se convirtió a WebP (${Math.round(blob.size / 1024)} KB, ${width}×${height} px) para que se vea bien y no sobrecargue la web.`,
      };
    }
  }

  throw new Error(
    'La imagen sigue muy pesada. Si fue generada con IA, exportala como WebP de menos de 500 KB y volvé a subirla.',
  );
}

export default function PortafolioAdminPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [tarjeta, setTarjeta] = useState<(typeof TARJETAS)[number]['id']>('tendencias-inn');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [aviso, setAviso] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await apiRequest<{ categorias: Categoria[] }>('/api/portafolio');
      setCategorias(data.categorias);
    } catch (e) {
      setLoadError(e instanceof ApiClientError ? e.message : 'No se pudo cargar el portafolio');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!archivo) {
      setError('Elegí una imagen para la tarjeta');
      return;
    }
    setSaving(true);
    setError('');
    setAviso('');
    try {
      const preparada = await prepararImagen(archivo);
      const imagen = await blobToBase64(preparada.blob);
      await apiRequest('/api/portafolio', {
        method: 'POST',
        body: { categoria: tarjeta, imagen },
      });
      setArchivo(null);
      setAviso(preparada.aviso || 'Imagen publicada en la tarjeta elegida.');
      const input = document.getElementById('foto-portafolio') as HTMLInputElement | null;
      if (input) input.value = '';
      await load();
    } catch (e) {
      setError(
        e instanceof ApiClientError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'No se pudo subir la imagen',
      );
    } finally {
      setSaving(false);
    }
  }

  async function quitar(categoria: string, nombre: string) {
    if (!window.confirm('¿Retirar esta foto del portafolio?')) return;
    setError('');
    try {
      await apiRequest(`/api/portafolio/${categoria}/${nombre}`, { method: 'DELETE' });
      await load();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'No se pudo retirar la imagen');
    }
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Portafolio"
        description="Publicá las fotos de cada tarjeta de la página principal."
      />

      <Card className="mb-6 bg-form">
        <h2 className="font-display text-xl text-ink">Subir imagen</h2>
        <p className="mt-3 rounded-2xl bg-porcelain px-4 py-3 text-sm leading-relaxed text-ink-soft">
          {GUIA}
        </p>
        <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-ink-soft">Tarjeta</span>
            <select
              value={tarjeta}
              onChange={(event) =>
                setTarjeta(event.target.value as (typeof TARJETAS)[number]['id'])
              }
              className="w-full rounded-2xl border border-input-border bg-input px-4 py-3 text-base font-medium text-ink focus:border-lacquer focus:outline-none focus:ring-2 focus:ring-lacquer/35"
            >
              {TARJETAS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-ink-soft">Imagen</span>
            <input
              id="foto-portafolio"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                setArchivo(event.target.files?.[0] ?? null);
                setAviso('');
              }}
              className="w-full rounded-2xl border border-input-border bg-input px-4 py-3 text-sm text-ink file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-porcelain"
            />
          </label>
          <div className="md:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Publicando…' : 'Publicar en la tarjeta'}
            </Button>
          </div>
        </form>
        {aviso ? <p className="mt-4 text-sm text-ink-soft">{aviso}</p> : null}
        {error ? <p className="mt-4 text-sm text-lacquer">{error}</p> : null}
      </Card>

      {loading ? <LoadingState label="Cargando fotos…" /> : null}
      {!loading && loadError ? <ErrorState message={loadError} /> : null}

      <div className="space-y-8">
        {TARJETAS.map((tarjetaItem) => {
          const fotos = categorias.find((item) => item.id === tarjetaItem.id)?.fotos ?? [];
          return (
            <section key={tarjetaItem.id}>
              <h3 className="font-display text-2xl text-ink">{tarjetaItem.nombre}</h3>
              {fotos.length === 0 ? (
                <p className="mt-2 text-sm text-ink-soft">Todavía no hay fotos en esta tarjeta.</p>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {fotos.map((foto) => (
                    <figure
                      key={foto.nombre}
                      className="overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-soft)]"
                    >
                      <img
                        src={urlFoto(foto.url)}
                        alt=""
                        className="aspect-[4/5] w-full object-cover"
                      />
                      <figcaption className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-ink-soft">
                        <span>{Math.max(1, Math.round(foto.bytes / 1024))} KB</span>
                        <button
                          type="button"
                          className="font-semibold text-lacquer"
                          onClick={() => void quitar(tarjetaItem.id, foto.nombre)}
                        >
                          Quitar
                        </button>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
