'use client'

import { useEffect, useRef, useState } from 'react'
import type { z } from 'zod'

import type { FormState } from '@/lib/validation/auth'

type Shape = Record<string, z.ZodType>

// Inline validation with the same Zod rules the server uses, plus focus management:
// - a field is checked when it loses focus (only if something was typed), and re-checked
//   while typing once it shows an error, so the message disappears as soon as it's fixed;
// - after the server answers, focus moves to the first invalid field (or the error banner).
export function useFormFeedback(shape: Shape, state: FormState) {
  const formRef = useRef<HTMLFormElement>(null)
  // Client messages are tied to the server answer they were made after:
  // a new answer automatically replaces them
  const [client, setClient] = useState<{ after: FormState; errors: Record<string, string[] | undefined> }>({
    after: state,
    errors: {},
  })
  const clientErrors = client.after === state ? client.errors : {}

  useEffect(() => {
    const form = formRef.current
    if (!form) return
    const target =
      form.querySelector<HTMLElement>('[aria-invalid="true"]') ?? (state.error ? form.querySelector<HTMLElement>('[role="alert"]') : null)
    target?.focus()
  }, [state])

  const check = (field: HTMLInputElement) => {
    const rule = shape[field.name]
    if (!rule) return
    const value = field.type === 'checkbox' ? (field.checked ? 'on' : undefined) : field.value
    const result = rule.safeParse(value)
    const message = result.success ? undefined : [result.error.issues[0].message]
    setClient({ after: state, errors: { ...clientErrors, [field.name]: message } })
  }

  const formProps = {
    ref: formRef,
    onBlur: (e: React.FocusEvent<HTMLFormElement>) => {
      // Blur bubbles up from the field that lost focus
      const field = e.target as unknown as HTMLInputElement
      if (field.type === 'checkbox' || field.value) check(field)
    },
    onChange: (e: React.ChangeEvent<HTMLFormElement>) => {
      const field = e.target as unknown as HTMLInputElement
      if (clientErrors[field.name]) check(field)
    },
  }

  // Client message first (fresher), else the server's
  const errorsFor = (name: string) => clientErrors[name] ?? state.fieldErrors?.[name]

  return { formProps, errorsFor }
}
