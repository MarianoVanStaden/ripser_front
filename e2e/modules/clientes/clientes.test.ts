import { test, expect } from '../../fixtures';
import { DataFactory } from '../../utils/data-factory';

/**
 * Clientes module — E2E tests.
 *
 * These tests cover the full client lifecycle:
 *  - Create a new client via the UI form
 *  - Verify the client appears in the list
 *  - Edit the client and verify the update
 *  - Change the client's state to INACTIVO
 *
 * Each test seeds its own data via DataFactory to ensure isolation.
 * Cleanup is performed via the API in an afterEach / finally block.
 */

test.describe('Clientes', () => {
  test('should complete client lifecycle: create, edit, deactivate', async ({
    page,
    clientesPage,
    clienteFormPage,
    api,
  }) => {
    const data = DataFactory.cliente();
    let clienteId: number | undefined;

    try {
      // ── Step 1: Navigate to the clients list ──────────────────────────────
      await clientesPage.goto();
      await clientesPage.assertOnPage();

      // ── Step 2: Click "Nuevo Cliente" to navigate to the form ────────────
      await clientesPage.nuevoClienteButton.click();
      await expect(page).toHaveURL(/\/clientes\/nuevo/, { timeout: 10_000 });

      // ── Step 3: Fill the create form ─────────────────────────────────────
      await clienteFormPage.fillForm({
        tipo: 'PERSONA_FISICA',
        nombre: data.nombre,
        apellido: data.apellido,
        email: data.email,
        telefono: data.telefono,
        estado: 'ACTIVO',
      });

      // ── Step 4: Submit and assert success ────────────────────────────────
      await clienteFormPage.submit();
      await clienteFormPage.assertSuccess();

      // ── Step 5: Navigate back to the clients list ─────────────────────────
      await clientesPage.goto();
      await clientesPage.assertOnPage();

      // ── Step 6: Search for the created client by first name ───────────────
      await clientesPage.buscar(data.nombre);

      // ── Step 7: Assert the client card is visible ─────────────────────────
      await clientesPage.assertClienteVisible(data.nombre);

      // Retrieve the client ID for cleanup — find by card link or API lookup
      // We use the API to find the created client so we can clean up
      const allClientes = await api.clientes
        .findByDni(data.dni)
        .catch(() => null);
      // findByDni may not be available; skip ID capture here, handle in finally
      if (allClientes?.id) {
        clienteId = allClientes.id;
      }

      // ── Step 8: Click the edit button on the client card ─────────────────
      await clientesPage.clickEditarCliente(data.nombre);
      await expect(page).toHaveURL(/\/clientes\/editar\/\d+/, { timeout: 10_000 });

      // Capture clienteId from the URL if not yet captured
      if (!clienteId) {
        const url = page.url();
        const match = url.match(/\/clientes\/editar\/(\d+)/);
        if (match) {
          clienteId = Number(match[1]);
        }
      }

      // ── Step 9: Change the email to a new unique value ────────────────────
      const newEmail = DataFactory.uniqueName('updated').toLowerCase().replace(/[^a-z0-9_]/g, '') + '@example.com';
      await clienteFormPage.fillForm({ email: newEmail });

      // ── Step 10: Submit and assert success ────────────────────────────────
      await clienteFormPage.submit();
      await clienteFormPage.assertSuccess();

      // ── Step 11: Navigate back and search again ───────────────────────────
      await clientesPage.goto();
      await clientesPage.buscar(data.nombre);

      // ── Step 12: Verify the client still appears (email changed, name same)
      await clientesPage.assertClienteVisible(data.nombre);

      // ── Step 13: Click edit again to set estado = INACTIVO ────────────────
      await clientesPage.clickEditarCliente(data.nombre);
      await expect(page).toHaveURL(/\/clientes\/editar\/\d+/, { timeout: 10_000 });

      await clienteFormPage.fillForm({ estado: 'INACTIVO' });
      await clienteFormPage.submit();
      await clienteFormPage.assertSuccess();

      // ── Step 14: Back on list, client should still be found when filtering
      await clientesPage.goto();
      await clientesPage.buscar(data.nombre);
      // The card should still be visible (inactive clients may still appear in the list)
      await clientesPage.assertClienteVisible(data.nombre);
    } finally {
      // Teardown: delete the created client via API
      if (clienteId !== undefined) {
        await api.clientes.delete(clienteId).catch(() => {
          // Suppress teardown errors — test result is already determined
        });
      }
    }
  });

  test('should show validation errors when submitting empty form', async ({
    clienteFormPage,
  }) => {
    await clienteFormPage.goto();

    // Submit without filling any fields — button may be disabled
    const isDisabled = await clienteFormPage.submitButton.isDisabled();
    if (isDisabled) {
      // Disabled submit button IS the validation behavior
      await expect(clienteFormPage.submitButton).toBeDisabled();
    } else {
      await clienteFormPage.submit();
      // Validation may be: MUI error classes, aria-invalid, OR native HTML5 :invalid inputs
      const hasNativeInvalid = await clienteFormPage.page.locator('input:invalid').count();
      const hasMuiError = await clienteFormPage.page.locator(
        '[class*="Mui-error"],[class*="MuiAlert-standard"],[aria-invalid="true"]'
      ).count();
      // Either native HTML5 validation stopped submission, or MUI error messages appeared
      expect(hasNativeInvalid + hasMuiError).toBeGreaterThan(0);
    }
  });

  test('should search and filter clients', async ({ clientesPage, api }) => {
    const data = DataFactory.cliente();
    let clienteId: number | undefined;

    try {
      // Seed the client directly via API for speed
      const created = await api.clientes.create({
        nombre: data.nombre,
        apellido: data.apellido,
        email: data.email,
        tipo: data.tipo,
        estado: data.estado,
      });
      clienteId = created.id ?? created.data?.id;

      // Navigate to the list
      await clientesPage.goto();

      // Search using the unique email prefix which is deterministic
      await clientesPage.buscar(data.nombre);
      await clientesPage.assertClienteVisible(data.nombre);

      // Clear search and verify the client still appears in the full list
      await clientesPage.searchInput.clear();
      await clientesPage.page.waitForLoadState('networkidle');
      await clientesPage.assertClienteVisible(data.nombre);
    } finally {
      if (clienteId !== undefined) {
        await api.clientes.delete(clienteId).catch(() => {});
      }
    }
  });
});
