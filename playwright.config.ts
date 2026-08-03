import { defineConfig, devices } from '@playwright/test';
import base from './e2e/playwright.config';

// Shim raíz para `npx playwright test` SIN --config. Cumple dos cosas:
//  1. Evita el default de Playwright (testDir '.') que escanearía src/** y
//     agarraría los tests de Vitest (rompen con "Cannot redefine
//     $$jest-matchers-object").
//  2. Corre SÓLO el smoke autocontenido (API mockeada, sin backend), igual que
//     la vieja config raíz. La suite POM completa de módulos (necesita backend)
//     se corre con `npm run test:e2e` → e2e/playwright.config.ts.
export default defineConfig({
  ...base,
  testDir: './e2e/smoke',
  projects: [{ name: 'smoke', use: { ...devices['Desktop Chrome'] } }],
  reporter: [['html', { outputFolder: 'playwright-report/e2e', open: 'never' }]],
});
