import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)
const isDev = process.env.NODE_ENV !== 'production'

// Basic CSP for the public site. 'unsafe-inline' scripts are needed by Next.js without nonces;
// Cloudflare Turnstile needs its script and iframe. Dev adds eval + websockets for hot reload.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com",
  "font-src 'self'",
  `connect-src 'self' https://challenges.cloudflare.com${isDev ? ' ws: wss:' : ''}`,
  'frame-src https://challenges.cloudflare.com',
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ')

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // SAMEORIGIN (not DENY) so the Payload admin can still use same-origin previews
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Resumes can be up to 5 MB (default limit is 1 MB)
      bodySizeLimit: '6mb',
    },
  },
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // The CSP is only for the public site; the Payload admin and API manage their own needs
      {
        source: '/((?!admin|api).*)',
        headers: [{ key: 'Content-Security-Policy', value: contentSecurityPolicy }],
      },
    ]
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
