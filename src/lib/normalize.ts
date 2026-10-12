// One normalizer for seed, hooks and search, so "Alger", "ALGER " and "Algér" all match.

const LATIN_ACCENTS = /[̀-ͯ]/g
// Arabic short vowels, shadda, sukun, superscript alef and tatweel (ـ)
const ARABIC_MARKS = /[ً-ٰٟـ]/g

export function normalizeText(value: string): string {
  return (
    value
      // NFD splits "é" into "e" + accent and "أ" into "ا" + hamza, so both marks can be dropped
      .normalize('NFD')
      .replace(LATIN_ACCENTS, '')
      .replace(ARABIC_MARKS, '')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه')
      .toLowerCase()
      // Keep letters, digits and the symbols that matter in skill names (C#, C++, .NET)
      .replace(/[^\p{L}\p{N}#+.]+/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  )
}

// For matching free text against names and aliases: "Node.js", "node js" and "NodeJS" → "nodejs"
export const matchKey = (value: string): string => normalizeText(value).replace(/[\s.\-_]/g, '')

// searchText stored on skills and locations: every spelling, normalized, space-separated
export const buildSearchText = (...values: (string | null | undefined)[]): string =>
  [...new Set(values.filter(Boolean).map((v) => normalizeText(v!)))].join(' ')
