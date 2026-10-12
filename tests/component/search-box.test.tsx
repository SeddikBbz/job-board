import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SearchBox } from '@/components/search/search-box'

const push = vi.fn()
const replace = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
  useSearchParams: () => new URLSearchParams(),
}))

const answer = (name: string) => ({
  jobs: [{ title: `${name} Developer`, slug: `${name.toLowerCase()}-developer`, company: 'Atlas' }],
  skills: [{ name, slug: name.toLowerCase(), category: 'Frontend' }],
  locations: [{ name: 'Algiers', slug: 'algiers', country: 'Algeria' }],
  companies: [],
})

let fetchMock: ReturnType<typeof vi.fn>
beforeEach(() => {
  vi.useFakeTimers()
  push.mockReset()
  replace.mockReset()
  fetchMock = vi.fn(async (url: string) => {
    const q = new URL(url, 'http://x').searchParams.get('q') ?? ''
    return { ok: true, json: async () => answer(q === 'vue' ? 'Vue' : 'React') }
  })
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const box = () => screen.getByRole('combobox', { name: 'Search jobs' })
const type = (text: string) => fireEvent.change(box(), { target: { value: text } })
const settle = async () => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(400)
  })
}

describe('SearchBox', () => {
  it('sends one request after the user stops typing, not one per key', async () => {
    render(<SearchBox mode="navigate" />)
    type('r')
    type('re')
    type('rea')
    expect(fetchMock).not.toHaveBeenCalled()
    await settle()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toContain('q=rea')
    expect(screen.getByRole('option', { name: /React Developer/ })).toBeTruthy()
  })

  it('never lets a slower old answer overwrite a newer one', async () => {
    let releaseOld: () => void = () => {}
    fetchMock.mockImplementationOnce(
      (_url: string, init: { signal: AbortSignal }) =>
        new Promise((resolve, reject) => {
          releaseOld = () => resolve({ ok: true, json: async () => answer('React') })
          init.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
        }),
    )
    render(<SearchBox mode="navigate" />)
    type('rea')
    await settle() // old request is in flight
    type('vue')
    await settle() // new request answers first
    releaseOld()
    await settle()
    expect(screen.getByRole('option', { name: /Vue Developer/ })).toBeTruthy()
    expect(screen.queryByRole('option', { name: /React Developer/ })).toBeNull()
  })

  it('arrow keys move, Enter selects, Escape closes', async () => {
    render(<SearchBox mode="navigate" />)
    type('rea')
    await settle()
    fireEvent.keyDown(box(), { key: 'ArrowDown' })
    expect(box().getAttribute('aria-activedescendant')).toBe(screen.getAllByRole('option')[0].id)
    fireEvent.keyDown(box(), { key: 'ArrowDown' })
    // Second option is the skill: Enter turns it into a filter
    fireEvent.keyDown(box(), { key: 'Enter' })
    expect(push).toHaveBeenCalledWith('/jobs?skills=react')

    type('rea')
    await settle()
    expect(box().getAttribute('aria-expanded')).toBe('true')
    fireEvent.keyDown(box(), { key: 'Escape' })
    expect(box().getAttribute('aria-expanded')).toBe('false')
  })

  it('Enter without a selection searches the typed text', async () => {
    render(<SearchBox mode="navigate" />)
    type('data analyst')
    fireEvent.keyDown(box(), { key: 'Enter' })
    expect(push).toHaveBeenCalledWith('/jobs?q=data+analyst')
  })
})
