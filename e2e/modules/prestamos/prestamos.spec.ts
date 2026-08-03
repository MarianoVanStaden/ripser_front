import { test, expect } from '../../fixtures';

/**
 * Préstamos module — E2E tests.
 *
 * Covers:
 *   - /prestamos/lista     (PrestamosListPage)
 *   - /prestamos/resumen   (PrestamosResumenPage)
 *
 * All pure-UI tests pass with the fixture-level empty API mock.
 * The lifecycle test (seeding via api) is skipped when credentials are absent.
 */

test.describe('Préstamos', () => {
  // ── 1. List page renders ──────────────────────────────────────────────────

  test('should render the préstamos list with all expected elements', async ({
    prestamosPage,
  }) => {
    await prestamosPage.goto();
    await prestamosPage.assertOnPage();

    // Estado filter chips
    await expect(prestamosPage.chipActivo).toBeVisible();
    await expect(prestamosPage.chipEnMora).toBeVisible();
    await expect(prestamosPage.chipFinalizado).toBeVisible();
    await expect(prestamosPage.chipEnLegal).toBeVisible();

    // Categoría chips
    await expect(prestamosPage.chipNormal).toBeVisible();
    await expect(prestamosPage.chipAltoRiesgo).toBeVisible();
  });

  // ── 2. Search input ───────────────────────────────────────────────────────

  test('should accept search input without crashing', async ({ prestamosPage }) => {
    await prestamosPage.goto();
    await prestamosPage.assertOnPage();

    await prestamosPage.buscar('García');
    await expect(prestamosPage.searchInput).toHaveValue('García');

    await prestamosPage.searchInput.clear();
    await expect(prestamosPage.searchInput).toHaveValue('');
  });

  // ── 3. Filter chips toggle ────────────────────────────────────────────────

  test('should toggle estado filter chips without crashing', async ({ prestamosPage }) => {
    await prestamosPage.goto();
    await prestamosPage.assertOnPage();

    // Click EN_MORA chip
    await prestamosPage.filterByEstado(prestamosPage.chipEnMora);
    await expect(prestamosPage.chipEnMora).toBeVisible();

    // Click ALTO_RIESGO categoría chip
    await prestamosPage.filterByEstado(prestamosPage.chipAltoRiesgo);
    await expect(prestamosPage.chipAltoRiesgo).toBeVisible();

    // Deselect both
    await prestamosPage.filterByEstado(prestamosPage.chipEnMora);
    await prestamosPage.filterByEstado(prestamosPage.chipAltoRiesgo);
  });

  // ── 4. Resumen page renders ───────────────────────────────────────────────

  test('should render the resumen page without crashing', async ({
    prestamosResumenPage,
    page,
  }) => {
    await prestamosResumenPage.goto();
    await prestamosResumenPage.assertOnPage();

    await expect(page.locator('body')).not.toContainText('Error: ');
  });
});
