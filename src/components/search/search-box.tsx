'use client'

import { Briefcase, Building2, Clock, Loader2, MapPin, Search, Sparkles, TrendingUp } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useId, useMemo, useState } from 'react'

import { useSearchTransition } from '@/components/search/search-transition'
import { Button } from '@/components/ui/button'
import { parseJobFilters, toSearchParams, type JobFilters } from '@/lib/jobFilters'
import { SUGGEST_MIN, type Suggestions } from '@/lib/suggest'
import { cn } from '@/lib/utils'

const RECENT_KEY = 'recent-searches'
const SUGGEST_DELAY = 250
const LIVE_DELAY = 300

type Option =
  | { kind: 'job' | 'company'; label: string; detail?: string | null; href: string }
  | { kind: 'skill'; label: string; detail?: string | null; slug: string }
  | { kind: 'location'; label: string; detail?: string | null }
  | { kind: 'recent' | 'popular'; label: string }

const GROUPS: { kind: Option['kind']; title: string; icon: typeof Search }[] = [
  { kind: 'recent', title: 'Recent searches', icon: Clock },
  { kind: 'popular', title: 'Popular searches', icon: TrendingUp },
  { kind: 'job', title: 'Jobs', icon: Briefcase },
  { kind: 'skill', title: 'Skills', icon: Sparkles },
  { kind: 'location', title: 'Cities', icon: MapPin },
  { kind: 'company', title: 'Companies', icon: Building2 },
]

const readRecent = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
  } catch {
    return []
  }
}
const saveRecent = (term: string) => {
  try {
    const next = [term, ...readRecent().filter((t) => t.toLowerCase() !== term.toLowerCase())].slice(0, 5)
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {}
}

// Bolds the part of `text` that matches what the user typed
function Highlight({ text, query }: { text: string; query: string }) {
  const i = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1
  if (i < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, i)}
      <mark className="text-foreground bg-transparent font-semibold">{text.slice(i, i + query.length)}</mark>
      {text.slice(i + query.length)}
    </>
  )
}

type Props = {
  // "navigate": home page, results open on /jobs. "live": on /jobs, the list updates while typing.
  mode: 'navigate' | 'live'
  className?: string
}

