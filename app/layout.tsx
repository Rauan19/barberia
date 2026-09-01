import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import './globals.css';
import { RegisterServiceWorker } from '@/components/pwa/register-sw';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Barbearia',
  description:
    'Cortes, clientes, agenda e financeiro da sua barbearia, direto do celular.',
  applicationName: 'Barbearia',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Barbearia',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/icons/192', sizes: '192x192', type: 'image/png' },
      { url: '/icons/512', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/192', sizes: '192x192', type: 'image/png' }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1d4ed8' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0f1a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
