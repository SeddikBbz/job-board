import { expect, test, type BrowserContextOptions, type Page } from '@playwright/test'

import { register, uniqueEmail } from './helpers'

// Phone, tablet, laptop, full HD and 1440p monitors
const WIDTHS = [360, 768, 1280, 1920, 2560]
const HEIGHT = 900

let candidateState: BrowserContextOptions['storageState']
let jobPath: string | null = null

test.beforeAll(async ({ browser }) => {
  // A fresh `pnpm dev` connects to the database and compiles on the first visit: allow time for it
  test.setTimeout(600_000)
  // One logged-in candidate for the dashboard checks, and one real job page from the list
  const page = await browser.newPage()
  await page.goto('/register', { timeout: 300_000 })
  await register(page, { name: 'E2E Layout', email: uniqueEmail('layout'), role: 'candidate' })
  candidateState = await page.context().storageState()
  await page.goto('/jobs')
  jobPath = await page.locator('main article a[href^="/jobs/"]').first().getAttribute('href', { timeout: 10_000 }).catch(() => null)
  await page.close()
})

const PAGES = [
  { name: 'home', path: () => '/' },
  { name: 'jobs', path: () => '/jobs' },
  { name: 'job detail', path: () => jobPath },
  { name: 'login', path: () => '/login' },
  { name: 'dashboard', path: () => '/dashboard', loggedIn: true },
]

// Elements that stick out past the right or left edge of the screen. Children of a box that
// clips or scrolls (table wrappers, decorative hero shapes) are fine: that box contains them.
function findOverflowingElements(page: Page) {
  return page.evaluate(() => {
    const width = document.documentElement.clientWidth
    const offenders: string[] = []
    for (const el of document.body.querySelectorAll<HTMLElement>('*')) {
      const rect = el.getBoundingClientRect()
      if (rect.width === 0 || (rect.right <= width + 1 && rect.left >= -1)) continue
      if (getComputedStyle(el).position === 'fixed') continue
      let parent = el.parentElement
      let contained = false
      while (parent && parent !== document.body) {
        if (getComputedStyle(parent).overflowX !== 'visible') {
          contained = true
          break
        }
        parent = parent.parentElement
      }
      if (!contained) offenders.push(`${el.tagName.toLowerCase()}.${el.className}`.slice(0, 120))
    }
    return offenders
  })
}

for (const width of WIDTHS) {
  test.describe(`layout at ${width}px`, () => {
    for (const target of PAGES) {
      test(`${target.name} fills the screen without sideways scroll`, async ({ browser }) => {
        const path = target.path()
        test.skip(!path, 'No published job in this database')

        const context = await browser.newContext({
          viewport: { width, height: HEIGHT },
          storageState: target.loggedIn ? candidateState : undefined,
        })
        const page = await context.newPage()
        await page.goto(path!)
        await expect(page.locator('main')).toBeVisible()

        // 1. No horizontal scroll, and nothing sticks out of the screen
        const { scrollWidth, clientWidth } = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }))
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
        expect(await findOverflowingElements(page)).toEqual([])

        // 2. Full width: the main page container uses at least 90% of the space between the gutters
        const { contentWidth, available } = await page.evaluate(() => {
          const viewport = document.documentElement.clientWidth
          const boxes = [...document.querySelectorAll<HTMLElement>('main [data-slot="container"], main > *')]
          let best = { contentWidth: 0, available: viewport }
          for (const box of boxes) {
            const style = getComputedStyle(box)
            const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
            const contentWidth = box.getBoundingClientRect().width - padding
            if (contentWidth > best.contentWidth) best = { contentWidth, available: viewport - padding }
          }
          return best
        })
        expect(contentWidth).toBeGreaterThanOrEqual(available * 0.9)

        await context.close()
      })
    }

    test('footer sits at the bottom of a short page', async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width, height: HEIGHT } })
      const page = await context.newPage()
      await page.goto('/jobs/this-job-does-not-exist')
      await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
      const footerBottom = await page
        .getByRole('contentinfo')
        .evaluate((footer) => footer.getBoundingClientRect().bottom + window.scrollY)
      expect(footerBottom).toBeGreaterThanOrEqual(HEIGHT - 1)
      await context.close()
    })
  })
}

test('viewport meta tag is present', async ({ page }) => {
  await page.goto('/login')
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', /width=device-width/)
})

test('dashboard sidebar becomes a drawer on a phone', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 360, height: 740 }, storageState: candidateState })
  const page = await context.newPage()
  await page.goto('/dashboard')
  const nav = page.getByRole('navigation', { name: 'Dashboard' })
  await expect(nav).toBeHidden()
  await page.getByRole('button', { name: 'Open dashboard menu' }).click()
  await expect(nav).toBeVisible()
  await nav.getByRole('link', { name: 'My applications' }).click()
  await page.waitForURL('**/dashboard/applications')
  await expect(nav).toBeHidden()
  await context.close()
})

// Screenshot baselines are tied to the operating system's font rendering, so they are kept
// for local runs only (Windows). CI checks the layout rules above instead.
test.describe('screenshots', () => {
  test.skip(!!process.env.CI, 'Baselines are per operating system')

  for (const width of WIDTHS) {
    test(`404 and login at ${width}px`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width, height: HEIGHT } })
      const page = await context.newPage()

      await page.goto('/jobs/this-job-does-not-exist')
      await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
      await expect(page).toHaveScreenshot(`not-found-${width}.png`, { fullPage: true, animations: 'disabled' })

      await page.goto('/login')
      await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible()
      await expect(page).toHaveScreenshot(`login-${width}.png`, {
        fullPage: true,
        animations: 'disabled',
        // The human check widget comes from Cloudflare and changes between runs
        mask: [page.getByTestId('turnstile')],
      })
      await context.close()
    })
  }
})