// Search box with live suggestions (jobs, skills, cities, companies), following the ARIA
// combobox pattern: arrow keys move, Enter selects, Escape closes.
export function SearchBox({ mode, className }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { startTransition, isPending } = useSearchTransition()
  const listId = useId()

  const urlQuery = mode === 'live' ? (searchParams.get('q') ?? '') : ''
  const [value, setValue] = useState(urlQuery)
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<Suggestions | null>(null)
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(-1)
  const [recent, setRecent] = useState<string[]>([])
  // Follow URL changes made elsewhere (removing a chip, back button) without an effect
  const [prevUrlQuery, setPrevUrlQuery] = useState(urlQuery)
  if (urlQuery !== prevUrlQuery) {
    setPrevUrlQuery(urlQuery)
    if (urlQuery !== value.trim()) setValue(urlQuery)
  }
  // What to fetch / commit next. A new object each time, so typing the same text again still counts.
  const [suggestFor, setSuggestFor] = useState<{ q: string } | null>(null)
  const [liveFor, setLiveFor] = useState<{ q: string; filters: JobFilters } | null>(null)

  const currentFilters = (): JobFilters => parseJobFilters(Object.fromEntries(searchParams.entries()))

  // Navigates (home) or replaces the URL in place (/jobs, so typing doesn't fill the history)
  const go = (filters: Partial<JobFilters>, { replace = false } = {}) => {
    const params = toSearchParams(filters)
    const url = `/jobs${params.size ? `?${params}` : ''}`
    startTransition(() => (replace ? router.replace(url, { scroll: false }) : router.push(url)))
  }

  // Suggestions: one request after a pause in typing. The cleanup cancels the previous timer
  // and aborts its request, so an old answer can never overwrite a newer one.
  useEffect(() => {
    if (!suggestFor) return
    const ctrl = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/next/suggest?q=${encodeURIComponent(suggestFor.q)}`, { signal: ctrl.signal })
        const json = res.ok ? ((await res.json()) as Suggestions) : null
        if (!ctrl.signal.aborted) setData(json)
      } catch {
        // aborted or offline: keep what is shown
      } finally {
        if (!ctrl.signal.aborted) setLoading(false)
      }
    }, SUGGEST_DELAY)
    return () => {
      clearTimeout(timer)
      ctrl.abort()
    }
  }, [suggestFor])

  // Live mode: the results follow the text after a short pause
  useEffect(() => {
    if (!liveFor) return
    const timer = setTimeout(() => go({ ...liveFor.filters, q: liveFor.q.trim() || undefined, page: 1 }, { replace: true }), LIVE_DELAY)
    return () => clearTimeout(timer)
    // `go` only uses the stable router and transition functions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveFor])

  const request = (q: string) => {
    const trimmed = q.trim()
    if (trimmed.length > 0 && trimmed.length < SUGGEST_MIN) {
      setData(null)
      setSuggestFor(null)
      return
    }
    setLoading(true)
    setSuggestFor({ q: trimmed })
  }

  const onType = (next: string) => {
    setValue(next)
    setOpen(true)
    setActive(-1)
    request(next)
    if (mode === 'live') setLiveFor({ q: next, filters: currentFilters() })
  }

  const onFocus = () => {
    setRecent(readRecent())
    setOpen(true)
    if (!data) request(value)
  }

  const typed = value.trim()
  const options: Option[] = useMemo(() => {
    if (!data) return typed ? [] : recent.map((label) => ({ kind: 'recent' as const, label }))
    return [
      ...(!typed ? recent.map((label) => ({ kind: 'recent' as const, label })) : []),
      ...(!typed ? (data.popular ?? []).map((label) => ({ kind: 'popular' as const, label })) : []),
      ...data.jobs.map((j) => ({ kind: 'job' as const, label: j.title, detail: j.company, href: `/jobs/${j.slug}` })),
      ...data.skills.map((s) => ({ kind: 'skill' as const, label: s.name, detail: s.category, slug: s.slug })),
      ...data.locations.map((l) => ({ kind: 'location' as const, label: l.name, detail: l.country })),
      ...data.companies.map((c) => ({ kind: 'company' as const, label: c.name, href: `/companies/${c.slug}` })),
    ]
  }, [data, recent, typed])

  const searchText = (text: string) => {
    const term = text.trim()
    if (term) saveRecent(term)
    setOpen(false)
    setLiveFor(null)
    go({ ...(mode === 'live' ? currentFilters() : {}), q: term || undefined, page: 1 }, { replace: mode === 'live' })
  }

  const choose = (option: Option) => {
    setOpen(false)
    setLiveFor(null)
    const base = mode === 'live' ? currentFilters() : ({} as Partial<JobFilters>)
    switch (option.kind) {
      case 'job':
      case 'company':
        router.push(option.href)
        return
      case 'skill': {
        // Becomes a filter chip; the typed text was only a way to find it
        setValue('')
        const skills = [...new Set([...(base.skills ?? []), option.slug])]
        go({ ...base, q: undefined, skills, page: 1 })
        return
      }
      case 'location':
        setValue('')
        go({ ...base, q: undefined, location: option.label, page: 1 })
        return
      default:
        setValue(option.label)
        searchText(option.label)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((i) => (options.length ? (i + 1) % options.length : -1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (options.length ? (i <= 0 ? options.length - 1 : i - 1) : -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (open && active >= 0 && options[active]) choose(options[active])
      else searchText(value)
    } else if (e.key === 'Escape') {
      // Browsers clear a search field on Escape; here it only closes the list
      e.preventDefault()
      setOpen(false)
      setActive(-1)
    }
  }

  const optionId = (i: number) => `${listId}-option-${i}`
  const showList = open && (options.length > 0 || (typed.length >= SUGGEST_MIN && !loading && data))

  return (
    <div className={cn('relative', className)} data-testid="search-box">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          searchText(value)
        }}
        className="bg-background flex items-center gap-2 rounded-2xl border p-2 shadow-lg shadow-black/5"
      >
        <Search className="text-muted-foreground ms-2 size-5 shrink-0" aria-hidden />
        <input
          type="search"
          value={value}
          onChange={(e) => onType(e.target.value)}
          onFocus={onFocus}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKeyDown}
          placeholder="Job title, skill, city or company"
          aria-label="Search jobs"
          role="combobox"
          aria-expanded={Boolean(showList)}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? optionId(active) : undefined}
          autoComplete="off"
          enterKeyHint="search"
          className="placeholder:text-muted-foreground h-11 w-full min-w-0 bg-transparent text-base outline-none"
        />
        {(loading || isPending) && <Loader2 className="text-muted-foreground size-4 shrink-0 animate-spin" aria-label="Loading" />}
        <Button type="submit" size="lg" className="h-11 shrink-0 rounded-xl px-5">
          Search
        </Button>
      </form>

      <div
        id={listId}
        role="listbox"
        aria-label="Search suggestions"
        hidden={!showList}
        className="bg-popover text-popover-foreground absolute inset-x-0 top-full z-50 mt-2 max-h-[min(28rem,70dvh)] overflow-y-auto rounded-xl border p-2 shadow-xl"
      >
        {options.length === 0 ? (
          <div className="text-muted-foreground p-3 text-sm" role="presentation">
            No suggestions for “{typed}”. Press Enter to search all jobs for it, or try a shorter word.
          </div>
        ) : (
          GROUPS.map(({ kind, title, icon: Icon }) => {
            const items = options.map((o, i) => ({ o, i })).filter(({ o }) => o.kind === kind)
            if (!items.length) return null
            const groupId = `${listId}-${kind}`
            return (
              <div key={kind} role="group" aria-labelledby={groupId} className="py-1">
                <div id={groupId} role="presentation" className="text-foreground/70 px-3 py-1 text-xs font-semibold tracking-wide uppercase">
                  {title}
                </div>
                {items.map(({ o, i }) => (
                  <div
                    key={`${kind}-${o.label}-${i}`}
                    id={optionId(i)}
                    role="option"
                    aria-selected={i === active}
                    // Keep focus in the input so the list doesn't close before the click lands
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => choose(o)}
                    onMouseEnter={() => setActive(i)}
                    className={cn('flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm', i === active && 'bg-muted')}
                  >
                    <Icon className="text-muted-foreground size-4 shrink-0" aria-hidden />
                    <span className="min-w-0 flex-1 truncate">
                      <Highlight text={o.label} query={typed} />
                    </span>
                    {'detail' in o && o.detail && <span className="text-foreground/70 truncate text-xs">{o.detail}</span>}
                  </div>
                ))}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
