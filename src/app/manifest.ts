import type { MetadataRoute } from 'next'

// Web app manifest: lets phones install the site to the home screen (served at /manifest.webmanifest)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'JobBoard – Find your next job',
    short_name: 'JobBoard',
    description: 'Browse jobs from great companies and apply in minutes.',
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    lang: 'en',
    dir: 'ltr',
    background_color: '#ffffff',
    theme_color: '#4f46e5',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
