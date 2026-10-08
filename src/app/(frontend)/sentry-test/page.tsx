import { notFound } from 'next/navigation'

import { getCurrentUser } from '@/lib/auth'

// Temporary page to check that Sentry receives errors. Remove it after the test.
// Only admins can trigger the error; everyone else gets a 404.
export const dynamic = 'force-dynamic'

export default async function SentryTestPage() {
  const user = await getCurrentUser()
  if (user?.role !== 'admin') notFound()

  throw new Error(`Sentry test error (${new Date().toISOString()})`)
}
