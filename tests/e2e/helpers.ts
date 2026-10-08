import { expect, type Page } from '@playwright/test'

export const PASSWORD = 'Password123!'

// Unique per run so tests never collide with leftovers; cleaned up by global-teardown
export const uniqueEmail = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e4)}@e2e.test`

// Turnstile (test keys in development) fills a hidden token; wait for it before submitting
export const waitForHumanCheck = (page: Page) =>
  page.waitForFunction(() => (document.querySelector('input[name="turnstileToken"]') as HTMLInputElement | null)?.value, null, { timeout: 60_000 })

export async function register(page: Page, user: { name: string; email: string; role: 'candidate' | 'employer' }) {
  await page.goto('/register')
  // The token appears only after React has loaded the form. Typing earlier can be undone by
  // hydration (a fresh dev server is slow), e.g. the role silently resets to "Find a job".
  await waitForHumanCheck(page)
  const role = page.getByLabel(user.role === 'employer' ? 'Hire people' : 'Find a job')
  await role.check()
  await expect(role).toBeChecked()
  await page.getByLabel('Full name').fill(user.name)
  await page.getByLabel('Email').fill(user.email)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Create account' }).click()
  await page.waitForURL('**/dashboard')
}

export async function login(page: Page, email: string) {
  await page.goto('/login')
  await waitForHumanCheck(page)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Log in' }).click()
  await page.waitForURL('**/dashboard')
}

export async function logout(page: Page) {
  // "Log out" lives in the account menu (avatar button in the header)
  await page.locator('header').getByRole('button', { name: /Account menu/ }).click()
  await page.getByRole('menuitem', { name: 'Log out' }).click()
  await page.waitForURL((url) => url.pathname === '/')
  await expect(page.locator('header').getByRole('link', { name: 'Log in' })).toBeVisible()
}

// Same tiny valid PDF the integration tests use
export { pdfFile } from '../helpers/fixtures'
