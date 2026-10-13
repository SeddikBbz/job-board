import { describe, expect, it } from 'vitest'

import { isVerified } from '@/access/isVerified'
import {
  decideJobStatus,
  DEFAULT_FREE_EMAIL_DOMAINS,
  DEFAULT_SPAM_PHRASES,
  isMaterialEdit,
  sameTitle,
  spamFlags,
} from '@/lib/moderation'
import { randomCode, randomToken, sameHash, sha256 } from '@/lib/tokens'

const clean = {
  title: 'Frontend Developer',
  description: 'Join our product team to build fast, accessible web apps with React and TypeScript. Hybrid in Algiers.',
  employerEmail: 'hr@atlas-digital.dz',
  phrases: DEFAULT_SPAM_PHRASES,
  freeEmailDomains: DEFAULT_FREE_EMAIL_DOMAINS,
}

describe('spam rules', () => {
  it('a normal job passes', () => {
    expect(spamFlags(clean)).toEqual([])
  })

  it('flags suspicious phrases, whatever the case or accents', () => {
    expect(spamFlags({ ...clean, description: `${clean.description} PAY TO APPLY today.` })[0]).toMatch(/pay to apply/)
  })

  it('flags too many links', () => {
    const links = ' https://a.example https://b.example www.c.example https://d.example'
    expect(spamFlags({ ...clean, description: clean.description + links })).toContainEqual(expect.stringMatching(/Too many links/))
  })

  it('flags a very short description', () => {
    expect(spamFlags({ ...clean, description: 'Call me.' })).toContainEqual(expect.stringMatching(/short description/))
  })

  it('flags employers using a free email address', () => {
    expect(spamFlags({ ...clean, employerEmail: 'boss@GMAIL.com' })).toContainEqual(expect.stringMatching(/free email/))
  })
})

describe('duplicates and material edits', () => {
  it('treats titles that differ only by case, accents or spaces as the same', () => {
    expect(sameTitle('Développeur  Web', 'developpeur web')).toBe(true)
    expect(sameTitle('Web developer', 'Mobile developer')).toBe(false)
  })

  it('title, description or company changes are material; salary is not', () => {
    const original = { title: 'A', description: { x: 1 }, company: 1, salaryMin: 10 }
    expect(isMaterialEdit(original, { title: 'B' })).toBe(true)
    expect(isMaterialEdit(original, { description: { x: 2 } })).toBe(true)
    expect(isMaterialEdit(original, { salaryMin: 20 })).toBe(false)
    expect(isMaterialEdit(original, { title: 'A' })).toBe(false)
    expect(isMaterialEdit(undefined, { title: 'B' })).toBe(false)
  })
})

describe('decideJobStatus', () => {
  const employer = { isAdmin: false, trusted: false, flagged: false, materialEdit: false }

  it('untrusted companies go to review; trusted ones publish', () => {
    expect(decideJobStatus({ ...employer, requested: 'published', previous: 'draft' })).toBe('pending_review')
    expect(decideJobStatus({ ...employer, trusted: true, requested: 'published', previous: 'draft' })).toBe('published')
  })

  it('a spam flag sends even a trusted company to review', () => {
    expect(decideJobStatus({ ...employer, trusted: true, flagged: true, requested: 'published' })).toBe('pending_review')
  })

  it('a material edit of a live job sends it back to review unless the company is trusted', () => {
    expect(decideJobStatus({ ...employer, previous: 'published', materialEdit: true })).toBe('pending_review')
    expect(decideJobStatus({ ...employer, trusted: true, previous: 'published', materialEdit: true })).toBe('published')
    expect(decideJobStatus({ ...employer, previous: 'published' })).toBe('published')
  })

  it('employers can never approve or reject', () => {
    expect(decideJobStatus({ ...employer, requested: 'rejected', previous: 'pending_review' })).toBe('pending_review')
    expect(decideJobStatus({ ...employer, requested: 'pending_review', previous: 'draft' })).toBe('draft')
  })

  it('employers can draft and close; admins get what they ask', () => {
    expect(decideJobStatus({ ...employer, requested: 'closed', previous: 'published' })).toBe('closed')
    expect(decideJobStatus({ ...employer, isAdmin: true, requested: 'published', previous: 'pending_review' })).toBe('published')
    expect(decideJobStatus({ ...employer, isAdmin: true, requested: 'rejected', previous: 'pending_review' })).toBe('rejected')
  })
})

describe('tokens and verification', () => {
  it('codes have 6 digits and tokens are long and random', () => {
    expect(randomCode()).toMatch(/^\d{6}$/)
    expect(randomToken()).toMatch(/^[a-f0-9]{64}$/)
    expect(randomToken()).not.toBe(randomToken())
  })

  it('compares hashes safely', () => {
    expect(sameHash(sha256('a'), sha256('a'))).toBe(true)
    expect(sameHash(sha256('a'), sha256('b'))).toBe(false)
    expect(sameHash(null, sha256('a'))).toBe(false)
  })

  it('only confirmed, non-banned accounts (or admins) count as verified', () => {
    expect(isVerified({ role: 'candidate', emailVerified: true, banned: false })).toBe(true)
    expect(isVerified({ role: 'candidate', emailVerified: false, banned: false })).toBe(false)
    expect(isVerified({ role: 'employer', emailVerified: true, banned: true })).toBe(false)
    expect(isVerified({ role: 'admin', emailVerified: false, banned: false })).toBe(true)
    expect(isVerified(null)).toBe(false)
  })
})
