import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MI Attaqwa 15 Portal',
    short_name: 'MIA 15',
    description: 'Portal Smart Admin & Parent MI Attaqwa 15',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0e7490', // cyan-700
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
