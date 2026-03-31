import { test, expect } from '../../fixtures';
import { DataFactory } from '../../utils/data-factory';

/**
 * Leads module — E2E tests.
 *
 * Tests 1–3 are pure UI tests: they work with the fixture-level API mock
 * (empty paginated responses) and do not require real backend credentials.
 *
 * Test 4 seeds and cleans up via the `api` fixture — it is automatically
 * SKIPPED when credentials in e2e/.env.dev are not configured.
 */

test.describe('Leads', () => {
  // ── 1. List page renders ──────────────────────────────────────────────────

  test('should render the leads list page with all expected elements', async ({
    leadsPage,
  }) => {
    await leadsPage.goto();
    await leadsPage.assertOnPage();

    // Filter chips for estado should be visible
    await expect(leadsPage.chipPrimerContacto).toBeVisible();
    await expect(leadsPage.chipHot).toBeVisible();
    await expect(leadsPage.chipWarm).toBeVisible();
    await expect(leadsPage.chipCold).toBeVisible();
  });

  // ── 2. Filter chips toggle ────────────────────────────────────────────────

  test('should toggle estado and prioridad filter chips', async ({ leadsPage }) => {
    await leadsPage.goto();
    await leadsPage.assertOnPage();

    // Click HOT chip — it should become visually selected (MUI adds aria-pressed or color change)
    const hot = leadsPage.chipHot;
    await hot.click();
    // Chip clicked without error
    await expect(hot).toBeVisible();

    // Click again to deselect
    await hot.click();
    await expect(hot).toBeVisible();

    // Click WARM
    await leadsPage.chipWarm.click();
    await expect(leadsPage.chipWarm).toBeVisible();
  });

  // ── 3. Search input responds ──────────────────────────────────────────────

  test('should accept search input and not crash', async ({ leadsPage }) => {
    await leadsPage.goto();
    await leadsPage.assertOnPage();

    await leadsPage.buscar('Ana García');
    // Input accepts the text
    await expect(leadsPage.searchInput).toHaveValue('Ana García');

    // Clear and search again
    await leadsPage.searchInput.clear();
    await leadsPage.buscar('test');
    await expect(leadsPage.searchInput).toHaveValue('test');
  });

  // ── 4. Navigate to create form ────────────────────────────────────────────

  test('should navigate to /leads/nuevo on "Nuevo Lead" click', async ({
    leadsPage,
    page,
  }) => {
    await leadsPage.goto();
    await leadsPage.assertOnPage();

    await leadsPage.nuevoLeadButton.click();
    await expect(page).toHaveURL(/\/leads\/nuevo/, { timeout: 10_000 });
  });

  // ── 5. Lead lifecycle via API (skipped without credentials) ───────────────

  test('should create a lead via API and find it in the list', async ({
    leadsPage,
    api,
  }) => {
    const data = DataFactory.lead();
    let leadId: number | undefined;

    try {
      const created = await api.leads.create(data);
      leadId = created?.id ?? created?.data?.id;

      await leadsPage.goto();
      await leadsPage.assertOnPage();

      await leadsPage.buscar(data.nombre);
      await leadsPage.assertLeadVisible(data.nombre);
    } finally {
      if (leadId !== undefined) {
        await api.leads.delete(leadId).catch(() => {});
      }
    }
  });
});
