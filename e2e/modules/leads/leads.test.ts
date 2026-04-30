import { test, expect } from '../../fixtures';
import { DataFactory } from '../../utils/data-factory';
import { LeadFormPage } from './leads.page';

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

  // ── 5. Detección de teléfono duplicado ───────────────────────────────────

  test('should show DuplicatePhoneDialog and navigate to existing lead on 409', async ({
    page,
  }) => {
    const TELEFONO = '1112345678';
    const EXISTING_ID = 42;

    // Mock POST /api/leads → 409 TELEFONO_DUPLICADO
    await page.route('**/api/leads', async (route) => {
      if (route.request().method() !== 'POST') { await route.fallback(); return; }
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          tipo: 'TELEFONO_DUPLICADO',
          existingId: EXISTING_ID,
          existingType: 'LEAD',
          existingNombre: 'Juan Pérez',
          telefono: TELEFONO,
        }),
      });
    });

    const formPage = new LeadFormPage(page);
    await page.goto('/leads/nuevo');
    await formPage.assertOnPage();

    await formPage.fillMinimo('Test Duplicate', TELEFONO);
    await formPage.submitButton.click();

    // Dialog debe aparecer con el teléfono
    await formPage.assertDuplicateDialogVisible(TELEFONO);

    // Texto "Juan Pérez" debe estar visible
    await expect(page.getByText('Juan Pérez')).toBeVisible();

    // Click en "Ir al lead existente" → navega a /leads/42
    await formPage.duplicateGoToButton.click();
    await expect(page).toHaveURL(new RegExp(`/leads/${EXISTING_ID}`), { timeout: 10_000 });
  });

  test('should close DuplicatePhoneDialog and stay on form when Cancel clicked', async ({
    page,
  }) => {
    await page.route('**/api/leads', async (route) => {
      if (route.request().method() !== 'POST') { await route.fallback(); return; }
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          tipo: 'TELEFONO_DUPLICADO',
          existingId: 7,
          existingType: 'CLIENTE',
          existingNombre: 'Empresa ABC',
          telefono: '9998887777',
        }),
      });
    });

    const formPage = new LeadFormPage(page);
    await page.goto('/leads/nuevo');
    await formPage.fillMinimo('Test Cancel', '9998887777');
    await formPage.submitButton.click();

    await expect(formPage.duplicateDialog).toBeVisible({ timeout: 8_000 });
    await formPage.duplicateCancelButton.click();

    // Dialog se cierra, sigue en /leads/nuevo
    await expect(formPage.duplicateDialog).not.toBeVisible();
    await expect(page).toHaveURL(/\/leads\/nuevo/);
  });

  // ── 6. Lead lifecycle via API (skipped without credentials) ───────────────

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
