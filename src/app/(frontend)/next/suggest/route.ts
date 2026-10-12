import { NextResponse, type NextRequest } from 'next/server'

import { getPayloadClient } from '@/lib/payload'
import { rateLimit } from '@/lib/rateLimit'
import { getSuggestions, parseSuggestQuery } from '@/lib/suggest'

// GET /next/suggest?q=rea → { jobs, skills, locations, companies } for the live search box.
// Outside /api so it never collides with Payload's REST routes.
export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (!rateLimit('suggest', ip)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429, headers: { 'Retry-After': '60' } })
  }

  const parsed = parseSuggestQuery(request.nextUrl.searchParams.get('q'))
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const suggestions = await getSuggestions(await getPayloadClient(), parsed.q)
  return NextResponse.json(suggestions, {
    // Public data only: identical prefixes typed by many visitors are served from the cache
    headers: { 'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=300' },
  })
}
