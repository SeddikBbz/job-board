'use client'

import { Loader2, X } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { JOB_TYPE_LABELS, WORK_MODE_LABELS } from '@/lib/format'
import { JOB_TYPES, WORK_MODES } from '@/lib/jobFilters'

const FILTER_KEYS = ['q', 'location', 'type', 'mode', 'skills', 'salaryMin', 'sort', 'page']

export function JobFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Every change writes to the URL; the Server Component re-renders from it.
  const setParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    if (key !== 'page') params.delete('page') // new filters start at page 1
    startTransition(() => router.push(`${pathname}?${params}`, { scroll: false }))
  }

  const toggleInList = (key: string, value: string) => {
    const current = (searchParams.get(key) ?? '').split(',').filter(Boolean)
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
    setParam(key, next.join(','))
  }

  const hasFilters = FILTER_KEYS.some((k) => k !== 'sort' && k !== 'page' && searchParams.has(k))

  return (
    <aside className="space-y-6" aria-label="Job filters">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Filters</h2>
        {isPending && <Loader2 className="text-muted-foreground size-4 animate-spin" aria-label="Updating results" />}
      </div>

      <DebouncedInput label="Keywords" name="q" placeholder="Title, company, skill…" onCommit={setParam} />
      <DebouncedInput label="Location" name="location" placeholder="Algiers, Remote…" onCommit={setParam} />

      <CheckboxGroup
        legend="Job type"
        options={JOB_TYPES.map((t) => ({ value: t, label: JOB_TYPE_LABELS[t] }))}
        selected={(searchParams.get('type') ?? '').split(',')}
        onToggle={(v) => toggleInList('type', v)}
      />
      <CheckboxGroup
        legend="Work mode"
        options={WORK_MODES.map((m) => ({ value: m, label: WORK_MODE_LABELS[m] }))}
        selected={(searchParams.get('mode') ?? '').split(',')}
        onToggle={(v) => toggleInList('mode', v)}
      />

      <DebouncedInput label="Skills" name="skills" placeholder="react, python" onCommit={setParam} />
      <DebouncedInput
        label="Minimum salary"
        name="salaryMin"
        type="number"
        inputMode="numeric"
        min={0}
        placeholder="e.g. 100000"
        onCommit={setParam}
      />

      <div className="space-y-2">
        <Label htmlFor="sort">Sort by</Label>
        <Select value={searchParams.get('sort') ?? 'newest'} onValueChange={(v) => setParam('sort', v === 'newest' ? null : v)}>
          <SelectTrigger id="sort" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="salary-desc">Highest salary</SelectItem>
            <SelectItem value="salary-asc">Lowest salary</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasFilters && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => startTransition(() => router.push(pathname, { scroll: false }))}
        >
          <X aria-hidden /> Clear filters
        </Button>
      )}
    </aside>
  )
}

type DebouncedInputProps = Omit<React.ComponentProps<typeof Input>, 'name' | 'value' | 'onChange'> & {
  label: string
  name: string
  onCommit: (name: string, value: string | null) => void
}

// Local state while typing; pushes to the URL 400 ms after the user stops.
function DebouncedInput({ label, name, onCommit, ...props }: DebouncedInputProps) {
  const searchParams = useSearchParams()
  const urlValue = searchParams.get(name) ?? ''
  const [value, setValue] = useState(urlValue)
  const lastPushed = useRef(urlValue)

  // Follow external URL changes (back button, "clear filters") but not our own pushes
  useEffect(() => {
    if (urlValue !== lastPushed.current) {
      lastPushed.current = urlValue
      setValue(urlValue)
    }
  }, [urlValue])

  useEffect(() => {
    if (value === lastPushed.current) return
    const timer = setTimeout(() => {
      lastPushed.current = value
      onCommit(name, value.trim() || null)
    }, 400)
    return () => clearTimeout(timer)
  }, [value, name, onCommit])

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} value={value} onChange={(e) => setValue(e.target.value)} {...props} />
    </div>
  )
}

type CheckboxGroupProps = {
  legend: string
  options: { value: string; label: string }[]
  selected: string[]
  onToggle: (value: string) => void
}

function CheckboxGroup({ legend, options, selected, onToggle }: CheckboxGroupProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-sm font-medium">{legend}</legend>
      {options.map((option) => (
        <label key={option.value} className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="accent-primary size-4"
            checked={selected.includes(option.value)}
            onChange={() => onToggle(option.value)}
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  )
}
