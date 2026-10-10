import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CompanyLogo } from '@/components/company-logo'
import { ImageUpload } from '@/components/image-upload'
import { UserAvatar } from '@/components/user-avatar'

// jsdom cannot decode images: report a fixed size and keep the file as it is
vi.mock('@/lib/shrinkImage', () => ({
  readImageSize: vi.fn(async () => ({ width: 800, height: 600 })),
  shrinkImage: vi.fn(async (file: File) => file),
}))
// next/image needs the Next.js runtime; a plain img is enough here
vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:preview')
  URL.revokeObjectURL = vi.fn()
})
afterEach(cleanup)

const pick = (file: File) => fireEvent.change(screen.getByLabelText('Logo'), { target: { files: [file] } })

describe('ImageUpload', () => {
  it('shows a preview of the chosen image', async () => {
    render(<ImageUpload name="logo" label="Logo" />)
    pick(new File(['x'], 'logo.png', { type: 'image/png' }))
    expect(await screen.findByAltText('Selected image preview')).toHaveProperty('src', 'blob:preview')
    expect(screen.getByRole('button', { name: 'Remove' })).toBeTruthy()
  })

  it('rejects a wrong file type before uploading', async () => {
    render(<ImageUpload name="logo" label="Logo" />)
    pick(new File(['<svg/>'], 'logo.svg', { type: 'image/svg+xml' }))
    expect((await screen.findByRole('alert')).textContent).toMatch(/JPG, PNG or WebP/)
    expect(screen.queryByAltText('Selected image preview')).toBeNull()
  })

  it('rejects a file that is too large before uploading', async () => {
    render(<ImageUpload name="logo" label="Logo" />)
    const big = new File(['x'], 'big.jpg', { type: 'image/jpeg' })
    Object.defineProperty(big, 'size', { value: 9 * 1024 * 1024 })
    pick(big)
    expect((await screen.findByRole('alert')).textContent).toMatch(/8 MB/)
  })

  it('removing a saved image sends a remove flag', async () => {
    const { container } = render(<ImageUpload name="logo" label="Logo" currentSrc="/logo.webp" />)
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))
    await waitFor(() => expect(container.querySelector('input[name="logoRemove"]')).toBeTruthy())
  })
})

describe('fallbacks', () => {
  it('UserAvatar shows initials without a photo', () => {
    render(<UserAvatar name="Jane Doe" />)
    expect(screen.getByTestId('avatar-fallback').textContent).toBe('JD')
  })

  it('CompanyLogo shows the first letter without a logo', () => {
    render(<CompanyLogo company={{ name: 'atlas Digital', logo: null }} />)
    expect(screen.getByTestId('company-logo-fallback').textContent).toBe('A')
  })

  it('CompanyLogo uses the logo size when it exists', () => {
    const logo = { id: 1, alt: 'Atlas logo', url: '/o.webp', sizes: { logo: { url: '/logo.webp' } } }
    render(<CompanyLogo company={{ name: 'Atlas', logo: logo as never }} />)
    expect(screen.getByAltText('Atlas logo').getAttribute('src')).toBe('/logo.webp')
  })
})
