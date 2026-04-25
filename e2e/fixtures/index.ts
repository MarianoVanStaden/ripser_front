/* eslint-disable react-hooks/rules-of-hooks, @typescript-eslint/no-explicit-any, no-empty-pattern */
import { test as base, expect, Page } from '@playwright/test';
import { AuthPage } from '../modules/auth/auth.page';
import { ApiHelpers } from '../utils/api-helpers';
import { ClientesPage, ClienteFormPage } from '../modules/clientes/clientes.page';
import { StockPage } from '../modules/productos/productos.page';
import { PresupuestosPage } from '../modules/ventas/ventas.page';
import { LeadsPage, LeadFormPage } from '../modules/leads/leads.page';
import { EquiposPage, RecetasPage } from '../modules/fabricacion/fabricacion.page';
import { PrestamosPage, PrestamosResumenPage } from '../modules/prestamos/prestamos.page';
import { FlujoCajaPage, BalanceAnualPage } from '../modules/finanzas/finanzas.page';
import { GarantiasPage } from '../modules/garantias/garantias.page';
import { OrdenesServicioPage } from '../modules/taller/taller.page';

/**
 * Custom fixtures that extend Playwright's base test.
 *
 * Every test imports `test` and `expect` from HERE, not from @playwright/test.
 * This gives access to pre-instantiated Page Objects and the API helper.
 *
 * Auto-use fixture `_routeMocks` runs before every test and installs:
 *   1. sessionStorage re-injection (storageState doesn't persist sessionStorage)
 *   2. Non-auth API catch-all → empty paginated response (prevents 401 cascades)
 *   3. auth/validate mock → always 200 (accepts FAKE_JWT from storageState)
 *
 * These are registered BEFORE page.goto() because fixtures run first.
 * Test-specific mocks (e.g. login mock) added in the test body are LIFO-higher
 * and override these fixture-level mocks.
 */

type E2EFixtures = {
  /**
   * Auto-use fixture that installs route mocks and sessionStorage injection
   * for every test.  Tests never reference this fixture by name.
   */
  _routeMocks: void;

  /** Pre-instantiated AuthPage for login/logout actions. */
  authPage: AuthPage;

  /**
   * Authenticated API helper for test setup/teardown.
   * Automatically calls authenticate() before the test runs.
   * If authentication fails (wrong credentials), the test is SKIPPED with a
   * clear message pointing to e2e/.env.dev — it does NOT count as a failure.
   */
  api: ApiHelpers;

  // ─── Clientes ──────────────────────────────────────────────────────────────
  clientesPage: ClientesPage;
  clienteFormPage: ClienteFormPage;

  // ─── Productos ─────────────────────────────────────────────────────────────
  stockPage: StockPage;

  // ─── Ventas ────────────────────────────────────────────────────────────────
  ventasPage: PresupuestosPage;

  // ─── Leads ─────────────────────────────────────────────────────────────────
  leadsPage: LeadsPage;
  leadFormPage: LeadFormPage;

  // ─── Fabricación ───────────────────────────────────────────────────────────
  equiposPage: EquiposPage;
  recetasPage: RecetasPage;

  // ─── Préstamos ─────────────────────────────────────────────────────────────
  prestamosPage: PrestamosPage;
  prestamosResumenPage: PrestamosResumenPage;

  // ─── Finanzas ──────────────────────────────────────────────────────────────
  flujoCajaPage: FlujoCajaPage;
  balanceAnualPage: BalanceAnualPage;

  // ─── Garantías ─────────────────────────────────────────────────────────────
  garantiasPage: GarantiasPage;

  // ─── Taller ────────────────────────────────────────────────────────────────
  ordenesPage: OrdenesServicioPage;
};

