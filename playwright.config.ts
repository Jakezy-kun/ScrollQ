import { defineConfig, devices } from '@playwright/test';

const DEV_PORT = 5174;
const PREVIEW_PORT = 4174;

/**
 * End-to-end tests on a phone-sized Chromium.
 * - mobile-chromium: the dev server in `e2e` mode, with Supabase pointed at a fake URL the
 *   tests intercept (e2e/support/mockSupabase.ts), so the account flow needs no real project.
 * - pwa: the production build, to check the service worker and offline play.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    trace: 'retain-on-failure',
    ...devices['Pixel 7'],
  },
  projects: [
    {
      name: 'mobile-chromium',
      testIgnore: /pwa\.spec\.ts/,
      use: { baseURL: `http://localhost:${DEV_PORT}` },
    },
    {
      name: 'pwa',
      testMatch: /pwa\.spec\.ts/,
      use: { baseURL: `http://localhost:${PREVIEW_PORT}` },
    },
  ],
  webServer: [
    {
      command: `npx vite --port ${DEV_PORT} --strictPort --mode e2e`,
      url: `http://localhost:${DEV_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: `npx vite build --outDir dist-e2e && npx vite preview --outDir dist-e2e --port ${PREVIEW_PORT} --strictPort`,
      url: `http://localhost:${PREVIEW_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
});
