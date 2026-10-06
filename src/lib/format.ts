import type { Job } from '@/payload-types'

export const JOB_TYPE_LABELS: Record<string, string> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
}

export const WORK_MODE_LABELS: Record<string, string> = {
  onsite: 'On-site',
  hybrid: 'Hybrid',
  remote: 'Remote',
}

export const formatSalary = (job: Pick<Job, 'salaryMin' | 'salaryMax' | 'salaryCurrency'>) => {
  const { salaryMin, salaryMax, salaryCurrency } = job
  if (salaryMin == null && salaryMax == null) return null

  const fmt = (n: number) =>
    new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
  const range =
    salaryMin != null && salaryMax != null
      ? `${fmt(salaryMin)} – ${fmt(salaryMax)}`
      : fmt((salaryMin ?? salaryMax) as number)
  return salaryCurrency ? `${range} ${salaryCurrency}` : range
}

export const formatDate = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(
        new Date(value),
      )
    : null

// "3 days ago", "today"
export const timeAgo = (value?: string | null) => {
  if (!value) return null
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days} days ago`
  return formatDate(value)
}
