import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { RegisterForm } from '@/components/auth-forms'
import { getCurrentUser } from '@/lib/auth'
import { getTurnstileSiteKey } from '@/lib/turnstile'

export const metadata: Metadata = { title: 'Create an account' }

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect('/dashboard')

  return (
    <>
      <h1 className="text-2xl font-bold">Create your account</h1>
      <p className="text-muted-foreground mt-1 mb-6 text-sm">It takes less than a minute.</p>
      <RegisterForm siteKey={getTurnstileSiteKey()} />
      <p className="text-muted-foreground mt-6 text-center text-sm">
        Already have an account?{' '}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Log in
        </Link>
      </p>
    </>
  )
}
