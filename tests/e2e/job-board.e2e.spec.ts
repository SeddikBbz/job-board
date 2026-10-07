import { expect, test } from '@playwright/test'

import { login, logout, pdfFile, register, uniqueEmail } from './helpers'

const MAILPIT = 'http://localhost:8025/api/v1'

// One story, in order: each step builds on the previous one
test.describe.serial('job board', () => {
  const employer = { name: 'E2E Employer', email: uniqueEmail('employer'), role: 'employer' as const }
  const candidate = { name: 'E2E Candidate', email: uniqueEmail('candidate'), role: 'candidate' as const }
  const jobTitle = `E2E Platform Engineer ${Date.now()}`

  test('employer posts a job', async ({ page }) => {
    await register(page, employer)

    await page.goto('/dashboard/company')
    await page.getByLabel('Company name').fill(`E2E Co ${Date.now()}`)
    await page.getByLabel('Location').fill('Algiers')
    await page.getByRole('button', { name: 'Save company' }).click()
    await expect(page.getByText('Company profile saved.')).toBeVisible()

    await page.goto('/dashboard/jobs/new')
    await page.getByLabel('Job title').fill(jobTitle)
    await page.getByLabel('Description').fill('Build and run our platform.\n\nWork with Go and Kubernetes.')
    await page.getByLabel('Work mode').selectOption('remote')
    await page.getByLabel('Skills').fill('go, kubernetes')
    await page.getByLabel('Expires on').fill(new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10))
    await page.getByRole('button', { name: 'Publish' }).click()
    await page.waitForURL('**/dashboard/jobs')
    await expect(page.locator('tr', { hasText: jobTitle })).toContainText('published')
  })

  test('candidate registers, logs in and applies', async ({ page }) => {
    await register(page, candidate)
    await logout(page)
    await login(page, candidate.email)

    // The new job is public and searchable
    await page.goto(`/jobs?q=${encodeURIComponent(jobTitle)}`)
    await page.getByRole('link', { name: jobTitle }).click()
    // In `pnpm dev` the first visit compiles the job page route, which can take a while
    await page.waitForURL(/\/jobs\/e2e-platform-engineer-/, { timeout: 120_000 })
    await expect(page.getByRole('heading', { level: 1, name: jobTitle })).toBeVisible({ timeout: 60_000 })

    const apply = page.locator('#apply')
    await apply.locator('input[type=file]').setInputFiles({ name: 'cv.pdf', mimeType: 'application/pdf', buffer: pdfFile().data })
    await apply.locator('textarea').fill('I would love to work on your platform.')
    await apply.getByRole('button', { name: 'Send application' }).click()
    await expect(apply.getByText('Application sent')).toBeVisible()

    await page.goto('/dashboard/applications')
    await expect(page.locator('tr', { hasText: jobTitle })).toContainText('applied')
  })

  test('employer changes the status and the candidate gets an email', async ({ page, request }) => {
    const mailpitUp = await request.get(`${MAILPIT}/messages`).then((r) => r.ok()).catch(() => false)

    await login(page, employer.email)
    await page.goto('/dashboard/jobs')
    await page.locator('tr', { hasText: jobTitle }).getByRole('link', { name: /applicant/ }).click()
    await expect(page.getByText(candidate.name)).toBeVisible()
    await page.getByLabel('Application status').selectOption('interview')
    await expect(page.getByText('Saved')).toBeVisible()

    test.skip(!mailpitUp, 'Mailpit is not running (start it with `mailpit`)')
    await expect
      .poll(
        async () => {
          const { messages = [] } = await (await request.get(`${MAILPIT}/messages`)).json()
          return messages.some(
            (m: { To: { Address: string }[]; Subject: string }) =>
              m.To.some((t) => t.Address === candidate.email) && m.Subject.startsWith('Update on your application'),
          )
        },
        { timeout: 30_000 },
      )
      .toBe(true)
  })
})
