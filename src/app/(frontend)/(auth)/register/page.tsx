import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { RegisterForm } from '@/components/auth-forms'
import { getCurrentUser, safeRedirectPath } from '@/lib/auth'
import { getTurnstileSiteKey } from '@/lib/turnstile'

export const metadata: Metadata = { title: 'Create an account' }

type Props = { searchParams: Promise<{ next?: string; role?: string }> }

export default async function RegisterPage({ searchParams }: Props) {
  const { next, role } = await searchParams
  const target = safeRedirectPath(next)
  if (await getCurrentUser()) redirect(target)

  return (
    <>
      <h1 className="text-2xl font-bold">Create your account</h1>
      <p className="text-muted-foreground mt-1 mb-6 text-sm">It takes less than a minute.</p>
      <RegisterForm siteKey={getTurnstileSiteKey()} next={target} initialRole={role === 'employer' ? 'employer' : 'candidate'} />
      <p className="text-muted-foreground mt-6 text-center text-sm">
        Already have an account?{' '}
        <Link href={next ? `/login?next=${encodeURIComponent(target)}` : '/login'} className="text-primary font-medium hover:underline">
          Log in
        </Link>
      </p>
    </>
  )
}
