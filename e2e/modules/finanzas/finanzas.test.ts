import { test, expect } from '../../fixtures';

/**
 * Finanzas module — E2E tests.
 *
 * Covers:
 *   - /admin/flujo-caja      (FlujoCajaPage)
 *   - /admin/balance         (BalanceAnualPage)
 *
 * All tests are pure navigation/render checks.
 * With the fixture-level API mock, chart data is empty but pages should render.
 */

test.describe('Finanzas', () => {
  // ── Flujo de Caja ─────────────────────────────────────────────────────────

  test('should navigate to the flujo de caja route without crashing', async ({
    flujoCajaPage,
    page,
  }) => {
    await flujoCajaPage.goto();
    // Verify the URL resolved — the route exists and Auth redirected correctly
    await expect(page).toHaveURL(/\/admin\/flujo-caja/, { timeout: 10_000 });
    // Sidebar nav item confirms the app layout rendered
    await expect(page.getByText(/flujo de caja/i).first()).toBeVisible();
  });

  test('should show the flujo de caja nav item in the sidebar', async ({ flujoCajaPage }) => {
    await flujoCajaPage.goto();
    await expect(flujoCajaPage.heading).toBeVisible({ timeout: 10_000 });
  });

  // ── Balance Anual ─────────────────────────────────────────────────────────

  test('should render the balance anual page without crashing', async ({
    balanceAnualPage,
    page,
  }) => {
    await balanceAnualPage.goto();
    await balanceAnualPage.assertOnPage();

    await expect(page.locator('body')).not.toContainText('Error: ');
  });

  // ── Amortizaciones ────────────────────────────────────────────────────────

  test('should render the amortizaciones page without crashing', async ({ page }) => {
    await page.goto('/admin/amortizaciones');
    await expect(page).toHaveURL(/\/admin\/amortizaciones/, { timeout: 10_000 });
    await expect(page.locator('body')).not.toContainText('Error: ');
  });

  // ── Posición Patrimonial ──────────────────────────────────────────────────

  test('should render the posición patrimonial page without crashing', async ({ page }) => {
    await page.goto('/admin/patrimonio');
    await expect(page).toHaveURL(/\/admin\/patrimonio/, { timeout: 10_000 });
    await expect(page.locator('body')).not.toContainText('Error: ');
  });
});
