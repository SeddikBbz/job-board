import { cn } from '@/lib/utils'

const STYLES: Record<string, string> = {
  // job statuses
  draft: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  closed: 'bg-zinc-100 text-zinc-500 border-zinc-200',
  // application statuses
  applied: 'bg-blue-50 text-blue-700 border-blue-200',
  reviewing: 'bg-amber-50 text-amber-800 border-amber-200',
  interview: 'bg-violet-50 text-violet-700 border-violet-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  hired: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  withdrawn: 'bg-zinc-100 text-zinc-500 border-zinc-200 line-through',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize',
        STYLES[status] ?? STYLES.draft,
      )}
    >
      {status}
    </span>
  )
}
