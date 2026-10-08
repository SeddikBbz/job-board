import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { Container } from '@/components/container'

afterEach(cleanup)

describe('Container', () => {
  it('renders its children', () => {
    render(<Container>Hello jobs</Container>)
    expect(screen.getByText('Hello jobs')).toBeTruthy()
  })

  it('is full width with fluid side padding and no max width', () => {
    render(<Container>content</Container>)
    const el = screen.getByText('content')
    expect(el.dataset.slot).toBe('container')
    expect(el.className).toContain('w-full')
    expect(el.className).toContain('px-(--gutter)')
    expect(el.className).not.toMatch(/\bmax-w-/)
  })

  it('merges extra classes and renders another element with `as`', () => {
    render(
      <Container as="section" className="py-8" aria-label="Results">
        content
      </Container>,
    )
    const el = screen.getByRole('region', { name: 'Results' })
    expect(el.tagName).toBe('SECTION')
    expect(el.className).toContain('py-8')
    expect(el.className).toContain('w-full')
  })

  it('uses a fluid gutter token (grows with the screen, between 1rem and 4rem)', () => {
    // jsdom does not run Tailwind, so check the token the padding class points to
    const css = readFileSync(join(process.cwd(), 'src/app/(frontend)/styles.css'), 'utf8')
    expect(css).toMatch(/--gutter:\s*clamp\(1rem,\s*3vw,\s*4rem\)/)
  })
})
