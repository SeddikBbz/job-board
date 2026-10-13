import type { GlobalConfig, Payload } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import { DEFAULT_FREE_EMAIL_DOMAINS, DEFAULT_SPAM_PHRASES } from '@/lib/moderation'

// Settings admins change without a redeploy. Only admins read them (spam rules stay private).
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  access: { read: isAdmin, update: isAdmin },
  admin: { group: 'Settings' },
  fields: [
    {
      name: 'moderation',
      type: 'group',
      fields: [
        {
          name: 'spamPhrases',
          type: 'text',
          hasMany: true,
          defaultValue: DEFAULT_SPAM_PHRASES,
          admin: { description: 'Jobs containing any of these are sent to review with the reason shown.' },
        },
        { name: 'freeEmailDomains', type: 'text', hasMany: true, defaultValue: DEFAULT_FREE_EMAIL_DOMAINS },
        { name: 'dailyJobLimit', type: 'number', defaultValue: 10, min: 1, admin: { description: 'New jobs per company per day.' } },
        { name: 'reportThreshold', type: 'number', defaultValue: 3, min: 1, admin: { description: 'Distinct reports that send a live job back to review.' } },
      ],
    },
    {
      name: 'privacy',
      type: 'group',
      fields: [
        {
          name: 'auditLogRetentionDays',
          type: 'number',
          defaultValue: 1095,
          min: 30,
          admin: { description: 'How long traceability records are kept (deleted resumes, moderation). Confirm with your legal reviewer (law 18-07).' },
        },
      ],
    },
  ],
}

export type ModerationSettings = {
  spamPhrases: string[]
  freeEmailDomains: string[]
  dailyJobLimit: number
  reportThreshold: number
}

// Trusted server read with defaults, so hooks work even before an admin saves the settings
export async function getModerationSettings(payload: Payload): Promise<ModerationSettings> {
  const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0 }).catch(() => null)
  const m = settings?.moderation
  return {
    spamPhrases: m?.spamPhrases?.length ? m.spamPhrases : DEFAULT_SPAM_PHRASES,
    freeEmailDomains: m?.freeEmailDomains?.length ? m.freeEmailDomains : DEFAULT_FREE_EMAIL_DOMAINS,
    dailyJobLimit: m?.dailyJobLimit ?? 10,
    reportThreshold: m?.reportThreshold ?? 3,
  }
}
