/**
 * Centralized environment configuration for E2E tests.
 *
 * Values are loaded from the active .env.{TEST_ENV} file by playwright.config.ts.
 * All process.env reads happen here — Page Objects and tests import from this file.
 */
export const ENV = {
  BASE_URL: process.env.BASE_URL ?? 'http://localhost:5173',

  /** Direct backend URL (bypasses the Vite proxy — used for API seeding helpers). */
  API_URL: process.env.API_URL ?? 'http://localhost:8080/RipserApp',

  /** Default test user credentials. */
  USERNAME: process.env.TEST_USERNAME ?? 'adminempresa',
  PASSWORD: process.env.TEST_PASSWORD ?? '000',

  /** Tenant context injected into every API call header. */
  EMPRESA_ID: Number(process.env.TEST_EMPRESA_ID ?? 1),
  SUCURSAL_ID: Number(process.env.TEST_SUCURSAL_ID ?? 1),

  /** Path where the auth storage state is saved by the setup project. */
  AUTH_STATE_PATH: 'e2e/.auth/user.json',
} as const;
