import { z } from 'zod'

export const MAX_RESUME_BYTES = 5 * 1024 * 1024

export const applySchema = z.object({
  jobId: z.coerce.number().int().positive(),
  coverLetter: z
    .string()
    .trim()
    .max(5000, 'Cover letter must be 5000 characters or fewer.')
    .optional()
    .transform((v) => v || undefined),
  // The browser-reported type is only a first filter; Payload checks the real file content.
  resume: z
    .instanceof(File, { message: 'Attach your resume as a PDF.' })
    .refine((f) => f.size > 0, 'Attach your resume as a PDF.')
    .refine((f) => f.size <= MAX_RESUME_BYTES, 'Resume must be 5 MB or smaller.')
    .refine((f) => f.type === 'application/pdf', 'Resume must be a PDF file.'),
})
