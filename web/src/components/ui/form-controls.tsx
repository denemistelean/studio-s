import { cn } from '@/lib/utils';
import type { SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';

export function Select({
  className,
  label,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      {label ? <span className="text-sm font-medium text-ink-soft">{label}</span> : null}
      <select
        className={cn(
          'w-full rounded-2xl border border-input-border bg-input px-4 py-3 text-base font-medium text-ink shadow-[inset_0_1px_2px_rgba(27,22,20,0.03)] focus:border-lacquer focus:outline-none focus:ring-2 focus:ring-lacquer/35',
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function Textarea({
  className,
  label,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="block space-y-1.5">
      {label ? <span className="text-sm font-medium text-ink-soft">{label}</span> : null}
      <textarea
        className={cn(
          'min-h-28 w-full rounded-2xl border border-input-border bg-input px-4 py-3 text-base font-medium text-ink shadow-[inset_0_1px_2px_rgba(27,22,20,0.03)] placeholder:font-normal placeholder:text-placeholder focus:border-lacquer focus:outline-none focus:ring-2 focus:ring-lacquer/35',
          className,
        )}
        {...props}
      />
    </label>
  );
}
