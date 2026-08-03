import { test, expect } from '../../fixtures';

/**
 * Garantías module — E2E tests.
 *
 * Covers:
 *   - /garantias/registro   (GarantiasPage)
 *   - /garantias/reclamos   (ReclamosGarantiaPage)
 *   - /garantias/reporte    (GarantiaReportPage)
 *
 * Tests 1–3 are pure UI (no api fixture needed).
 * Test 4 seeds via api and is skipped if credentials are absent.
 */

test.describe('Garantías', () => {
  // ── 1. Registration list renders ──────────────────────────────────────────

  test('should render the garantías list with all expected elements', async ({
    garantiasPage,
  }) => {
    await garantiasPage.goto();
    await garantiasPage.assertOnPage();

    await expect(garantiasPage.nuevaGarantiaButton).toBeVisible();
    await expect(garantiasPage.searchInput).toBeVisible();
    await expect(garantiasPage.estadoFilter).toBeVisible();
  });

  // ── 2. Search accepts input ───────────────────────────────────────────────

  test('should accept search input and not crash', async ({ garantiasPage }) => {
    await garantiasPage.goto();
    await garantiasPage.assertOnPage();

    await garantiasPage.buscar('Heladera 1.5m');
    await expect(garantiasPage.searchInput).toHaveValue('Heladera 1.5m');

    await garantiasPage.searchInput.clear();
    await expect(garantiasPage.searchInput).toHaveValue('');
  });

  // ── 3. "Nueva Garantía" opens dialog ─────────────────────────────────────

  test('should open a dialog or form on "Nueva Garantía" click', async ({
    garantiasPage,
    page,
  }) => {
    await garantiasPage.goto();
    await garantiasPage.assertOnPage();

    await garantiasPage.nuevaGarantiaButton.click();

    // Expect either a dialog or navigation to a form route
    const dialogOrForm = page.getByRole('dialog')
      .or(page.locator('[class*="Form"],[data-testid*="form"]'));
    await expect(dialogOrForm.first()).toBeVisible({ timeout: 8_000 });
  });

  // ── 4. Reclamos page renders ──────────────────────────────────────────────

  test('should render the reclamos page without crashing', async ({ page }) => {
    await page.goto('/garantias/reclamos');
    await expect(page).toHaveURL(/\/garantias\/reclamos/, { timeout: 10_000 });
    await expect(page.locator('body')).not.toContainText('Error: ');
  });

  // ── 5. Reporte page renders ───────────────────────────────────────────────

  test('should render the garantías reporte page without crashing', async ({ page }) => {
    await page.goto('/garantias/reporte');
    await expect(page).toHaveURL(/\/garantias\/reporte/, { timeout: 10_000 });
    await expect(page.locator('body')).not.toContainText('Error: ');
  });
});
