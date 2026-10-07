import { describe, expect, it } from 'vitest'

import { applySchema, MAX_RESUME_BYTES } from '@/lib/validation/application'
import { loginSchema, registerSchema, resetPasswordSchema } from '@/lib/validation/auth'
import { companySchema, jobSchema } from '@/lib/validation/dashboard'

const pdf = (size = 100, type = 'application/pdf') => new File([new Uint8Array(size)], 'cv.pdf', { type })
const future = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10)
const past = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10)

describe('registerSchema', () => {
  const valid = { name: 'Lina', email: ' Lina@Example.COM ', password: 'longenough', role: 'candidate' }

  it('accepts a valid signup and normalises the email', () => {
    expect(registerSchema.parse(valid).email).toBe('lina@example.com')
  })

  it('never accepts the admin role', () => {
    expect(registerSchema.safeParse({ ...valid, role: 'admin' }).success).toBe(false)
  })

  it('requires an 8+ character password', () => {
    expect(registerSchema.safeParse({ ...valid, password: 'short' }).success).toBe(false)
  })

  it('rejects an invalid email', () => {
    expect(loginSchema.safeParse({ email: 'nope', password: 'x' }).success).toBe(false)
  })
})

describe('resetPasswordSchema', () => {
  it('requires matching passwords', () => {
    const result = resetPasswordSchema.safeParse({ token: 't', password: 'password1', confirmPassword: 'password2' })
    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.confirmPassword).toBeDefined()
  })
})

describe('applySchema', () => {
  it('accepts a small PDF and an optional cover letter', () => {
    const parsed = applySchema.parse({ jobId: '12', coverLetter: '  ', resume: pdf() })
    expect(parsed.jobId).toBe(12)
    expect(parsed.coverLetter).toBeUndefined()
  })

  it('rejects a missing, non-PDF or too large file', () => {
    expect(applySchema.safeParse({ jobId: 1, resume: null }).success).toBe(false)
    expect(applySchema.safeParse({ jobId: 1, resume: pdf(100, 'image/png') }).success).toBe(false)
    expect(applySchema.safeParse({ jobId: 1, resume: pdf(MAX_RESUME_BYTES + 1) }).success).toBe(false)
    expect(applySchema.safeParse({ jobId: 1, resume: pdf(0) }).success).toBe(false)
  })

  it('limits the cover letter to 5000 characters', () => {
    expect(applySchema.safeParse({ jobId: 1, resume: pdf(), coverLetter: 'x'.repeat(5001) }).success).toBe(false)
  })
})

describe('jobSchema', () => {
  const base = { title: 'Backend Developer', description: 'A description that is long enough.' }

  it('turns empty optional fields into undefined and normalises skills', () => {
    const parsed = jobSchema.parse({ ...base, salaryMin: '', jobType: '', skills: 'Go, go , Kubernetes,' })
    expect(parsed.salaryMin).toBeUndefined()
    expect(parsed.jobType).toBeUndefined()
    expect(parsed.skills).toEqual(['go', 'kubernetes'])
  })

  it('requires salaryMax >= salaryMin', () => {
    const result = jobSchema.safeParse({ ...base, salaryMin: '5000', salaryMax: '1000' })
    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.salaryMax).toBeDefined()
  })

  it('requires a future expiry date only when publishing', () => {
    expect(jobSchema.safeParse({ ...base, intent: 'publish', expiresAt: past }).success).toBe(false)
    expect(jobSchema.safeParse({ ...base, intent: 'save', expiresAt: past }).success).toBe(true)
    expect(jobSchema.safeParse({ ...base, intent: 'publish', expiresAt: future }).success).toBe(true)
  })

  it('expires at the end of the chosen day (UTC)', () => {
    expect(jobSchema.parse({ ...base, expiresAt: '2030-01-15' }).expiresAt).toBe('2030-01-15T23:59:59.000Z')
  })
})

describe('companySchema', () => {
  it('requires a full URL for the website', () => {
    expect(companySchema.safeParse({ name: 'Acme', website: 'acme.com' }).success).toBe(false)
    expect(companySchema.safeParse({ name: 'Acme', website: 'https://acme.com' }).success).toBe(true)
  })
})
