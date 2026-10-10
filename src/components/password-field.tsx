'use client'

import { Check, Circle, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { passwordChecks } from '@/lib/validation/auth'

type Props = Omit<React.ComponentProps<typeof Input>, 'type'> & {
  label: string
  name: string
  errors?: string[]
  // Show the password rules while the user is typing a new password
  showRules?: boolean
}

// Password input with a show/hide button. Rules appear only when relevant: while the field is
// focused or once something is typed, and they disappear when an error message takes over.
export function PasswordField({ label, name, errors, showRules, onChange, onFocus, onBlur, ...props }: Props) {
  const [visible, setVisible] = useState(false)
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const invalid = Boolean(errors?.length)
  const errorId = `${name}-error`
  const rulesId = `${name}-rules`
  const rulesShown = showRules && !invalid && (focused || value.length > 0)

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <div className="relative">
        <Input
          id={name}
          name={name}
          type={visible ? 'text' : 'password'}
          className="pe-10"
          aria-invalid={invalid || undefined}
          aria-describedby={cn(invalid && errorId, rulesShown && rulesId) || undefined}
          onChange={(e) => {
            setValue(e.target.value)
            onChange?.(e)
          }}
          onFocus={(e) => {
            setFocused(true)
            onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            onBlur?.(e)
          }}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          aria-controls={name}
          className="text-muted-foreground hover:text-foreground absolute inset-y-0 end-0 flex w-10 items-center justify-center rounded-e-lg"
        >
          {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
        </button>
      </div>
      {rulesShown && (
        <ul id={rulesId} className="space-y-1 text-xs" aria-live="polite">
          {passwordChecks(value).map((rule) => (
            <li key={rule.label} className={cn('flex items-center gap-1.5', rule.ok ? 'text-primary' : 'text-muted-foreground')}>
              {rule.ok ? <Check className="size-3.5" aria-hidden /> : <Circle className="size-3.5" aria-hidden />}
              {rule.label}
              <span className="sr-only">{rule.ok ? '(done)' : '(not yet)'}</span>
            </li>
          ))}
        </ul>
      )}
      {invalid && (
        <p id={errorId} className="text-destructive text-sm">
          {errors![0]}
        </p>
      )}
    </div>
  )
}
