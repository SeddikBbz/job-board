import { Container } from '@/components/container'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <Container className="grid gap-8 py-8 md:grid-cols-[260px_1fr]" aria-busy>
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
      <div className="min-w-0 space-y-3">
        <Skeleton className="h-8 w-32" />
        <div className="grid-cards gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      </div>
      <span className="sr-only">Loading jobs…</span>
    </Container>
  )
}
