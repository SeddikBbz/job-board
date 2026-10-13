import type { Metadata } from 'next'

import { LegalPage } from '@/components/legal-page'

export const metadata: Metadata = { title: 'Privacy policy' }
// Refreshed within a minute after an admin edits the page
export const revalidate = 60

export default function PrivacyPage() {
  return <LegalPage slug="privacy" />
}
