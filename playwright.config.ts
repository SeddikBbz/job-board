import { defineConfig, devices } from '@playwright/test'
import 'dotenv/config'

/**
 * End-to-end tests: https://playwright.dev/docs/test-configuration
 * They use the same database as `pnpm dev` and delete their own data afterwards
 * (every test user has an @e2e.test email).
 */
export default defineConfig({
  testDir: './tests/e2e',
  globalTeardown: './tests/e2e/global-teardown.ts',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // One shared database: run tests one after another
  workers: 1,
  timeout: 180_000,
  expect: { timeout: 30_000 },
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    actionTimeout: 30_000,
    navigationTimeout: 90_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chromium' },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    env: {
      // The suite registers several accounts within minutes (never honoured in production)
      DISABLE_RATE_LIMIT: '1',
      // Send emails to Mailpit when it runs; the email test is skipped otherwise
      SMTP_HOST: process.env.SMTP_HOST || 'localhost',
      SMTP_PORT: process.env.SMTP_PORT || '1025',
    },
  },
})
