import type { MetadataRoute } from 'next'

import { getPayloadClient } from '@/lib/payload'

export const revalidate = 3600

const baseUrl = () => process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayloadClient()
  // Public read rules: only published, non-expired jobs are listed
  const [jobs, companies] = await Promise.all([
    payload.find({ collection: 'jobs', depth: 0, pagination: false, select: { slug: true, updatedAt: true }, overrideAccess: false }),
    payload.find({ collection: 'companies', depth: 0, pagination: false, select: { slug: true, updatedAt: true }, overrideAccess: false }),
  ])

  return [
    { url: `${baseUrl()}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl()}/jobs`, changeFrequency: 'hourly', priority: 0.9 },
    ...jobs.docs.map((job) => ({
      url: `${baseUrl()}/jobs/${job.slug}`,
      lastModified: job.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...companies.docs.map((company) => ({
      url: `${baseUrl()}/companies/${company.slug}`,
      lastModified: company.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    })),
  ]
}
