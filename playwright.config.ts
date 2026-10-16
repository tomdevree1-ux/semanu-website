import { defineConfig, devices } from '@playwright/test';

const PORT = 3000;
const baseURL = `http://localhost:${PORT}`;

/**
 * E2E smoke. Tests live in ./e2e (outside src/, so Vitest never picks them up).
 * The webServer runs `next dev`; the smoke only exercises rendering + client-side
 * wizard navigation, so it needs no real backend/secrets (CI passes placeholders).
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL, trace: 'on-first-retry' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: `${baseURL}/de`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
