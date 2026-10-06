import type { Metadata } from 'next'
import Link from 'next/link'

import { ResetPasswordForm } from '@/components/auth-forms'
import { FormMessage } from '@/components/form'

export const metadata: Metadata = { title: 'Choose a new password' }

type Props = { searchParams: Promise<{ token?: string }> }

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Choose a new password</h1>
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <>
          <FormMessage error="This reset link is missing its token. Please request a new link." />
          <p className="mt-6 text-center text-sm">
            <Link href="/forgot-password" className="text-primary font-medium hover:underline">
              Request a new link
            </Link>
          </p>
        </>
      )}
    </>
  )
}
