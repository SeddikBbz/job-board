import type { Metadata } from 'next'
import Link from 'next/link'

import { CompanyLogo } from '@/components/company-logo'
import { CompanyForm } from '@/components/dashboard-forms'
import { getMyCompany, requireRole } from '@/lib/dashboard'

export const metadata: Metadata = { title: 'Company profile' }

export default async function CompanyProfilePage() {
  const user = await requireRole(['employer'], '/dashboard/company')
  const company = await getMyCompany(user)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {company && <CompanyLogo company={company} size={56} />}
        <div>
          <h1 className="text-2xl font-bold">{company ? 'Company profile' : 'Create your company'}</h1>
          {company?.slug && (
            <Link href={`/companies/${company.slug}`} className="text-primary text-sm hover:underline">
              View public page
            </Link>
          )}
        </div>
      </div>
      <CompanyForm
        defaults={{
          name: company?.name,
          website: company?.website ?? undefined,
          location: company?.location ?? undefined,
          description: company?.description ?? undefined,
          size: company?.size ?? undefined,
        }}
      />
    </div>
  )
}
