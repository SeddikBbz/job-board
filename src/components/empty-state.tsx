import { SearchX } from 'lucide-react'

type Props = {
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center">
      <SearchX className="text-muted-foreground mb-4 size-10" aria-hidden />
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <p className="text-muted-foreground mt-1 max-w-sm text-sm">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
