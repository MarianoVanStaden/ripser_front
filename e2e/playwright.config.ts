import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment-specific .env file based on TEST_ENV (defaults to 'dev').
// override: true ensures values from the file always win over inherited env vars.
dotenv.config({
  path: path.resolve(__dirname, `.env.${process.env.TEST_ENV ?? 'dev'}`),
  override: true,
});

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173';

export default defineConfig({
  // All tests live under e2e/modules/
  testDir: './modules',

  // Fully parallel — each test runs in its own worker
  fullyParallel: true,

  // Fail fast on test.only left in source (critical for CI)
  forbidOnly: !!process.env.CI,

  // Retry on CI and locally to absorb rendering flakiness on heavy ERP pages
  retries: process.env.CI ? 2 : 1,

  // CI: 2 workers to stay within resource limits; local: auto
  workers: process.env.CI ? 2 : undefined,

  // Reporters: HTML for local review, JSON for CI artifact parsing, GitHub for PR annotations
  reporter: [
    ['html', { outputFolder: '../playwright-report/e2e', open: 'never' }],
    ['json', { outputFile: '../playwright-report/e2e/results.json' }],
    ...(process.env.CI ? (['github'] as any[]) : []),
  ],

  use: {
    // All relative page.goto() calls use this base
    baseURL: BASE_URL,

    // Attribute used by getByTestId() — must match what's in the components
    testIdAttribute: 'data-testid',

    // Capture on failure for debugging
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Trace: record on first retry so CI has a trace to inspect on flakes
    trace: 'on-first-retry',

    // Generous timeouts for the ERP's heavier pages
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    /**
     * SETUP PROJECT
     * Runs auth.setup.ts once before any other project.
     * Logs in with real credentials and saves auth state to .auth/user.json.
     * All authenticated projects depend on this.
     */
    {
      name: 'setup',
      testMatch: /.*auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    /**
     * AUTH TESTS
     * Tests that validate the login UI itself — must start unauthenticated.
     * Does NOT depend on the setup project.
     * auth.test.ts overrides storageState to empty to ensure clean state.
     */
    {
      name: 'auth',
      testMatch: /.*auth\/auth\.test\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    /**
     * MAIN CHROMIUM PROJECT
     * All other modules run here, authenticated via storageState.
     * Depends on 'setup' having completed successfully.
     */
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
      testIgnore: [/.*auth\.setup\.ts/, /.*auth\/auth\.test\.ts/],
    },

    // Uncomment for cross-browser coverage:
    // {
    //   name: 'firefox',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //     storageState: 'e2e/.auth/user.json',
    //   },
    //   dependencies: ['setup'],
    //   testIgnore: [/.*auth\.setup\.ts/, /.*auth\/auth\.test\.ts/],
    // },
  ],

  // Start the Vite dev server automatically before tests
  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    // Reuse a running server locally; always start fresh on CI
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
