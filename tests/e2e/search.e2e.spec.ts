import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const box = (page: import('@playwright/test').Page) => page.getByRole('combobox', { name: 'Search jobs' })

test('typing on the home page shows skill suggestions without clicking anything', async ({ page }) => {
  await page.goto('/')
  await box(page).fill('rea')
  const list = page.getByRole('listbox', { name: 'Search suggestions' })
  await expect(list.getByRole('group', { name: 'Skills' })).toBeVisible()
  await expect(list.getByRole('option', { name: /React/ }).first()).toBeVisible()
})

test('choosing a city filters the results and updates the URL', async ({ page }) => {
  await page.goto('/jobs')
  await box(page).fill('alger')
  await page.getByRole('listbox').getByRole('option', { name: /Algiers/ }).first().click()
  await page.waitForURL(/location=Algiers/)
  await expect(page.getByRole('list', { name: 'Active filters' })).toContainText('Algiers')
})

test('the whole flow works with the keyboard only', async ({ page }) => {
  await page.goto('/')
  await box(page).focus()
  await page.keyboard.type('react')
  await expect(page.getByRole('listbox').getByRole('option').first()).toBeVisible()
  await page.keyboard.press('ArrowDown')
  await expect(box(page)).toHaveAttribute('aria-activedescendant', /option/)
  await page.keyboard.press('Escape')
  await expect(box(page)).toHaveAttribute('aria-expanded', 'false')
  await page.keyboard.press('Enter')
  await page.waitForURL(/\/jobs\?q=react/)
})

test('the results update while typing on /jobs (no button press)', async ({ page }) => {
  await page.goto('/jobs')
  await box(page).fill('developer')
  await page.waitForURL(/q=developer/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('developer')
})

test('suggestions never include draft or closed jobs', async ({ request }) => {
  const res = await request.get('/next/suggest?q=draft')
  expect(res.ok()).toBe(true)
  const { jobs } = await res.json()
  // Seeded and e2e drafts are titled like any job; the endpoint uses public read rules,
  // so any job it returns must open publicly
  for (const job of jobs as { slug: string }[]) {
    expect((await request.get(`/jobs/${job.slug}`)).status()).toBe(200)
  }
  expect((await request.get('/next/suggest?q=x')).status()).toBe(400)
})

test('no serious accessibility problems with the suggestions open', async ({ page }) => {
  await page.goto('/')
  await box(page).fill('rea')
  await expect(page.getByRole('listbox')).toBeVisible()
  const results = await new AxeBuilder({ page }).analyze()
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  // Name the failing elements so the report shows what to fix
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([])
})
