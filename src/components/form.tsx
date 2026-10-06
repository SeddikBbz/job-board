import { AlertCircle, CheckCircle2 } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type FieldProps = React.ComponentProps<typeof Input> & {
  label: string
  name: string
  errors?: string[]
  hint?: string
}

// Label + input + error, wired with aria attributes so screen readers announce errors.
export function FormField({ label, name, errors, hint, className, ...props }: FieldProps) {
  const errorId = `${name}-error`
  const hintId = `${name}-hint`
  const invalid = Boolean(errors?.length)
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        aria-invalid={invalid || undefined}
        aria-describedby={cn(invalid && errorId, hint && hintId) || undefined}
        className={className}
        {...props}
      />
      {hint && !invalid && (
        <p id={hintId} className="text-muted-foreground text-xs">
          {hint}
        </p>
      )}
      {invalid && (
        <p id={errorId} className="text-destructive text-sm">
          {errors![0]}
        </p>
      )}
    </div>
  )
}

export function FormMessage({ error, success }: { error?: string; success?: string }) {
  if (!error && !success) return null
  return (
    <div
      role={error ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-2 rounded-lg border px-3 py-2 text-sm',
        error ? 'border-destructive/30 bg-destructive/5 text-destructive' : 'border-emerald-600/30 bg-emerald-50 text-emerald-800',
      )}
    >
      {error ? <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />}
      <span>{error ?? success}</span>
    </div>
  )
}
