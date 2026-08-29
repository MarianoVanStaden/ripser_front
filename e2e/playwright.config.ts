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

// La SPA vive bajo /ripser (base de vite.config.ts): el baseURL incluye el
// subpath. OJO: los specs navegan con rutas RELATIVAS — page.goto('./x') —
// porque una ruta con barra inicial ('/x') resuelve contra el origin y
// pierde el subpath (semántica de new URL()).
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173/ripser/';

// Config ÚNICA de E2E (antes había una segunda en la raíz para smoke sin auth;
// ahora ese smoke vive en e2e/smoke/ como el proyecto `smoke`).
// Convención: los specs son *.spec.ts. Los *.page.ts son POMs y *.setup.ts es
// el setup de auth — ninguno de esos matchea como test.
export default defineConfig({
  // Raíz de e2e: cada proyecto acota qué corre con su propio testMatch.
  testDir: '.',

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : undefined,

  reporter: [
    ['html', { outputFolder: '../playwright-report/e2e', open: 'never' }],
    ['json', { outputFile: '../playwright-report/e2e/results.json' }],
    ...(process.env.CI ? ([['github']] as [string][]) : []),
  ],

  use: {
    baseURL: BASE_URL,
    testIdAttribute: 'data-testid',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    /**
     * SETUP — corre una vez antes de los módulos autenticados. Loguea con
     * credenciales reales y guarda el estado en e2e/.auth/user.json.
     */
    {
      name: 'setup',
      testMatch: /modules\/auth\/auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    /**
     * AUTH — valida la UI de login; debe arrancar SIN sesión.
     * auth.spec.ts fuerza storageState vacío. No depende de setup.
     */
    {
      name: 'auth',
      testMatch: /modules\/auth\/auth\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    /**
     * SMOKE — humo de rutas públicas / navegación, SIN autenticación.
     * Migrado desde la antigua config raíz (tests/). No depende de setup.
     */
    {
      name: 'smoke',
      testMatch: /smoke\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    /**
     * MÓDULOS — el resto de los specs, autenticados vía storageState.
     * Depende de que 'setup' haya corrido. Ignora auth.spec.ts (lo corre 'auth').
     */
    {
      name: 'chromium',
      testMatch: /modules\/.*\.spec\.ts/,
      // Ignora auth.spec.ts (lo corre 'auth') y los *.mobile.spec.ts
      // (los corren los proyectos mobile-* con viewport de teléfono).
      testIgnore: [/modules\/auth\/auth\.spec\.ts/, /\.mobile\.spec\.ts/],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    /**
     * MOBILE — specs *.mobile.spec.ts en viewport de teléfono (flujos de
     * campo: entregas, checklists, garantías). Autenticados vía el mismo
     * storageState que 'chromium'.
     */
    {
      name: 'mobile-android',
      testMatch: /.*\.mobile\.spec\.ts/,
      use: {
        ...devices['Pixel 5'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-ios',
      testMatch: /.*\.mobile\.spec\.ts/,
      use: {
        ...devices['iPhone 13'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
