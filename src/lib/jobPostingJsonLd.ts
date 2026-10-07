import { richTextToText } from '@/lib/richText'
import type { Company, Job, Media } from '@/payload-types'

const EMPLOYMENT_TYPE: Record<string, string> = {
  'full-time': 'FULL_TIME',
  'part-time': 'PART_TIME',
  contract: 'CONTRACTOR',
  internship: 'INTERN',
}

// schema.org JobPosting, so search engines can show the job in job search results.
// https://developers.google.com/search/docs/appearance/structured-data/job-posting
export function jobPostingJsonLd(job: Job, siteUrl: string) {
  const company = typeof job.company === 'object' ? (job.company as Company) : null
  const logo = company && typeof company.logo === 'object' ? (company.logo as Media | null) : null

  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: richTextToText(job.description),
    datePosted: job.publishedAt ?? job.createdAt,
    ...(job.expiresAt && { validThrough: job.expiresAt }),
    ...(job.jobType && { employmentType: EMPLOYMENT_TYPE[job.jobType] }),
    hiringOrganization: {
      '@type': 'Organization',
      name: company?.name,
      ...(company?.website && { sameAs: company.website }),
      ...(logo?.url && { logo: new URL(logo.url, siteUrl).toString() }),
    },
    ...(job.workMode === 'remote'
      ? { jobLocationType: 'TELECOMMUTE' }
      : job.location && {
          jobLocation: {
            '@type': 'Place',
            address: { '@type': 'PostalAddress', addressLocality: job.location },
          },
        }),
    ...(job.salaryCurrency &&
      (job.salaryMin != null || job.salaryMax != null) && {
        baseSalary: {
          '@type': 'MonetaryAmount',
          currency: job.salaryCurrency,
          value: {
            '@type': 'QuantitativeValue',
            ...(job.salaryMin != null && { minValue: job.salaryMin }),
            ...(job.salaryMax != null && { maxValue: job.salaryMax }),
            unitText: 'YEAR',
          },
        },
      }),
    url: `${siteUrl}/jobs/${job.slug}`,
  }
}

// JSON inside <script> must not contain "</script>": escape "<" so user text can't break out.
export const serializeJsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c')
