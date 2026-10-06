import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { JobForm } from '@/components/dashboard-forms'
import { getMyCompany, requireRole } from '@/lib/dashboard'

export const metadata: Metadata = { title: 'Post a job' }

export default async function NewJobPage() {
  const user = await requireRole(['employer'], '/dashboard/jobs/new')
  if (!(await getMyCompany(user))) redirect('/dashboard/company')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Post a job</h1>
      <JobForm defaults={{}} />
    </div>
  )
}
