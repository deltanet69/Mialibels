import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MI Attaqwa 15 Portal',
    short_name: 'MIA 15',
    description: 'Portal Smart Admin & Parent MI Attaqwa 15',
    id: '/',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#0e7490',
    categories: ['education'],
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    screenshots: [
      {
        src: '/screenshots/mobile.jpg',
        sizes: '540x960',
        type: 'image/jpeg',
        // @ts-ignore — form_factor is valid per spec but not in older Next.js typedefs
        form_factor: 'narrow',
        label: 'Portal Orang Tua MI Attaqwa 15',
      },
      {
        src: '/screenshots/desktop.jpg',
        sizes: '1280x720',
        type: 'image/jpeg',
        // @ts-ignore
        form_factor: 'wide',
        label: 'Website MI Attaqwa 15 Babelan',
      },
    ],
  }
}

