import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import { login, logout, PASSWORD, register, uniqueEmail, waitForHumanCheck } from './helpers'

test.describe.serial('sign in and sign up', () => {
  const candidate = { name: 'E2E Auth Candidate', email: uniqueEmail('auth'), role: 'candidate' as const }

  test('register as a candidate, log out and log in again', async ({ page }) => {
    await register(page, candidate)
    await expect(page.getByRole('heading', { name: /Hi, E2E Auth Candidate/ })).toBeVisible()
    await logout(page)
    await login(page, candidate.email)
  })

  test('register as an employer from the "Start hiring" link', async ({ page }) => {
    await page.goto('/register?role=employer')
    await waitForHumanCheck(page)
    // The role comes preselected and the panel shows employer benefits (lg screens)
    await expect(page.getByLabel('Employer', { exact: true })).toBeChecked()
    await expect(page.getByTestId('auth-panel')).toContainText('Post a job in minutes')
    await register(page, { name: 'E2E Auth Employer', email: uniqueEmail('auth-emp'), role: 'employer' })
    await expect(page.getByText('Signed in as').first()).toContainText('Employer')
  })

  test('wrong password shows a clear error and keeps the email', async ({ page }) => {
    await page.goto('/login')
    await waitForHumanCheck(page)
    await page.getByLabel('Email').fill(candidate.email)
    await page.getByLabel('Password', { exact: true }).fill('WrongPassword1!')
    await page.getByRole('button', { name: 'Log in' }).click()
    // Our error box (Next.js also has a hidden role=alert route announcer)
    const alert = page.getByRole('alert').filter({ hasText: 'Invalid email or password' })
    await expect(alert).toBeVisible()
    // Focus moves to the error so keyboard and screen reader users notice it
    await expect(alert).toBeFocused()
    await expect(page.getByLabel('Email')).toHaveValue(candidate.email)
  })

  test('an email that is already used shows an error on the email field', async ({ page }) => {
    await page.goto('/register')
    await waitForHumanCheck(page)
    await page.getByLabel('Full name').fill('Someone Else')
    await page.getByLabel('Email').fill(candidate.email)
    await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
    await page.getByRole('checkbox', { name: /I agree to the terms/ }).check()
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page.getByText('An account with this email already exists.')).toBeVisible()
    await expect(page.getByLabel('Email')).toBeFocused()
  })

  test('the terms must be accepted', async ({ page }) => {
    await page.goto('/register')
    await waitForHumanCheck(page)
    await page.getByLabel('Full name').fill('No Terms')
    await page.getByLabel('Email').fill(uniqueEmail('noterms'))
    await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page.getByText(/accept the terms/)).toBeVisible()
  })

  test('login sends the user back to the page they wanted (same site only)', async ({ page }) => {
    await page.goto('/dashboard/applications')
    await page.waitForURL(/\/login\?next=/)
    await waitForHumanCheck(page)
    await page.getByLabel('Email').fill(candidate.email)
    await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
    await page.getByRole('button', { name: 'Log in' }).click()
    await page.waitForURL('**/dashboard/applications')

    // An outside address in ?next= is ignored
    await logout(page)
    await page.goto('/login?next=https://evil.example')
    await waitForHumanCheck(page)
    await page.getByLabel('Email').fill(candidate.email)
    await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
    await page.getByRole('button', { name: 'Log in' }).click()
    await page.waitForURL((url) => url.pathname === '/dashboard')
  })
})

test.describe('accessibility', () => {
  for (const path of ['/login', '/register']) {
    test(`${path} has no serious accessibility problems and every input has a label`, async ({ page }) => {
      await page.goto(path)
      await waitForHumanCheck(page)
      const results = await new AxeBuilder({ page })
        // The human check is a Cloudflare iframe we don't control
        .exclude('[data-testid="turnstile"]')
        .analyze()
      const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
      // Name the failing elements so the report shows what to fix
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([])
    })
  }
})
