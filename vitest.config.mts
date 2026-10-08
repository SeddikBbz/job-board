import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    projects: [
      {
        // Pure functions: fast, no database
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['tests/unit/**/*.test.ts'],
        },
      },
      {
        // React components rendered in a simulated browser (jsdom), no database
        extends: true,
        plugins: [react()],
        test: {
          name: 'component',
          environment: 'jsdom',
          include: ['tests/component/**/*.test.tsx'],
          // The default "forks" pool timed out on Windows while loading jsdom; threads start faster
          pool: 'threads',
        },
      },
      {
        // Access control through the Payload Local API: needs DATABASE_URI
        extends: true,
        test: {
          name: 'int',
          environment: 'node',
          include: ['tests/int/**/*.int.spec.ts'],
          setupFiles: ['./vitest.setup.ts'],
          // Remote database round trips are slow; run files one at a time
          testTimeout: 120_000,
          hookTimeout: 300_000,
          fileParallelism: false,
        },
      },
    ],
  },
})
