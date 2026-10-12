'use client'

import { Loader2 } from 'lucide-react'
import { useActionState } from 'react'

import {
  saveCompany,
  saveJob,
  setJobStatus,
  updateApplicationStatus,
} from '@/app/(frontend)/dashboard/actions'
import { FormField, FormMessage } from '@/components/form'
import { ImageUpload } from '@/components/image-upload'
import { SkillPicker } from '@/components/skill-picker'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { JOB_TYPE_LABELS, WORK_MODE_LABELS } from '@/lib/format'
import { JOB_TYPES, WORK_MODES } from '@/lib/jobFilters'
import type { Taxonomy } from '@/lib/queries'
import type { FormState } from '@/lib/validation/auth'
import { APPLICATION_STATUSES, EXPERIENCE_LEVELS, CONTENT_LANGUAGES } from '@/lib/validation/dashboard'

const selectClass =
  'border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border bg-transparent px-2.5 text-sm outline-none focus-visible:ring-3'
const textareaClass =
  'border-input focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-3'

type SelectOption = { value: string; label: string }

function Select({ label, name, options, groups, defaultValue, errors }: {
  label: string
  name: string
  options?: SelectOption[]
  // Grouped options (<optgroup>) instead of a flat list
  groups?: { label: string; options: SelectOption[] }[]
  defaultValue?: string
  errors?: string[]
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue ?? ''}
        className={selectClass}
        aria-invalid={Boolean(errors) || undefined}
        aria-describedby={errors ? `${name}-error` : undefined}
      >
        <option value="">—</option>
        {options?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
        {groups?.map((g) => (
          <optgroup key={g.label} label={g.label}>
            {g.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {errors && (
        <p id={`${name}-error`} className="text-destructive text-sm">
          {errors[0]}
        </p>
      )}
    </div>
  )
}

function Textarea({ label, name, defaultValue, errors, rows = 6, hint }: {
  label: string
  name: string
  defaultValue?: string
  errors?: string[]
  rows?: number
  hint?: string
}) {
  // Screen readers announce the error (or hint) together with the field
  const describedBy = errors ? `${name}-error` : hint ? `${name}-hint` : undefined
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <textarea
        id={name}
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        className={textareaClass}
        aria-invalid={Boolean(errors) || undefined}
        aria-describedby={describedBy}
      />
      {hint && !errors && (
        <p id={`${name}-hint`} className="text-muted-foreground text-xs">
          {hint}
        </p>
      )}
      {errors && (
        <p id={`${name}-error`} className="text-destructive text-sm">
          {errors[0]}
        </p>
      )}
    </div>
  )
}

// ---------- company ----------

export type CompanyDefaults = {
  name?: string
  website?: string
  location?: string
  description?: string
  size?: string
  logoUrl?: string | null
}

export function CompanyForm({ defaults }: { defaults: CompanyDefaults }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveCompany, {})
  const v = { ...defaults, ...state.values }
  const e = state.fieldErrors ?? {}
  return (
    <form action={action} className="bg-card max-w-2xl space-y-4 rounded-xl border p-6 sm:p-8" noValidate>
      <FormMessage error={state.error} success={state.success} />
      <FormField label="Company name" name="name" required defaultValue={v.name} errors={e.name} />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Website" name="website" type="url" placeholder="https://" defaultValue={v.website} errors={e.website} />
        <FormField label="Location" name="location" defaultValue={v.location} errors={e.location} />
      </div>
      <Select
        label="Company size"
        name="size"
        defaultValue={v.size}
        errors={e.size}
        options={['1-10', '11-50', '51-200', '201-1000', '1000+'].map((s) => ({ value: s, label: `${s} employees` }))}
      />
      <Textarea label="About the company" name="description" defaultValue={v.description} errors={e.description} />
      <ImageUpload name="logo" label="Logo" currentSrc={defaults.logoUrl} error={e.logo?.[0]} />
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="animate-spin" aria-hidden />}
        Save company
      </Button>
    </form>
  )
}

// ---------- job ----------

export type JobDefaults = {
  id?: number
  status?: string
  title?: string
  description?: string
  location?: string
  jobType?: string
  workMode?: string
  salaryMin?: string
  salaryMax?: string
  salaryCurrency?: string
  // Comma-separated skill ids, and the city id (strings, like every other form value)
  skills?: string
  city?: string
  experienceLevel?: string
  contentLanguage?: string
  expiresAt?: string
}

// City dropdown: Remote first, then Algeria (wilayas and cities A-Z), then other countries
function cityGroups(locations: Taxonomy['locations']) {
  const toOption = (l: Taxonomy['locations'][number]) => ({ value: String(l.id), label: l.name })
  const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name)
  return [
    { label: 'Remote', options: locations.filter((l) => l.isRemote).map(toOption) },
    { label: 'Algeria', options: locations.filter((l) => l.country === 'Algeria').sort(byName).map(toOption) },
    { label: 'Other countries', options: locations.filter((l) => !l.isRemote && l.country !== 'Algeria').sort(byName).map(toOption) },
  ]
}

