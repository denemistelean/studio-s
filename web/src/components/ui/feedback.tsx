import { cn } from '@/lib/utils';
import type { HTMLAttributes, ReactNode } from 'react';

export function Card({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={cn(
        'rounded-[1.4rem] bg-surface p-5 shadow-[var(--shadow-soft)] ring-1 ring-black/5',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = 'lacquer',
  className,
}: {
  children: ReactNode;
  tone?: 'lacquer' | 'ink' | 'brass' | 'muted' | 'clay';
  className?: string;
}) {
  const tones = {
    lacquer: 'bg-[color-mix(in_srgb,var(--color-lacquer)_12%,white)] text-lacquer',
    ink: 'bg-ink/5 text-ink',
    brass: 'bg-[color-mix(in_srgb,var(--color-brass)_18%,white)] text-[#7a5f35]',
    muted: 'bg-ink-soft/10 text-ink-soft',
    clay: 'bg-clay/40 text-ink-soft',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ estado }: { estado: string }) {
  const map: Record<string, 'lacquer' | 'ink' | 'brass' | 'muted' | 'clay'> = {
    ACTIVA: 'lacquer',
    ACTIVO: 'lacquer',
    REGISTRADO: 'lacquer',
    SOLICITADO: 'lacquer',
    ENTREGADO: 'ink',
    ANULADO: 'muted',
    INACTIVA: 'muted',
    INACTIVO: 'muted',
    BLOQUEADA: 'muted',
    BLOQUEADO: 'muted',
  };
  return <Badge tone={map[estado] || 'muted'}>{estado}</Badge>;
}

export function PointsBadge({ points }: { points: number }) {
  return <Badge tone="lacquer">{points} pts</Badge>;
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-[1.4rem] border border-dashed border-ink/10 bg-porcelain/60 px-6 py-12 text-center">
      <h3 className="font-display text-xl text-ink">{title}</h3>
      {description ? <p className="mt-2 text-sm text-ink-soft">{description}</p> : null}
    </div>
  );
}

export function LoadingState({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-ink-soft">
      <span className="h-2 w-2 animate-pulse rounded-full bg-lacquer" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-[1.4rem] bg-[color-mix(in_srgb,var(--color-lacquer)_8%,white)] px-5 py-4 text-sm text-lacquer-dark">
      {message}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-3xl text-ink md:text-4xl">{title}</h1>
        {description ? <p className="mt-1 text-sm text-ink-soft">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  accent = 'lacquer',
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: 'lacquer' | 'brass' | 'ink';
}) {
  const bar =
    accent === 'brass' ? 'bg-brass' : accent === 'ink' ? 'bg-ink' : 'bg-lacquer';
  return (
    <Card className="relative overflow-hidden">
      <div className={cn('absolute left-0 top-0 h-full w-1', bar)} />
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">{label}</p>
      <p className="mt-3 font-display text-3xl text-ink">{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink-soft">{hint}</p> : null}
    </Card>
  );
}
