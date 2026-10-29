import type { Metadata } from 'next';
import { Bodoni_Moda } from 'next/font/google';
import { AuthProvider } from '@/lib/auth/auth-context';
import { ClientaAuthProvider } from '@/lib/auth/clienta-auth-context';
import './globals.css';

/** Didone de alto contraste (estilo Didot/Bodoni de la referencia tipográfica). Incluye mayúsculas y minúsculas. */
const bodoni = Bodoni_Moda({
  variable: '--font-bodoni',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: {
    default: 'Studio S — Salón de Uñas',
    template: '%s · Studio S',
  },
  description:
    'Belleza editorial, puntos y recompensas. Studio S — salón de uñas premium.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${bodoni.variable} antialiased`}>
        <AuthProvider>
          <ClientaAuthProvider>{children}</ClientaAuthProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
