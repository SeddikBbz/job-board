import { expect, request as playwrightRequest, type Page } from '@playwright/test'

export const PASSWORD = 'Password123!'

const MAILPIT = 'http://localhost:8025/api/v1'

// Latest email to `to` whose subject matches, read from Mailpit (CI runs it; locally run `mailpit`)
export async function latestEmail(to: string, subject: RegExp): Promise<{ subject: string; html: string }> {
  const api = await playwrightRequest.newContext()
  try {
    for (let i = 0; i < 30; i++) {
      const res = await api.get(`${MAILPIT}/search?query=${encodeURIComponent(`to:"${to}"`)}`).catch(() => null)
      if (!res) throw new Error('Mailpit is not running (start it with `mailpit`)')
      const { messages = [] } = await res.json()
      const hit = messages.find((m: { Subject: string }) => subject.test(m.Subject))
      if (hit) {
        const message = await (await api.get(`${MAILPIT}/message/${hit.ID}`)).json()
        return { subject: hit.Subject, html: message.HTML as string }
      }
      await new Promise((r) => setTimeout(r, 1000))
    }
    throw new Error(`No email "${subject}" for ${to}`)
  } finally {
    await api.dispose()
  }
}

// Opens the link from the confirmation email, like the user would
export async function verifyEmail(page: Page, email: string) {
  const { html } = await latestEmail(email, /Confirm your email/)
  const link = html.match(/href="([^"]*\/verify-email\?token=[^"]+)"/)?.[1]
  expect(link).toBeTruthy()
  await page.goto(link!.replace(/&amp;/g, '&'))
  await expect(page.getByRole('heading', { name: 'Your email is confirmed' })).toBeVisible()
}

// Unique per run so tests never collide with leftovers; cleaned up by global-teardown
export const uniqueEmail = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e4)}@e2e.test`

// Turnstile (test keys in development) fills a hidden token; wait for it before submitting
export const waitForHumanCheck = (page: Page) =>
  page.waitForFunction(() => (document.querySelector('input[name="turnstileToken"]') as HTMLInputElement | null)?.value, null, { timeout: 60_000 })

// Signs up, then confirms the email (pass verify: false to stay unverified)
export async function register(
  page: Page,
  user: { name: string; email: string; role: 'candidate' | 'employer' },
  { verify = true } = {},
) {
  await page.goto('/register')
  // The token appears only after React has loaded the form. Typing earlier can be undone by
  // hydration (a fresh dev server is slow), e.g. the role silently resets to "Find a job".
  await waitForHumanCheck(page)
  // Click the visible segment (the radio inside it is visually hidden), like a user would
  const label = user.role === 'employer' ? 'Employer' : 'Candidate'
  await page.locator('label', { hasText: new RegExp(`^${label}$`) }).click()
  await expect(page.getByLabel(label, { exact: true })).toBeChecked()
  await page.getByLabel('Full name').fill(user.name)
  await page.getByLabel('Email').fill(user.email)
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByRole('checkbox', { name: /I agree to the terms/ }).check()
  await page.getByRole('button', { name: 'Create account' }).click()
  await page.waitForURL('**/dashboard')
  if (verify) {
    await verifyEmail(page, user.email)
    await page.goto('/dashboard')
  }
}

export async function login(page: Page, email: string) {
  await page.goto('/login')
  await waitForHumanCheck(page)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Log in' }).click()
  await enterCodeIfAsked(page, email)
  await page.waitForURL('**/dashboard')
}

// A browser the account hasn't used before asks for the emailed 6-digit code
export async function enterCodeIfAsked(page: Page, email: string) {
  const codeField = page.getByLabel('6-digit code')
  const asked = await codeField.waitFor({ timeout: 15_000 }).then(() => true).catch(() => false)
  if (!asked) return
  const { subject } = await latestEmail(email, /is your sign-in code/)
  await codeField.fill(subject.slice(0, 6))
  await waitForHumanCheck(page)
  await page.getByRole('button', { name: 'Confirm and log in' }).click()
}

export async function logout(page: Page) {
  // "Log out" lives in the account menu (avatar button in the header)
  await page.locator('header').getByRole('button', { name: /Account menu/ }).click()
  await page.getByRole('menuitem', { name: 'Log out' }).click()
  await page.waitForURL((url) => url.pathname === '/')
  await expect(page.locator('header').getByRole('link', { name: 'Log in' })).toBeVisible()
}

// Searches the skill picker (an alias works too, e.g. "golang") and ticks the skill
export async function pickSkill(page: Page, search: string, name: string) {
  const picker = page.getByTestId('skill-picker')
  await picker.getByLabel('Search skills').fill(search)
  await picker.locator('label', { hasText: new RegExp(`^${name}$`) }).click()
  await expect(picker.getByRole('button', { name: `Remove ${name}` })).toBeVisible()
}

// Same tiny valid PDF the integration tests use
export { pdfFile } from '../helpers/fixtures'
