import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Private or not useful in search results
      disallow: ['/admin', '/api', '/dashboard', '/login', '/register', '/forgot-password', '/reset-password'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