export function JobForm({ defaults, taxonomy }: { defaults: JobDefaults; taxonomy: Taxonomy }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveJob, {})
  const v = { ...defaults, ...state.values }
  const e = state.fieldErrors ?? {}
  const isNew = !defaults.id
  return (
    <form action={action} className="bg-card max-w-3xl space-y-4 rounded-xl border p-6 sm:p-8" noValidate>
      <FormMessage error={state.error} />
      {defaults.id && <input type="hidden" name="id" value={defaults.id} />}
      <FormField label="Job title" name="title" required defaultValue={v.title} errors={e.title} />
      <Textarea
        label="Description"
        name="description"
        rows={10}
        defaultValue={v.description}
        errors={e.description}
        hint="Leave a blank line between paragraphs."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="City" name="city" defaultValue={v.city} errors={e.city} groups={cityGroups(taxonomy.locations)} />
        <FormField label="Location details" name="location" placeholder="e.g. Hydra, or a city not in the list" defaultValue={v.location} errors={e.location} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Job type" name="jobType" defaultValue={v.jobType} errors={e.jobType} options={JOB_TYPES.map((t) => ({ value: t, label: JOB_TYPE_LABELS[t] }))} />
        <Select label="Work mode" name="workMode" defaultValue={v.workMode} errors={e.workMode} options={WORK_MODES.map((m) => ({ value: m, label: WORK_MODE_LABELS[m] }))} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label="Minimum salary" name="salaryMin" type="number" min={0} defaultValue={v.salaryMin} errors={e.salaryMin} />
        <FormField label="Maximum salary" name="salaryMax" type="number" min={0} defaultValue={v.salaryMax} errors={e.salaryMax} />
        <Select label="Currency" name="salaryCurrency" defaultValue={v.salaryCurrency} errors={e.salaryCurrency} options={['DZD', 'EUR', 'USD'].map((c) => ({ value: c, label: c }))} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Select label="Experience level" name="experienceLevel" defaultValue={v.experienceLevel} errors={e.experienceLevel} options={EXPERIENCE_LEVELS.map((l) => ({ value: l.value, label: l.label }))} />
        <Select label="Posting language" name="contentLanguage" defaultValue={v.contentLanguage ?? 'en'} errors={e.contentLanguage} options={CONTENT_LANGUAGES.map((l) => ({ value: l.value, label: l.label }))} />
        <FormField label="Expires on" name="expiresAt" type="date" defaultValue={v.expiresAt} errors={e.expiresAt} />
      </div>
      <SkillPicker
        // Re-mount with the submitted values after a failed save
        key={v.skills ?? ''}
        name="skills"
        label="Skills"
        skills={taxonomy.skills}
        categories={taxonomy.categories}
        defaultValue={(v.skills ?? '').split(',').filter(Boolean).map(Number)}
        error={e.skills?.[0]}
      />
      <div className="flex flex-wrap gap-2 pt-2">
        <Button type="submit" name="intent" value="save" variant={isNew || defaults.status !== 'draft' ? 'default' : 'outline'} disabled={pending}>
          {pending && <Loader2 className="animate-spin" aria-hidden />}
          {isNew ? 'Save as draft' : 'Save changes'}
        </Button>
        {(isNew || defaults.status === 'draft') && (
          <Button type="submit" name="intent" value="publish" disabled={pending}>
            Publish
          </Button>
        )}
      </div>
    </form>
  )
}

// ---------- small inline actions ----------

export function JobStatusButton({ jobId, status, label }: { jobId: number; status: 'published' | 'closed'; label: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(setJobStatus, {})
  return (
    <form action={action} className="inline-flex flex-col items-start gap-1">
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="status" value={status} />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending && <Loader2 className="animate-spin" aria-hidden />}
        {label}
      </Button>
      {state.error && (
        <p role="alert" className="text-destructive max-w-56 text-xs">
          {state.error}
        </p>
      )}
    </form>
  )
}

export function ApplicationStatusForm({ applicationId, status }: { applicationId: number; status: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateApplicationStatus, {})
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="applicationId" value={applicationId} />
      <label htmlFor={`status-${applicationId}`} className="sr-only">
        Application status
      </label>
      <select
        id={`status-${applicationId}`}
        name="status"
        defaultValue={status}
        className={`${selectClass} w-36 capitalize`}
        // Submit right away when the employer picks a new status
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        {APPLICATION_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      {pending && <Loader2 className="text-muted-foreground size-4 animate-spin" aria-label="Saving" />}
      {state.error && <span role="alert" className="text-destructive text-xs">{state.error}</span>}
      {state.success && !pending && <span role="status" className="text-xs text-emerald-700">Saved</span>}
    </form>
  )
}
