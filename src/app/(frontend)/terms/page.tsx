import type { Metadata } from 'next'

import { LegalPage } from '@/components/legal-page'

export const metadata: Metadata = { title: 'Terms of use' }
// Refreshed within a minute after an admin edits the page
export const revalidate = 60

export default function TermsPage() {
  return <LegalPage slug="terms" />
}
