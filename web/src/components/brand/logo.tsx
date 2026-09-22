import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const LOGO_SRC = '/logo-studio-s.png';

type BrandLogoProps = {
  /** Pasá `null` para mostrar el logo sin enlace. */
  href?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  priority?: boolean;
  showWordmark?: boolean;
};

const sizes = {
  sm: { box: 36, px: 36 },
  md: { box: 48, px: 48 },
  lg: { box: 72, px: 72 },
  xl: { box: 120, px: 120 },
} as const;

export function BrandLogo({
  href = '/',
  size = 'md',
  className,
  priority = false,
  showWordmark = false,
}: BrandLogoProps) {
  const dim = sizes[size];
  const mark = (
    <span className={cn('inline-flex items-center gap-3', className)}>
      <Image
        src={LOGO_SRC}
        alt="Studio S"
        width={dim.px}
        height={dim.px}
        priority={priority}
        className="object-contain"
        style={{ width: dim.box, height: dim.box }}
      />
      {showWordmark ? (
        <span className="font-display text-2xl tracking-tight text-ink">
          Studio <span className="text-lacquer">S</span>
        </span>
      ) : null}
    </span>
  );

  if (href == null) return mark;

  return (
    <Link href={href} className="inline-flex items-center" aria-label="Studio S — inicio">
      {mark}
    </Link>
  );
}
