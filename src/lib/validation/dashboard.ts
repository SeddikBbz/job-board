import { z } from 'zod'

import { JOB_TYPES, WORK_MODES } from '@/lib/jobFilters'

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || undefined)

const optionalNumber = z
  .union([z.literal(''), z.coerce.number().int().min(0, 'Must be 0 or more.')])
  .optional()
  .transform((v) => (v === '' || v === undefined ? undefined : v))

export const MAX_LOGO_BYTES = 2 * 1024 * 1024

export const companySchema = z.object({
  name: z.string().trim().min(2, 'Enter the company name.').max(120),
  website: z
    .union([z.literal(''), z.string().trim().url('Enter a full URL, e.g. https://example.com')])
    .optional()
    .transform((v) => v || undefined),
  location: optionalText(120),
  description: optionalText(3000),
  size: z
    .union([z.literal(''), z.enum(['1-10', '11-50', '51-200', '201-1000', '1000+'])])
    .optional()
    .transform((v) => v || undefined),
  logo: z
    .instanceof(File)
    .optional()
    .transform((f) => (f && f.size > 0 ? f : undefined))
    .refine((f) => !f || f.type.startsWith('image/'), 'Logo must be an image.')
    .refine((f) => !f || f.size <= MAX_LOGO_BYTES, 'Logo must be 2 MB or smaller.'),
})

export const jobSchema = z
  .object({
    id: z.coerce.number().int().positive().optional().catch(undefined),
    intent: z.enum(['save', 'publish']).catch('save'),
    title: z.string().trim().min(3, 'Enter a job title.').max(150),
    description: z.string().trim().min(20, 'Describe the job in at least 20 characters.').max(20000),
    location: optionalText(120),
    jobType: z.union([z.literal(''), z.enum(JOB_TYPES)]).optional().transform((v) => v || undefined),
    workMode: z.union([z.literal(''), z.enum(WORK_MODES)]).optional().transform((v) => v || undefined),
    salaryMin: optionalNumber,
    salaryMax: optionalNumber,
    salaryCurrency: z.union([z.literal(''), z.enum(['DZD', 'EUR', 'USD'])]).optional().transform((v) => v || undefined),
    skills: z
      .string()
      .optional()
      .transform((v) =>
        [...new Set((v ?? '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean))].slice(0, 15),
      ),
    // <input type="date"> gives "YYYY-MM-DD"; the job expires at the end of that day (UTC)
    expiresAt: z
      .string()
      .optional()
      .transform((v) => (v ? new Date(`${v}T23:59:59.000Z`).toISOString() : undefined)),
  })
  .refine((d) => d.salaryMin == null || d.salaryMax == null || d.salaryMax >= d.salaryMin, {
    message: 'Maximum salary must be greater than or equal to minimum salary.',
    path: ['salaryMax'],
  })
  .refine((d) => d.intent !== 'publish' || !d.expiresAt || new Date(d.expiresAt) > new Date(), {
    message: 'Expiry date must be in the future to publish.',
    path: ['expiresAt'],
  })

export const APPLICATION_STATUSES = ['applied', 'reviewing', 'interview', 'rejected', 'hired'] as const

export const applicationStatusSchema = z.object({
  applicationId: z.coerce.number().int().positive(),
  status: z.enum(APPLICATION_STATUSES),
})

export const jobStatusSchema = z.object({
  jobId: z.coerce.number().int().positive(),
  status: z.enum(['published', 'closed']),
})

export const withdrawSchema = z.object({
  applicationId: z.coerce.number().int().positive(),
})
