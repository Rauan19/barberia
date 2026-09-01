import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Barbearia Gestão',
    short_name: 'Barbearia',
    description:
      'Cortes, clientes, agenda e financeiro da sua barbearia, direto do celular.',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f5f6f8',
    theme_color: '#1d4ed8',
    lang: 'pt-BR',
    categories: ['business', 'productivity'],
    icons: [
      { src: '/icons/192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Agenda', short_name: 'Agenda', url: '/dashboard/agenda' },
      { name: 'Financeiro', short_name: 'Financeiro', url: '/dashboard/financeiro' },
    ],
  };
}
