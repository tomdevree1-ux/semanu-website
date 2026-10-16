import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'semanu',
    short_name: 'semanu',
    description: 'Digitale partner uit Antwerpen: 3D-configuratoren en bedrijfssoftware op maat, met AI als motor.',
    start_url: '/',
    display: 'standalone',
    background_color: '#16233D',
    theme_color: '#16233D',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
