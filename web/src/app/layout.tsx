import type { Metadata } from 'next';
import { Fraunces, Manrope } from 'next/font/google';
import { AuthProvider } from '@/lib/auth/auth-context';
import { ClientaAuthProvider } from '@/lib/auth/clienta-auth-context';
import './globals.css';

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
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
      <body className={`${fraunces.variable} ${manrope.variable} antialiased`}>
        <AuthProvider>
          <ClientaAuthProvider>{children}</ClientaAuthProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