export const test = base.extend<E2EFixtures>({
  // ── Auto-use mock setup (runs before every test, no test param needed) ─────
  _routeMocks: [
    async ({ page }, use) => {
      // 0. Re-inject sessionStorage on every navigation.
      //    storageState only persists localStorage; empresaId/sucursalId live in
      //    sessionStorage and must be restored before React mounts.
      await page.addInitScript(() => {
        if (localStorage.getItem('auth_token')) {
          if (!sessionStorage.getItem('empresaId'))    sessionStorage.setItem('empresaId', '1');
          if (!sessionStorage.getItem('sucursalId'))   sessionStorage.setItem('sucursalId', '1');
          if (!sessionStorage.getItem('esSuperAdmin')) sessionStorage.setItem('esSuperAdmin', 'false');
        }
      });

      // 1. Non-auth catch-all (registered first = lower LIFO priority).
      //    Returns empty paginated responses so the app never receives a 401
      //    from the real backend and AuthContext never logs the user out.
      //    Auth endpoints (/api/auth/*) are passed through so login tests work.
      await page.route('**/api/**', (route) => {
        const url = route.request().url();
        if (url.includes('/api/auth/')) return route.continue();

        const type = route.request().resourceType();
        if (type === 'script' || type === 'stylesheet' || type === 'document') {
          return route.continue();
        }

        const accept = route.request().headers()['accept'] ?? '';
        if (accept.includes('text/event-stream')) return route.abort();

        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            content: [], totalElements: 0, totalPages: 0, number: 0, size: 20,
          }),
        });
      });

      // 2. auth/validate mock (registered second = higher LIFO priority).
      //    Accepts FAKE_JWT from storageState without hitting the real backend.
      await page.route('**/api/auth/validate', (route) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
      );

      await use();
    },
    { auto: true },
  ],

  // ── Auth ───────────────────────────────────────────────────────────────────
  authPage: async ({ page }, use) => {
    await use(new AuthPage(page));
  },

  /**
   * Authenticated API helper.
   * If authenticate() fails (wrong credentials in e2e/.env.dev), the test is
   * SKIPPED rather than failing — keeping the failure count at zero until real
   * credentials are configured.
   */
  api: async ({}, use, testInfo) => {
    const api = new ApiHelpers();
    try {
      await api.authenticate();
    } catch (err: any) {
      testInfo.skip(
        true,
        `Backend credentials not configured — update TEST_USERNAME / TEST_PASSWORD in e2e/.env.dev. ` +
          `Original error: ${err?.message ?? String(err)}`
      );
      return;
    }
    await use(api);
  },

  // ─── Clientes ──────────────────────────────────────────────────────────────
  clientesPage: async ({ page }, use) => {
    await use(new ClientesPage(page));
  },

  clienteFormPage: async ({ page }, use) => {
    await use(new ClienteFormPage(page));
  },

  // ─── Productos ─────────────────────────────────────────────────────────────
  stockPage: async ({ page }, use) => {
    await use(new StockPage(page));
  },

  // ─── Ventas ────────────────────────────────────────────────────────────────
  ventasPage: async ({ page }, use) => {
    await use(new PresupuestosPage(page));
  },

  // ─── Leads ─────────────────────────────────────────────────────────────────
  leadsPage: async ({ page }, use) => {
    await use(new LeadsPage(page));
  },

  leadFormPage: async ({ page }, use) => {
    await use(new LeadFormPage(page));
  },

  // ─── Fabricación ───────────────────────────────────────────────────────────
  equiposPage: async ({ page }, use) => {
    await use(new EquiposPage(page));
  },

  recetasPage: async ({ page }, use) => {
    await use(new RecetasPage(page));
  },

  // ─── Préstamos ─────────────────────────────────────────────────────────────
  prestamosPage: async ({ page }, use) => {
    await use(new PrestamosPage(page));
  },

  prestamosResumenPage: async ({ page }, use) => {
    await use(new PrestamosResumenPage(page));
  },

  // ─── Finanzas ──────────────────────────────────────────────────────────────
  flujoCajaPage: async ({ page }, use) => {
    await use(new FlujoCajaPage(page));
  },

  balanceAnualPage: async ({ page }, use) => {
    await use(new BalanceAnualPage(page));
  },

  // ─── Garantías ─────────────────────────────────────────────────────────────
  garantiasPage: async ({ page }, use) => {
    await use(new GarantiasPage(page));
  },

  // ─── Taller ────────────────────────────────────────────────────────────────
  ordenesPage: async ({ page }, use) => {
    await use(new OrdenesServicioPage(page));
  },
});

export { expect };
export type { Page };
