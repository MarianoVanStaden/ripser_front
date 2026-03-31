import { test, expect } from '../../fixtures';

/**
 * Fabricación module — E2E tests.
 *
 * Covers:
 *   - /fabricacion/equipos  (EquiposList)
 *   - /fabricacion/recetas  (RecetasList)
 *
 * All tests are pure UI — they work with the fixture-level empty API mock
 * and do not require real backend credentials.
 */

// ─── Equipos ──────────────────────────────────────────────────────────────────

test.describe('Fabricación — Equipos', () => {
  test('should render the equipos list with all expected elements', async ({
    equiposPage,
  }) => {
    await equiposPage.goto();
    await equiposPage.assertOnPage();

    // Both tabs should exist
    await expect(equiposPage.tabLista).toBeVisible();
    await expect(equiposPage.tabKpis).toBeVisible();

    // Filter selects should be present
    await expect(equiposPage.tipoFilter).toBeVisible();
    await expect(equiposPage.estadoFabricacionFilter).toBeVisible();
    await expect(equiposPage.estadoAsignacionFilter).toBeVisible();
  });

  test('should switch between Lista and KPIs tabs', async ({ equiposPage }) => {
    await equiposPage.goto();
    await equiposPage.assertOnPage();

    // Start on Lista tab (default)
    await expect(equiposPage.tabLista).toHaveAttribute('aria-selected', 'true');

    // Switch to KPIs
    await equiposPage.gotoKpisTab();
    await expect(equiposPage.tabKpis).toHaveAttribute('aria-selected', 'true');
    await expect(equiposPage.tabLista).toHaveAttribute('aria-selected', 'false');

    // Switch back to Lista
    await equiposPage.gotoListaTab();
    await expect(equiposPage.tabLista).toHaveAttribute('aria-selected', 'true');
  });

  test('should navigate to /fabricacion/equipos/nuevo on "Nuevo Equipo" click', async ({
    equiposPage,
    page,
  }) => {
    await equiposPage.goto();
    await equiposPage.assertOnPage();

    await equiposPage.nuevoEquipoButton.click();
    await expect(page).toHaveURL(/\/fabricacion\/equipos\/nuevo/, { timeout: 10_000 });
  });

  test('should render the KPIs tab without crashing', async ({ equiposPage, page }) => {
    await equiposPage.goto();
    await equiposPage.gotoKpisTab();

    // Page should not show a JS error boundary
    await expect(page.locator('body')).not.toContainText('Error: ');
    // URL stays on equipos
    await expect(page).toHaveURL(/\/fabricacion\/equipos/);
  });
});

// ─── Recetas ──────────────────────────────────────────────────────────────────

test.describe('Fabricación — Recetas', () => {
  test('should render the recetas list with all expected elements', async ({
    recetasPage,
  }) => {
    await recetasPage.goto();
    await recetasPage.assertOnPage();

    await expect(recetasPage.nuevaRecetaButton).toBeVisible();
    await expect(recetasPage.searchInput).toBeVisible();
    await expect(recetasPage.tipoFilter).toBeVisible();
  });

  test('should accept search input and not crash', async ({ recetasPage }) => {
    await recetasPage.goto();
    await recetasPage.assertOnPage();

    await recetasPage.buscar('Heladera 1m');
    await expect(recetasPage.searchInput).toHaveValue('Heladera 1m');
  });

  test('should navigate to /fabricacion/recetas/nueva on "Nueva Receta" click', async ({
    recetasPage,
    page,
  }) => {
    await recetasPage.goto();
    await recetasPage.assertOnPage();

    await recetasPage.nuevaRecetaButton.click();
    await expect(page).toHaveURL(/\/fabricacion\/recetas\/nueva/, { timeout: 10_000 });
  });
});
