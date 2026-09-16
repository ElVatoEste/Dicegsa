import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CDF — Evaluación operativa',
  description: 'Plataforma OLE y Kanban para el almacén CDF (DICEGSA)',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
