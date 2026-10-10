import { z } from 'zod'

const email = z.string().trim().toLowerCase().email('Enter a valid email address.')
export const PASSWORD_MIN = 8
const password = z
  .string()
  .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters.`)
  .max(128, 'Password is too long.')

// Rules shown next to the password field while the user types (same rule as the schema)
export const passwordChecks = (value: string) => [
  { label: `At least ${PASSWORD_MIN} characters`, ok: value.length >= PASSWORD_MIN },
]

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name.').max(100),
  email,
  password,
  // Public signup can never choose "admin"
  role: z.enum(['candidate', 'employer'], { message: 'Choose candidate or employer.' }),
  // A checked checkbox submits "on"; unchecked submits nothing
  terms: z.literal('on', { message: 'Please accept the terms and privacy policy to continue.' }),
})

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password.'),
})

export const forgotPasswordSchema = z.object({ email })

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'This reset link is invalid.'),
    password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })

// Shared shape returned by every auth server action
export type FormState = {
  error?: string
  success?: string
  fieldErrors?: Record<string, string[] | undefined>
  values?: Record<string, string>
}
