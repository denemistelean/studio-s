'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

type Props = {
  payload: string;
  size?: number;
  className?: string;
};

export function QrCodeImage({ payload, size = 220, className }: Props) {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setError('');
    QRCode.toDataURL(payload, {
      width: size,
      margin: 2,
      color: { dark: '#1b1614', light: '#fffcfa' },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setError('No se pudo generar el QR');
      });
    return () => {
      cancelled = true;
    };
  }, [payload, size]);

  if (error) {
    return <p className="text-sm text-lacquer-dark">{error}</p>;
  }
  if (!dataUrl) {
    return (
      <div
        className="animate-pulse rounded-lg bg-input"
        style={{ width: size, height: size }}
        aria-label="Generando QR"
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dataUrl}
      alt="Código QR personal Studio S"
      width={size}
      height={size}
      className={className ?? 'rounded-lg'}
    />
  );
}
