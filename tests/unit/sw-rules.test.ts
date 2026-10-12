import { beforeAll, describe, expect, it } from 'vitest'

type Strategy = (url: string, method: string, origin: string) => 'static' | 'page' | 'none'
let cacheStrategy: Strategy
const ORIGIN = 'https://jobs.example'
const s = (path: string, method = 'GET') => cacheStrategy(ORIGIN + path, method, ORIGIN)

beforeAll(async () => {
  // Plain script shared with the service worker: it attaches cacheStrategy to the global scope
  // @ts-expect-error -- a plain browser script (no exports), loaded only for its side effect
  await import('../../public/sw-rules.js')
  cacheStrategy = (globalThis as unknown as { cacheStrategy: Strategy }).cacheStrategy
})

describe('service worker cache rules', () => {
  it('never caches private or per-user pages', () => {
    for (const path of ['/api/users/me', '/admin', '/admin/collections/jobs', '/dashboard', '/dashboard/applications', '/login', '/register', '/forgot-password', '/reset-password?token=x']) {
      expect(s(path), path).toBe('none')
    }
  })

  it('never caches non-GET requests or other sites', () => {
    expect(s('/jobs', 'POST')).toBe('none')
    expect(cacheStrategy('https://cdn.other.example/x.png', 'GET', ORIGIN)).toBe('none')
  })

  it('caches build files and icons first', () => {
    expect(s('/_next/static/chunks/app.js')).toBe('static')
    expect(s('/icons/icon-192.png')).toBe('static')
  })

  it('treats public pages as network-first pages', () => {
    expect(s('/')).toBe('page')
    expect(s('/jobs?q=react')).toBe('page')
    expect(s('/jobs/frontend-developer')).toBe('page')
  })
})
