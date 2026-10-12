import { describe, expect, it } from 'vitest'

import { LOCATIONS } from '@/data/taxonomy'
import { buildSearchText, matchKey, normalizeText } from '@/lib/normalize'
import { buildMatcher, matchAll } from '@/lib/taxonomy'

describe('normalizeText', () => {
  it('lowercases, trims and removes Latin accents', () => {
    expect(normalizeText('  Sétif ')).toBe('setif')
    expect(normalizeText('Béjaïa')).toBe('bejaia')
    expect(normalizeText('Français')).toBe('francais')
  })

  it('removes Arabic diacritics and tatweel, and unifies alef, ya and ta marbuta', () => {
    expect(normalizeText('أدرار')).toBe(normalizeText('ادرار'))
    expect(normalizeText('إليزي')).toBe('اليزي')
    expect(normalizeText('مُسْتَغَانِم')).toBe('مستغانم')
    // Tatweel removed, and hamza seats unified too (people type الجزائر and الجزاير)
    expect(normalizeText('الجـــزائر')).toBe(normalizeText('الجزاير'))
    expect(normalizeText('مدينة')).toBe('مدينه')
  })

  it('keeps the symbols that matter in skill names', () => {
    expect(normalizeText('C#')).toBe('c#')
    expect(normalizeText('Node.js')).toBe('node.js')
  })
})

describe('matching free text to the lists', () => {
  const skills = [
    { id: 1, name: 'React', aliases: ['reactjs'] },
    { id: 2, name: 'Node.js', aliases: ['node'] },
    { id: 3, name: 'C# and .NET', aliases: ['c#', 'dotnet'] },
  ]
  const match = buildMatcher(skills)

  it('ignores case, spaces, dots and dashes', () => {
    expect(match('REACT')).toBe(1)
    expect(match('ReactJS')).toBe(1)
    expect(match('react js')).toBe(1)
    expect(match('NodeJS')).toBe(2)
    expect(match('node-js')).toBe(2)
    expect(match('C#')).toBe(3)
  })

  it('returns undefined for unknown values', () => {
    expect(match('cobol')).toBeUndefined()
  })

  it('splits values into unique ids and the unmatched ones', () => {
    expect(matchAll(['ReactJS', 'react', 'cobol', 'node'], match)).toEqual({ ids: [1, 2], unmatched: ['cobol'] })
  })

  it('finds a city by its English, French or Arabic name', () => {
    const cities = buildMatcher(LOCATIONS.map((l, i) => ({ id: i, name: l.name, aliases: l.aliases })))
    const algiers = cities('Algiers')
    expect(algiers).toBeDefined()
    expect(cities('alger')).toBe(algiers)
    expect(cities('ALGER ')).toBe(algiers)
    expect(cities('الجزائر')).toBe(algiers)
    expect(cities('Béjaïa')).toBe(cities('bejaia'))
    expect(cities('télétravail')).toBe(cities('Remote'))
  })

  it('buildSearchText stores every spelling once, normalized', () => {
    expect(buildSearchText('Algiers', 'Alger', 'alger', 'الجزائر')).toBe(`algiers alger ${normalizeText('الجزائر')}`)
  })
})

describe('starting cities', () => {
  it('include all 58 wilayas, Remote, and unique names', () => {
    expect(LOCATIONS.filter((l) => l.country === 'Algeria' && l.region === l.name)).toHaveLength(58)
    expect(LOCATIONS.some((l) => l.isRemote)).toBe(true)
    const keys = LOCATIONS.map((l) => matchKey(l.name))
    expect(new Set(keys).size).toBe(keys.length)
  })
})
