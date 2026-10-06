import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'

type Props = {
  page: number
  totalPages: number
  // Current search params, so filters are kept when changing page
  searchParams: Record<string, string | string[] | undefined>
}

export function Pagination({ page, totalPages, searchParams }: Props) {
  if (totalPages <= 1) return null

  const hrefFor = (target: number) => {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(searchParams)) {
      if (key !== 'page' && typeof value === 'string') params.set(key, value)
    }
    if (target > 1) params.set('page', String(target))
    const query = params.toString()
    return query ? `/jobs?${query}` : '/jobs'
  }

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-4 pt-4">
      {page > 1 ? (
        <Button variant="outline" asChild>
          <Link href={hrefFor(page - 1)} rel="prev">
            <ChevronLeft aria-hidden /> Previous
          </Link>
        </Button>
      ) : (
        <span />
      )}
      <span className="text-muted-foreground text-sm">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Button variant="outline" asChild>
          <Link href={hrefFor(page + 1)} rel="next">
            Next <ChevronRight aria-hidden />
          </Link>
        </Button>
      ) : (
        <span />
      )}
    </nav>
  )
}
