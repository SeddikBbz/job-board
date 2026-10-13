import { normalizeText } from '@/lib/normalize'

export type JobStatus = 'draft' | 'pending_review' | 'published' | 'closed' | 'rejected'

// Edits that change what candidates read. Changing them on a live job from an untrusted
// company sends it back to review. (Salary, dates or skills don't.)
export const MATERIAL_FIELDS = ['title', 'description', 'company'] as const

export function isMaterialEdit(original: Record<string, unknown> | undefined, data: Record<string, unknown>): boolean {
  if (!original) return false
  return MATERIAL_FIELDS.some((field) => field in data && JSON.stringify(data[field]) !== JSON.stringify(original[field]))
}

type Decision = {
  requested?: JobStatus
  previous?: JobStatus
  isAdmin: boolean
  trusted: boolean
  flagged: boolean
  materialEdit: boolean
}

/**
 * The status a job really gets. Admins (and system code) get what they ask for. Employers can
 * draft, close or ask to publish; "publish" goes live directly only for a trusted company whose
 * job raised no spam flag, otherwise it waits for review. Employers can never approve or reject.
 */
export function decideJobStatus({ requested, previous, isAdmin, trusted, flagged, materialEdit }: Decision): JobStatus {
  if (isAdmin) return requested ?? previous ?? 'draft'
  if (requested === 'pending_review' || requested === 'rejected') return previous ?? 'draft'

  const canGoLive = trusted && !flagged
  if (requested === 'published') {
    // Re-saving an already live job keeps it live unless the edit needs a new review
    if (previous === 'published' && !materialEdit) return 'published'
    return canGoLive ? 'published' : 'pending_review'
  }
  if (requested) return requested // draft or closed
  if (previous === 'published' && materialEdit && !canGoLive) return 'pending_review'
  return previous ?? 'draft'
}

// ---------- automatic spam checks ----------

export const DEFAULT_SPAM_PHRASES = [
  'pay to apply',
  'application fee',
  'registration fee',
  'send money',
  'western union',
  'moneygram',
  'bitcoin',
  'crypto investment',
  'work from home and earn',
  'no experience needed earn',
  'whatsapp only',
]
export const DEFAULT_FREE_EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'yahoo.fr', 'hotmail.com', 'hotmail.fr', 'outlook.com', 'live.com', 'aol.com', 'icloud.com', 'mail.ru', 'gmx.com']
export const MIN_DESCRIPTION_LENGTH = 80
export const MAX_LINKS = 3

type SpamInput = {
  title: string
  description: string
  employerEmail?: string | null
  phrases: string[]
  freeEmailDomains: string[]
}

// Returns human-readable reasons. A flagged job is never deleted: it waits for a moderator,
// who sees exactly why it was flagged.
export function spamFlags({ title, description, employerEmail, phrases, freeEmailDomains }: SpamInput): string[] {
  const flags: string[] = []
  const text = normalizeText(`${title} ${description}`)
  for (const phrase of phrases) {
    if (phrase.trim() && text.includes(normalizeText(phrase))) flags.push(`Suspicious phrase: "${phrase}"`)
  }
  const links = description.match(/https?:\/\/|www\./gi)?.length ?? 0
  if (links > MAX_LINKS) flags.push(`Too many links (${links})`)
  if (description.trim().length < MIN_DESCRIPTION_LENGTH) flags.push(`Very short description (under ${MIN_DESCRIPTION_LENGTH} characters)`)
  const domain = employerEmail?.split('@')[1]?.toLowerCase()
  if (domain && freeEmailDomains.map((d) => d.toLowerCase()).includes(domain)) flags.push(`Employer uses a free email address (${domain})`)
  return flags
}

// Two titles count as the same job when they match after normalizing (case, accents, spaces)
export const sameTitle = (a: string, b: string) => normalizeText(a) === normalizeText(b)

export const DUPLICATE_WINDOW_DAYS = 7
