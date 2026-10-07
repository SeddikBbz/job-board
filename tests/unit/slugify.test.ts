import { describe, expect, it } from 'vitest'

import { slugify } from '@/lib/slugify'

describe('slugify', () => {
  it('lowercases and joins words with dashes', () => {
    expect(slugify('Senior React Developer')).toBe('senior-react-developer')
  })

  it('removes accents', () => {
    expect(slugify('Société Générale')).toBe('societe-generale')
  })

  it('drops symbols and collapses separators', () => {
    expect(slugify('  C++ / Node.js  &  Go!! ')).toBe('c-node-js-go')
  })

  it('trims leading and trailing dashes', () => {
    expect(slugify('--hello--')).toBe('hello')
  })

  it('returns an empty string when nothing is left (caller picks a fallback)', () => {
    expect(slugify('مرحبا')).toBe('')
    expect(slugify('')).toBe('')
  })
})
