import { defineConfig, devices } from '@playwright/test'

const port = 4173

/**
 * Chromium-only smoke tests against `vite preview`.
 * The production bundle must already exist (`npm run build` with the CI dummy hosts).
 * Preview does not rebuild, so the suite matches the files that would be deployed.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.pw.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],
  outputDir: 'test-results',
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run preview',
    url: `http://127.0.0.1:${port}/admin/`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    stdout: 'ignore',
    stderr: 'pipe',
    // vite.config.ts refuses to boot in production mode unless these are set.
    // They are already inlined into dist by `npm run build`; preview only re-reads them.
    env: {
      VITE_API_BASE: 'https://api.example.invalid',
      VITE_COGNITO_DOMAIN: 'auth.example.invalid',
      VITE_COGNITO_CLIENT_ID: 'ci-client',
    },
  },
})
