import { z } from 'zod'

const email = z.string().trim().toLowerCase().email('Enter a valid email address.')
const password = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(128, 'Password is too long.')

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name.').max(100),
  email,
  password,
  // Public signup can never choose "admin"
  role: z.enum(['candidate', 'employer'], { message: 'Choose candidate or employer.' }),
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
