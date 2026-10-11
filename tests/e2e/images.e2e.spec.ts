import { expect, test } from '@playwright/test'
import sharp from 'sharp'

import { register, uniqueEmail } from './helpers'

// A candidate avatar test is added with the settings page (Class 7), where avatars are uploaded.
test('employer uploads a logo and sees it on the job card and the company page', async ({ page }) => {
  const company = `E2E Logo Co ${Date.now()}`
  const jobTitle = `E2E Logo Job ${Date.now()}`
  // A wide, transparent logo: must fit its square frame without cropping
  const logo = await sharp({ create: { width: 900, height: 300, channels: 4, background: { r: 79, g: 70, b: 229, alpha: 0.9 } } })
    .png()
    .toBuffer()

  await register(page, { name: 'E2E Logo Employer', email: uniqueEmail('logo'), role: 'employer' })

  await page.goto('/dashboard/company')
  await page.getByLabel('Company name').fill(company)
  await page.getByLabel('Logo').setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: logo })
  await expect(page.getByAltText('Selected image preview')).toBeVisible()
  await page.getByRole('button', { name: 'Save company' }).click()
  await expect(page.getByText('Company profile saved.')).toBeVisible()

  await page.goto('/dashboard/jobs/new')
  await page.getByLabel('Job title').fill(jobTitle)
  await page.getByLabel('Description').fill('A job posted to check that company logos show up.')
  await page.getByLabel('Expires on').fill(new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10))
  await page.getByRole('button', { name: 'Publish' }).click()
  await page.waitForURL('**/dashboard/jobs')

  // Job card in the public list
  await page.goto(`/jobs?q=${encodeURIComponent(jobTitle)}`)
  const card = page.locator('article', { hasText: jobTitle })
  const cardLogo = card.getByAltText(`${company} logo`)
  await expect(cardLogo).toBeVisible()
  // Loaded for real (not a broken image), and shown whole inside the frame
  expect(await cardLogo.evaluate((img: HTMLImageElement) => img.naturalWidth > 0)).toBe(true)
  await expect(cardLogo).toHaveCSS('object-fit', 'contain')

  // Company page
  await card.getByRole('link', { name: jobTitle }).click()
  await page.getByRole('link', { name: company }).first().click()
  await expect(page.getByRole('heading', { level: 1, name: company })).toBeVisible()
  // Shown in the page header and again on the job card
  await expect(page.getByAltText(`${company} logo`).first()).toBeVisible()
})
