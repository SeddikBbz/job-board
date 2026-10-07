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
