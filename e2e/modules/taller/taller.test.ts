import { test, expect } from '../../fixtures';

/**
 * Taller module — E2E tests.
 *
 * Covers:
 *   - /taller/ordenes       (OrdenesServicioPage)
 *   - /taller/materiales    (ControlMaterialesPage)
 *   - /taller/tareas        (AsignacionTareasPage)
 *   - /taller/trabajos      (TrabajosRealizadosPage)
 *   - /taller/configuracion (ConfiguracionTallerPage)
 *
 * All tests are pure UI — work with fixture-level empty API mock.
 * CRUD lifecycle tests require `api` fixture and skip when credentials are absent.
 */

test.describe('Taller', () => {
  // ── 1. Órdenes list renders ───────────────────────────────────────────────

  test('should render the órdenes de servicio page with all expected elements', async ({
    ordenesPage,
  }) => {
    await ordenesPage.goto();
    await ordenesPage.assertOnPage();

    await expect(ordenesPage.searchInput).toBeVisible();
    await expect(ordenesPage.estadoFilter).toBeVisible();
  });

  // ── 2. Search input ───────────────────────────────────────────────────────

  test('should accept search input and not crash', async ({ ordenesPage }) => {
    await ordenesPage.goto();
    await ordenesPage.assertOnPage();

    await ordenesPage.buscar('Cliente test');
    await expect(ordenesPage.searchInput).toHaveValue('Cliente test');
  });

  // ── 3. "Nueva Orden" opens form panel ────────────────────────────────────

  test('should open the nueva orden form on button click', async ({ ordenesPage }) => {
    await ordenesPage.goto();
    await ordenesPage.assertOnPage();

    await ordenesPage.clickNuevaOrden();
    await ordenesPage.assertFormVisible();

    // Close the form
    await ordenesPage.closeForm();
  });

  // ── 4. Sub-pages render without crashing ─────────────────────────────────

  test('should render /taller/materiales without crashing', async ({ page }) => {
    await page.goto('/taller/materiales');
    await expect(page).toHaveURL(/\/taller\/materiales/, { timeout: 10_000 });
    await expect(page.locator('body')).not.toContainText('Error: ');
  });

  test('should render /taller/tareas without crashing', async ({ page }) => {
    await page.goto('/taller/tareas');
    await expect(page).toHaveURL(/\/taller\/tareas/, { timeout: 10_000 });
    await expect(page.locator('body')).not.toContainText('Error: ');
  });

  test('should render /taller/trabajos without crashing', async ({ page }) => {
    await page.goto('/taller/trabajos');
    await expect(page).toHaveURL(/\/taller\/trabajos/, { timeout: 10_000 });
    await expect(page.locator('body')).not.toContainText('Error: ');
  });

  test('should render /taller/configuracion without crashing', async ({ page }) => {
    await page.goto('/taller/configuracion');
    await expect(page).toHaveURL(/\/taller\/configuracion/, { timeout: 10_000 });
    await expect(page.locator('body')).not.toContainText('Error: ');
  });

  // ── 5. Lifecycle via API (skipped without credentials) ───────────────────

  test('should create and find an orden de servicio via API', async ({
    ordenesPage,
    api,
  }) => {
    const data = {
      descripcionTrabajo: `Test orden ${Date.now()}`,
      observaciones: 'Creado por test E2E',
      estado: 'PENDIENTE',
    };
    let ordenId: number | undefined;

    try {
      const created = await api.ordenes.create(data);
      ordenId = created?.id ?? created?.data?.id;

      await ordenesPage.goto();
      await ordenesPage.assertOnPage();

      await ordenesPage.buscar(data.descripcionTrabajo);
      await expect(
        ordenesPage.page.getByText(data.descripcionTrabajo, { exact: false })
      ).toBeVisible({ timeout: 8_000 });
    } finally {
      if (ordenId !== undefined) {
        await api.ordenes.delete(ordenId).catch(() => {});
      }
    }
  });
});
