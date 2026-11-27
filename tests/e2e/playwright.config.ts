// End-to-end tests: the built app (dist/) in a real browser.
// Run with `bun run test:e2e`. CDN libraries are fetched from the network.
import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.E2E_PORT || 4173);

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.e2e.ts',
  timeout: 120_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  outputDir: '../../test-results',
  use: {
    baseURL: `http://localhost:${PORT}`,
    // The service worker reloads the page when it activates (PLT-004): block it.
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `bun run build && PORT=${PORT} bun run scripts/serve.ts`,
    cwd: '../..',
    url: `http://localhost:${PORT}/index.html`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
