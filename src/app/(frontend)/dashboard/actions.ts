'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { APIError, ValidationError } from 'payload'

import { getCurrentUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import { reportUnexpectedError } from '@/lib/reportError'
import { textToRichText } from '@/lib/richText'
import type { FormState } from '@/lib/validation/auth'
import {
  applicationStatusSchema,
  companySchema,
  jobSchema,
  jobStatusSchema,
  withdrawSchema,
} from '@/lib/validation/dashboard'
import type { User } from '@/payload-types'

// Every action re-checks the session and role, and every write runs as the user
// with access control on, so Payload has the final say on what is allowed.
async function currentEmployer(): Promise<User | null> {
  const user = await getCurrentUser()
  return user && (user.role === 'employer' || user.role === 'admin') ? user : null
}

const errorMessage = (error: unknown, fallback: string) => {
  if (error instanceof ValidationError) return error.data.errors.map((e) => e.message).join(' ')
  if (error instanceof APIError && error.isPublic) return error.message
  reportUnexpectedError(error, 'dashboard action')
  return fallback
}

const formValues = (formData: FormData) =>
  Object.fromEntries([...formData.entries()].filter(([, v]) => typeof v === 'string')) as Record<string, string>

export async function saveCompany(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await currentEmployer()
  if (!user) return { error: 'Only employers can manage a company.' }

  const values = formValues(formData)
  const parsed = companySchema.safeParse({ ...values, logo: formData.get('logo') ?? undefined })
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors, values }
  const { logo, ...fields } = parsed.data

  const payload = await getPayloadClient()
  const asUser = { user, overrideAccess: false } as const
  try {
    let logoId: number | undefined
    if (logo) {
      const media = await payload.create({
        collection: 'media',
        data: { alt: `${fields.name} logo` },
        file: { data: Buffer.from(await logo.arrayBuffer()), mimetype: logo.type, name: logo.name, size: logo.size },
        ...asUser,
      })
      logoId = media.id
    }

    const { docs } = await payload.find({
      collection: 'companies',
      where: { owner: { equals: user.id } },
      limit: 1,
      depth: 0,
      ...asUser,
    })
    const data = { ...fields, ...(logoId ? { logo: logoId } : {}) }
    if (docs[0]) {
      await payload.update({ collection: 'companies', id: docs[0].id, data, ...asUser })
    } else {
      // owner is set to the logged-in user by a hook
      await payload.create({ collection: 'companies', data: { ...data, owner: user.id }, ...asUser })
    }
  } catch (error) {
    return { error: errorMessage(error, 'Could not save your company. Please try again.'), values }
  }

  revalidatePath('/dashboard', 'layout')
  revalidatePath('/companies/[slug]', 'page')
  return { success: 'Company profile saved.' }
}

export async function saveJob(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await currentEmployer()
  if (!user) return { error: 'Only employers can post jobs.' }

  const values = formValues(formData)
  const parsed = jobSchema.safeParse(values)
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors, values }
  const { id, intent, description, ...fields } = parsed.data

  // "Publish" publishes. "Save" creates a draft for a new job and keeps the current status otherwise.
  const status = intent === 'publish' ? ('published' as const) : undefined
  const data = { ...fields, description: textToRichText(description), ...(status ? { status } : {}) }

  const payload = await getPayloadClient()
  const asUser = { user, overrideAccess: false } as const
  try {
    if (id) {
      // Access control only allows updating jobs of the user's own company
      await payload.update({ collection: 'jobs', id, data, ...asUser })
    } else {
      const { docs } = await payload.find({
        collection: 'companies',
        where: { owner: { equals: user.id } },
        limit: 1,
        depth: 0,
        ...asUser,
      })
      if (!docs[0]) return { error: 'Create your company profile before posting a job.', values }
      // The jobs hook re-checks that this company belongs to the user
      await payload.create({
        collection: 'jobs',
        data: { ...data, company: docs[0].id, status: status ?? 'draft' },
        ...asUser,
      })
    }
  } catch (error) {
    return { error: errorMessage(error, 'Could not save the job. Please try again.'), values }
  }

  revalidatePath('/dashboard/jobs')
  redirect('/dashboard/jobs')
}

export async function setJobStatus(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await currentEmployer()
  if (!user) return { error: 'Only employers can change jobs.' }

  const parsed = jobStatusSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Invalid request.' }

  const payload = await getPayloadClient()
  try {
    await payload.update({
      collection: 'jobs',
      id: parsed.data.jobId,
      data: { status: parsed.data.status },
      user,
      overrideAccess: false,
    })
  } catch (error) {
    return { error: errorMessage(error, 'Could not update the job.') }
  }
  revalidatePath('/dashboard/jobs')
  return { success: parsed.data.status === 'published' ? 'Job published.' : 'Job closed.' }
}

export async function updateApplicationStatus(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await currentEmployer()
  if (!user) return { error: 'Only employers can review applications.' }

  const parsed = applicationStatusSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Invalid status.' }

  const payload = await getPayloadClient()
  try {
    // Access control: only the employer who owns the job (or an admin) can update it
    await payload.update({
      collection: 'applications',
      id: parsed.data.applicationId,
      data: { status: parsed.data.status },
      user,
      overrideAccess: false,
    })
  } catch (error) {
    return { error: errorMessage(error, 'Could not update the status.') }
  }
  revalidatePath('/dashboard/jobs/[id]/applicants', 'page')
  return { success: 'Status updated.' }
}

export async function withdrawApplication(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser()
  if (!user || user.role !== 'candidate') return { error: 'Only candidates can withdraw applications.' }

  const parsed = withdrawSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Invalid request.' }

  const payload = await getPayloadClient()
  try {
    // Access control limits this to the candidate's own applications;
    // the guardStatusChange hook only allows "withdrawn" while still applied/reviewing.
    await payload.update({
      collection: 'applications',
      id: parsed.data.applicationId,
      data: { status: 'withdrawn' },
      user,
      overrideAccess: false,
    })
  } catch (error) {
    return { error: errorMessage(error, 'Could not withdraw the application.') }
  }
  revalidatePath('/dashboard/applications')
  revalidatePath('/dashboard')
  return { success: 'Application withdrawn.' }
}
