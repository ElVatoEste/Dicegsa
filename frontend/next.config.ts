import type { NextConfig } from 'next';

// Export estático: la app vive detrás de un login y no tiene contenido público que
// indexar, así que no hay ruta servida por Node ni middleware de Next.
const config: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
};

export default config;
