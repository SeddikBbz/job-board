import type { Metadata } from 'next'
import Link from 'next/link'

import { ForgotPasswordForm } from '@/components/auth-forms'

export const metadata: Metadata = { title: 'Forgot password' }

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">Forgot your password?</h1>
      <p className="text-muted-foreground mt-1 mb-6 text-sm">
        Enter your email and we&apos;ll send you a link to choose a new one.
      </p>
      <ForgotPasswordForm />
      <p className="text-muted-foreground mt-6 text-center text-sm">
        <Link href="/login" className="text-primary font-medium hover:underline">
          Back to log in
        </Link>
      </p>
    </>
  )
}
