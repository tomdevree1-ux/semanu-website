import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'amai',
    short_name: 'amai',
    description: 'Ihr digitaler Partner für Schweizer KMU: 3D-Konfiguratoren und Unternehmenssoftware nach Mass, mit AI als Motor.',
    start_url: '/',
    display: 'standalone',
    background_color: '#1b2a4a',
    theme_color: '#1b2a4a',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
