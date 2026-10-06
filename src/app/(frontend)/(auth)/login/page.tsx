import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { LoginForm } from '@/components/auth-forms'
import { getCurrentUser, safeRedirectPath } from '@/lib/auth'
import { getTurnstileSiteKey } from '@/lib/turnstile'

export const metadata: Metadata = { title: 'Log in' }

type Props = { searchParams: Promise<{ next?: string }> }

export default async function LoginPage({ searchParams }: Props) {
  const { next } = await searchParams
  const target = safeRedirectPath(next)
  if (await getCurrentUser()) redirect(target)

  return (
    <>
      <h1 className="text-2xl font-bold">Welcome back</h1>
      <p className="text-muted-foreground mt-1 mb-6 text-sm">Log in to apply to jobs and manage your account.</p>
      <LoginForm siteKey={getTurnstileSiteKey()} next={target} />
      <p className="text-muted-foreground mt-6 text-center text-sm">
        New here?{' '}
        <Link href="/register" className="text-primary font-medium hover:underline">
          Create an account
        </Link>
      </p>
    </>
  )
}
