'use client'

import { ChevronDown, Search, X } from 'lucide-react'
import { useId, useMemo, useState } from 'react'

import { normalizeText } from '@/lib/normalize'
import { cn } from '@/lib/utils'

export type SkillOption = { id: number; name: string; categories: number[]; aliases: string[]; popular: boolean }
export type CategoryOption = { id: number; name: string }

type Props = {
  name: string
  label: string
  skills: SkillOption[]
  categories: CategoryOption[]
  defaultValue?: number[]
  max?: number
  error?: string
}

// Multi-select for skills: searchable (names and aliases, any accent or case), grouped by
// category in collapsible sections, popular skills first. Chosen skills are sent as repeated
// hidden inputs, so the surrounding form submits them like any other field.
export function SkillPicker({ name, label, skills, categories, defaultValue = [], max = 15, error }: Props) {
  const id = useId()
  const [selected, setSelected] = useState<number[]>(defaultValue)
  const [query, setQuery] = useState('')
  const byId = useMemo(() => new Map(skills.map((s) => [s.id, s])), [skills])
  const full = selected.length >= max

  const toggle = (skillId: number) =>
    setSelected((prev) => (prev.includes(skillId) ? prev.filter((x) => x !== skillId) : prev.length >= max ? prev : [...prev, skillId]))

  const q = normalizeText(query)
  const matches = (s: SkillOption) => !q || [s.name, ...s.aliases].some((v) => normalizeText(v).includes(q))
  const popular = skills.filter((s) => s.popular && matches(s))
  const groups = categories
    .map((c) => ({ ...c, items: skills.filter((s) => s.categories.includes(c.id) && matches(s)) }))
    .filter((g) => g.items.length)

  const option = (s: SkillOption) => {
    const checked = selected.includes(s.id)
    return (
      <label
        key={s.id}
        className={cn(
          'has-[:focus-visible]:ring-ring inline-flex cursor-pointer items-center rounded-full border px-3 py-1 text-sm transition-colors has-[:focus-visible]:ring-2',
          checked ? 'border-primary bg-primary text-primary-foreground' : 'hover:border-primary/50',
          !checked && full && 'cursor-not-allowed opacity-50',
        )}
      >
        <input type="checkbox" className="sr-only" checked={checked} disabled={!checked && full} onChange={() => toggle(s.id)} />
        {s.name}
      </label>
    )
  }

  return (
    <fieldset className="space-y-3" aria-describedby={`${id}-count${error ? ` ${id}-error` : ''}`} data-testid="skill-picker">
      <legend className="text-sm font-medium">{label}</legend>

      {selected.map((skillId) => (
        <input key={skillId} type="hidden" name={name} value={skillId} />
      ))}

      <div className="flex min-h-9 flex-wrap items-center gap-2" aria-live="polite">
        {selected.length === 0 && <span className="text-muted-foreground text-sm">No skills selected yet.</span>}
        {selected.map((skillId) => (
          <span key={skillId} className="bg-secondary text-secondary-foreground inline-flex items-center gap-1 rounded-full py-1 ps-3 pe-1 text-sm font-medium">
            {byId.get(skillId)?.name}
            <button type="button" onClick={() => toggle(skillId)} aria-label={`Remove ${byId.get(skillId)?.name}`} className="hover:bg-background/60 rounded-full p-0.5">
              <X className="size-3.5" aria-hidden />
            </button>
          </span>
        ))}
      </div>
      <p id={`${id}-count`} className="text-muted-foreground text-xs">
        {selected.length} of {max} selected{full ? ' (maximum reached)' : ''}
      </p>

      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search skills, e.g. react, sql, figma"
          aria-label="Search skills"
          className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-lg border bg-transparent ps-8 pe-3 text-sm outline-none focus-visible:ring-3"
        />
      </div>

      <div className="max-h-80 space-y-2 overflow-y-auto rounded-lg border p-3">
        {popular.length > 0 && !q && (
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Popular</p>
            <div className="flex flex-wrap gap-2">{popular.map(option)}</div>
          </div>
        )}
        {groups.map((g) => (
          // Searching opens every matching group; otherwise groups start closed
          <details key={`${g.id}-${q ? 'open' : 'closed'}`} open={Boolean(q)} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between rounded-md py-1.5 text-sm font-medium">
              {g.name} <span className="text-muted-foreground text-xs">({g.items.length})</span>
              <ChevronDown className="ms-auto size-4 transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <div className="flex flex-wrap gap-2 pt-2 pb-1">{g.items.map(option)}</div>
          </details>
        ))}
        {groups.length === 0 && <p className="text-muted-foreground text-sm">No skill matches “{query}”.</p>}
      </div>

      {error && (
        <p id={`${id}-error`} className="text-destructive text-sm">
          {error}
        </p>
      )}
    </fieldset>
  )
}
