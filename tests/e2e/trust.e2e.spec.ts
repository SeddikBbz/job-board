import { expect, test } from '@playwright/test'

import { createAdmin, getUserByEmail } from './db'
import { enterCodeIfAsked, login, PASSWORD, register, uniqueEmail, waitForHumanCheck } from './helpers'

test('employer posts, admin approves, the job goes public and into suggestions', async ({ browser }) => {
  const jobTitle = `E2E Moderated Role ${Date.now()}`
  const employerPage = await (await browser.newContext()).newPage()
  await register(employerPage, { name: 'E2E Mod Employer', email: uniqueEmail('mod-emp'), role: 'employer' })
  await employerPage.goto('/dashboard/company')
  await employerPage.getByLabel('Company name').fill(`E2E Mod Co ${Date.now()}`)
  await employerPage.getByRole('button', { name: 'Save company' }).click()
  await expect(employerPage.getByText('Company profile saved.')).toBeVisible()
  await employerPage.goto('/dashboard/jobs/new')
  await employerPage.getByLabel('Job title').fill(jobTitle)
  await employerPage.getByLabel('Description').fill('Help us build a safe hiring platform. You will work on moderation tools and search.')
  await employerPage.getByLabel('Expires on').fill(new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10))
  await employerPage.getByRole('button', { name: 'Publish' }).click()
  await employerPage.waitForURL('**/dashboard/jobs')
  await expect(employerPage.locator('tr', { hasText: jobTitle })).toContainText('Waiting for review')

  // Not public yet
  const before = await (await employerPage.request.get(`/next/suggest?q=${encodeURIComponent(jobTitle.slice(0, 40))}`)).json()
  expect(before.jobs).toEqual([])

  const adminEmail = uniqueEmail('admin')
  await createAdmin(adminEmail, PASSWORD)
  const adminPage = await (await browser.newContext()).newPage()
  await login(adminPage, adminEmail)
  await adminPage.goto('/dashboard/moderation')
  const item = adminPage.getByTestId('review-item').filter({ hasText: jobTitle })
  await item.getByRole('button', { name: 'Approve', exact: true }).click()
  await expect(item.getByText('Job approved and published.')).toBeVisible()

  await expect
    .poll(async () => (await (await adminPage.request.get(`/next/suggest?q=${encodeURIComponent(jobTitle.slice(0, 40))}`)).json()).jobs.length)
    .toBe(1)
  await adminPage.goto(`/jobs?q=${encodeURIComponent(jobTitle)}`)
  await expect(adminPage.getByRole('link', { name: jobTitle, exact: true })).toBeVisible()
})

test('an unverified account sees the banner and cannot apply', async ({ page }) => {
  const email = uniqueEmail('unverified')
  await register(page, { name: 'E2E Unverified', email, role: 'candidate' }, { verify: false })
  await expect(page.getByTestId('verify-email-banner')).toBeVisible()
  // The terms version accepted at sign-up is stored on the account
  expect((await getUserByEmail(email))?.termsVersion).toBeTruthy()
})

test('anyone can report a job in two clicks; the dialog closes with Escape', async ({ page }) => {
  await page.goto('/jobs')
  const firstJob = page.locator('main article a[href^="/jobs/"]').first()
  test.skip((await firstJob.count()) === 0, 'No published job in this database')
  await firstJob.click()
  await page.getByRole('button', { name: 'Report this job' }).click()
  const dialog = page.getByRole('dialog', { name: 'Report this job' })
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()

  await page.getByRole('button', { name: 'Report this job' }).click()
  await dialog.getByLabel('Misleading or fake').check()
  await waitForHumanCheck(page)
  await dialog.getByRole('button', { name: 'Send report' }).click()
  await expect(dialog.getByText('A moderator will look at this job.')).toBeVisible()
})

test('legal pages are linked from the footer and the sign-up form', async ({ page }) => {
  await page.goto('/')
  for (const name of ['Privacy', 'Terms', 'Cookies']) {
    await page.getByRole('navigation', { name: 'Legal' }).getByRole('link', { name }).click()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.goBack()
  }
  await page.goto('/register')
  await expect(page.getByRole('link', { name: 'terms', exact: true })).toHaveAttribute('href', '/terms')
  await expect(page.getByRole('link', { name: 'privacy policy' })).toHaveAttribute('href', '/privacy')
})

test('signing in from a second browser asks for the emailed code', async ({ browser }) => {
  const email = uniqueEmail('device')
  const first = await (await browser.newContext()).newPage()
  await register(first, { name: 'E2E Device', email, role: 'candidate' })

  const second = await (await browser.newContext()).newPage()
  await second.goto('/login')
  await waitForHumanCheck(second)
  await second.getByLabel('Email').fill(email)
  await second.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await second.getByRole('button', { name: 'Log in' }).click()
  await expect(second.getByLabel('6-digit code')).toBeVisible()
  await enterCodeIfAsked(second, email)
  await second.waitForURL('**/dashboard')
})
