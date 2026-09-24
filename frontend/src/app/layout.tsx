import type { Metadata, Viewport } from 'next';
import { Barlow, IBM_Plex_Mono } from 'next/font/google';
import { ToastProvider } from '@/components/Toasts';
import './globals.css';

// Barlow viene del linaje de la señalética vial: se lee rápido, de lejos y de
// reojo, que es como se mira una pantalla en el piso de una bodega.
const barlow = Barlow({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-barlow',
});

// Las cifras, los códigos de PKL y los tiempos van en mono para que no bailen.
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-mono',
});

export const metadata: Metadata = {
  title: { default: 'Dicegsa · Almacén CDF', template: '%s · Dicegsa' },
  description: 'Plataforma de operación del almacén CDF de DICEGSA.',
  applicationName: 'Dicegsa',
  // Plataforma privada: no tiene nada que un buscador deba indexar.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#08243a',
  colorScheme: 'light',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${barlow.variable} ${plexMono.variable}`}>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
