import { expect, type Page } from '@playwright/test'

export const PASSWORD = 'Password123!'

// Unique per run so tests never collide with leftovers; cleaned up by global-teardown
export const uniqueEmail = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e4)}@e2e.test`

// Turnstile (test keys in development) fills a hidden token; wait for it before submitting
export const waitForHumanCheck = (page: Page) =>
  page.waitForFunction(() => (document.querySelector('input[name="turnstileToken"]') as HTMLInputElement | null)?.value)

export async function register(page: Page, user: { name: string; email: string; role: 'candidate' | 'employer' }) {
  await page.goto('/register')
  await page.getByLabel(user.role === 'employer' ? 'Hire people' : 'Find a job').check()
  await page.getByLabel('Full name').fill(user.name)
  await page.getByLabel('Email').fill(user.email)
  await page.getByLabel('Password').fill(PASSWORD)
  await waitForHumanCheck(page)
  await page.getByRole('button', { name: 'Create account' }).click()
  await page.waitForURL('**/dashboard')
}

export async function login(page: Page, email: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(PASSWORD)
  await waitForHumanCheck(page)
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
