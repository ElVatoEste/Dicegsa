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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dicegsa.escalia.tech';
const DESCRIPTION = 'Plataforma de operación del almacén CDF de DICEGSA.';
const SHARE_IMAGE = { url: '/og.jpg', width: 1200, height: 630, alt: 'Dicegsa, Centro de Distribución' };

export const metadata: Metadata = {
  // Base para las URL absolutas que piden las vistas previas al compartir un enlace.
  metadataBase: new URL(SITE_URL),
  title: { default: 'Dicegsa · Almacén CDF', template: '%s · Dicegsa' },
  description: DESCRIPTION,
  applicationName: 'Dicegsa',
  // Plataforma privada: no tiene nada que un buscador deba indexar. La vista previa
  // al compartir el enlace no depende de esto.
  robots: { index: false, follow: false },
  openGraph: {
    type: 'website',
    locale: 'es_NI',
    siteName: 'Dicegsa',
    url: '/',
    title: 'Dicegsa · Almacén CDF',
    description: DESCRIPTION,
    images: [SHARE_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dicegsa · Almacén CDF',
    description: DESCRIPTION,
    images: [SHARE_IMAGE.url],
  },
  appleWebApp: { title: 'Dicegsa' },
  // Los códigos de pedido y PKL no son teléfonos: el navegador del móvil no los convierte en enlaces.
  formatDetection: { telephone: false },
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
