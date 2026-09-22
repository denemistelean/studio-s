import { cn } from '@/lib/utils';
import type { InputHTMLAttributes } from 'react';

export function Input({
  className,
  label,
  error,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
}) {
  const inputId = id || props.name;
  return (
    <label className="block space-y-1.5">
      {label ? (
        <span className="text-sm font-medium text-ink-soft">{label}</span>
      ) : null}
      <input
        id={inputId}
        className={cn(
          'w-full rounded-2xl border border-input-border bg-input px-4 py-3 text-base font-medium text-ink shadow-[inset_0_1px_2px_rgba(27,22,20,0.03)] placeholder:font-normal placeholder:text-placeholder transition focus:border-lacquer focus:outline-none focus:ring-2 focus:ring-lacquer/35',
          error && 'border-lacquer ring-2 ring-lacquer/40',
          className,
        )}
        {...props}
      />
      {error ? <span className="text-xs text-lacquer">{error}</span> : null}
    </label>
  );
}
