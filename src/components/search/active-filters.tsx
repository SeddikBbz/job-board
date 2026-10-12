import { X } from 'lucide-react'
import Link from 'next/link'

import { JOB_TYPE_LABELS, WORK_MODE_LABELS } from '@/lib/format'
import { toSearchParams, type JobFilters } from '@/lib/jobFilters'

type Props = { filters: JobFilters; skillNames: Record<string, string> }

const LEVELS: Record<string, string> = { junior: 'Junior', mid: 'Mid-level', senior: 'Senior', lead: 'Lead' }
const LANGS: Record<string, string> = { en: 'English', fr: 'French', ar: 'Arabic' }
const POSTED: Record<string, string> = { '24h': 'Last 24 hours', '7d': 'Last 7 days', '30d': 'Last 30 days' }

// Removable chips for every active filter. Plain links (no JavaScript needed): each one points
// to the same search without that filter.
export function ActiveFilters({ filters, skillNames }: Props) {
  const without = (change: Partial<JobFilters>) => {
    const params = toSearchParams({ ...filters, ...change, page: 1 })
    return `/jobs${params.size ? `?${params}` : ''}`
  }
  const listChips = (key: 'skills' | 'type' | 'mode' | 'exp' | 'lang', label: (v: string) => string) =>
    filters[key].map((v) => ({ key: `${key}-${v}`, label: label(v), href: without({ [key]: filters[key].filter((x) => x !== v) }) }))

  const chips = [
    ...(filters.q ? [{ key: 'q', label: `“${filters.q}”`, href: without({ q: undefined }) }] : []),
    ...(filters.location ? [{ key: 'location', label: filters.location, href: without({ location: undefined }) }] : []),
    ...listChips('skills', (v) => skillNames[v] ?? v),
    ...listChips('type', (v) => JOB_TYPE_LABELS[v as keyof typeof JOB_TYPE_LABELS] ?? v),
    ...listChips('mode', (v) => WORK_MODE_LABELS[v as keyof typeof WORK_MODE_LABELS] ?? v),
    ...listChips('exp', (v) => LEVELS[v] ?? v),
    ...listChips('lang', (v) => LANGS[v] ?? v),
    ...(filters.posted ? [{ key: 'posted', label: POSTED[filters.posted], href: without({ posted: undefined }) }] : []),
    ...(filters.salaryMin ? [{ key: 'salary', label: `≥ ${filters.salaryMin.toLocaleString('en')}`, href: without({ salaryMin: undefined }) }] : []),
  ]
  if (!chips.length) return null

  return (
    <ul className="flex flex-wrap items-center gap-2" aria-label="Active filters">
      {chips.map((chip) => (
        <li key={chip.key}>
          <Link
            href={chip.href}
            scroll={false}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/70 inline-flex min-h-8 items-center gap-1.5 rounded-full py-1 ps-3 pe-2 text-sm font-medium"
          >
            {chip.label}
            <X className="size-3.5" aria-hidden />
            <span className="sr-only">(remove filter)</span>
          </Link>
        </li>
      ))}
      {chips.length > 1 && (
        <li>
          <Link href="/jobs" scroll={false} className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-2">
            Clear all
          </Link>
        </li>
      )}
    </ul>
  )
}
