import { MapPin, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Props = { defaultQuery?: string; defaultLocation?: string; className?: string }

// One search bar, Indeed-style: keywords + location + button. A plain GET form,
// so it works without JavaScript and lands on /jobs?q=…&location=…
export function SearchBar({ defaultQuery, defaultLocation, className }: Props) {
  return (
    <form
      action="/jobs"
      role="search"
      className={cn(
        'bg-background flex flex-col gap-2 rounded-2xl border p-2 shadow-lg shadow-slate-900/5 sm:flex-row sm:items-center sm:gap-0',
        className,
      )}
    >
      <label className="flex flex-1 items-center gap-2 px-3">
        <Search className="text-muted-foreground size-5 shrink-0" aria-hidden />
        <span className="sr-only">Keywords</span>
        <input
          name="q"
          defaultValue={defaultQuery}
          placeholder="Job title, skill or company"
          className="placeholder:text-muted-foreground h-11 w-full bg-transparent text-base outline-none"
        />
      </label>
      <div className="bg-border hidden h-8 w-px sm:block" aria-hidden />
      <label className="flex flex-1 items-center gap-2 px-3 sm:max-w-56">
        <MapPin className="text-muted-foreground size-5 shrink-0" aria-hidden />
        <span className="sr-only">Location</span>
        <input
          name="location"
          defaultValue={defaultLocation}
          placeholder="City or remote"
          className="placeholder:text-muted-foreground h-11 w-full bg-transparent text-base outline-none"
        />
      </label>
      <Button type="submit" size="lg" className="h-11 rounded-xl px-6">
        Search jobs
      </Button>
    </form>
  )
}
