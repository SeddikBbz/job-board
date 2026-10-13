import { CheckCircle2, XCircle } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { Container } from '@/components/container'
import { Button } from '@/components/ui/button'
import { confirmEmail } from '@/lib/accountSecurity'
import { getPayloadClient } from '@/lib/payload'

export const metadata: Metadata = { title: 'Confirm your email', robots: { index: false } }

type Props = { searchParams: Promise<{ token?: string }> }

// Landing page of the link in the confirmation email
export default async function VerifyEmailPage({ searchParams }: Props) {
  const { token } = await searchParams
  const user = await confirmEmail(await getPayloadClient(), token ?? '')

  return (
    <Container className="flex flex-1 flex-col items-center justify-center py-24 text-center">
      {user ? (
        <>
          <CheckCircle2 className="text-primary size-12" aria-hidden />
          <h1 className="mt-4 text-2xl font-bold">Your email is confirmed</h1>
          <p className="text-muted-foreground mt-2">Thanks, {user.name}. You can now apply to jobs, post jobs and upload files.</p>
          <Button className="mt-6" asChild>
            <Link href="/dashboard">Go to my dashboard</Link>
          </Button>
        </>
      ) : (
        <>
          <XCircle className="text-destructive size-12" aria-hidden />
          <h1 className="mt-4 text-2xl font-bold">This link doesn&apos;t work anymore</h1>
          <p className="text-muted-foreground mt-2 max-w-md">
            It may have expired or already been used. Log in and use &ldquo;Send a new link&rdquo; on your dashboard.
          </p>
          <Button className="mt-6" variant="outline" asChild>
            <Link href="/dashboard">Go to my dashboard</Link>
          </Button>
        </>
      )}
    </Container>
  )
}
