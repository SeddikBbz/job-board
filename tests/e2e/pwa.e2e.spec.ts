import { expect, test } from '@playwright/test'

test('the app can be installed: manifest and icons are valid', async ({ page, request }) => {
  await page.goto('/')
  const href = await page.locator('link[rel="manifest"]').getAttribute('href')
  expect(href).toBeTruthy()

  const res = await request.get(href!)
  expect(res.ok()).toBe(true)
  const manifest = await res.json()
  expect(manifest).toMatchObject({ name: expect.any(String), short_name: 'JobBoard', start_url: '/', display: 'standalone' })
  expect(manifest.icons.map((i: { sizes: string }) => i.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']))
  expect(manifest.icons.some((i: { purpose?: string }) => i.purpose === 'maskable')).toBe(true)

  for (const icon of manifest.icons) {
    const file = await request.get(icon.src)
    expect(file.ok(), icon.src).toBe(true)
    expect(file.headers()['content-type']).toContain('image/png')
  }
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#4f46e5')
})

test('the service worker file is served fresh, and the offline page exists', async ({ page, request }) => {
  const sw = await request.get('/sw.js')
  expect(sw.ok()).toBe(true)
  expect(sw.headers()['cache-control']).toContain('no-cache')

  await page.goto('/offline')
  await expect(page.getByRole('heading', { name: "You're offline" })).toBeVisible()
})
