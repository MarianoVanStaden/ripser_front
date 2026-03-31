import { test, expect } from '../../fixtures';
import { DataFactory } from '../../utils/data-factory';

/**
 * Productos / Stock module — E2E tests.
 *
 * These tests cover the stock management page (/logistica/inventario/stock-productos).
 *
 * Strategy:
 *  - Use the API to seed product data (faster, deterministic)
 *  - Use the UI to perform and verify the actions under test
 *  - Clean up seeded data in finally blocks via the API
 */

test.describe('Productos — Stock', () => {
  test('should edit product details via the stock page UI', async ({
    stockPage,
    api,
  }) => {
    // Seed a product via the API so we have a known entity to work with
    const original = DataFactory.producto();
    let productoId: number | undefined;

    try {
      const created = await api.productos.create(original);
      productoId = created.id ?? created.data?.id;

      // Navigate to the stock page and ensure the Inventario tab is active
      await stockPage.goto();
      await stockPage.gotoInventoryTab();

      // Search for the product to narrow the table
      await stockPage.searchProduct(original.nombre);

      // Assert the row is visible before editing
      await stockPage.assertProductVisible(original.nombre);

      // Open the edit dialog for this product
      await stockPage.clickEditProduct(original.nombre);

      // Prepare new values
      const updatedNombre = DataFactory.uniqueName('Prod');
      const updatedPrecio = 9999;
      const updatedStockMinimo = 25;

      // Fill the edit form
      await stockPage.fillEditForm({
        nombre: updatedNombre,
        precio: updatedPrecio,
        stockMinimo: updatedStockMinimo,
        activo: true,
      });

      // Save changes
      await stockPage.saveEditForm();

      // The dialog should close; assert a success toast or the row is updated
      await stockPage.assertToastVisible();

      // Search for the updated name and verify the row now shows the new name
      await stockPage.searchProduct(updatedNombre);
      await stockPage.assertProductVisible(updatedNombre);

      // Also verify the row now contains the updated price
      const updatedRow = stockPage.getProductRow(updatedNombre);
      await expect(updatedRow).toContainText(String(updatedPrecio));
    } finally {
      if (productoId !== undefined) {
        await api.productos.delete(productoId).catch(() => {});
      }
    }
  });

  test('should show low stock products in the Bajo Stock tab', async ({
    stockPage,
    api,
  }) => {
    // Create a product whose stock is below stockMinimo to guarantee it appears
    // in the bajo-stock tab.
    const lowStockProductData = DataFactory.producto({
      stock: 2,          // very low current stock
      stockMinimo: 50,   // high minimum threshold
    });
    let productoId: number | undefined;

    try {
      const created = await api.productos.create(lowStockProductData);
      productoId = created.id ?? created.data?.id;

      // Navigate to the stock page
      await stockPage.goto();

      // The product must appear in the Bajo Stock tab
      await stockPage.assertInBajoStock(lowStockProductData.nombre);
    } finally {
      if (productoId !== undefined) {
        await api.productos.delete(productoId).catch(() => {});
      }
    }
  });

  test('should switch between Inventario and Movimientos tabs', async ({
    stockPage,
    page,
  }) => {
    // categoriaProductoApi.getAll() expects an array — mock to prevent rendering crash
    await page.route('**/api/categorias-productos', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );

    await stockPage.goto();
    await expect(stockPage.inventarioTab).toBeVisible({ timeout: 15_000 });

    // Switch to Movimientos tab
    await stockPage.gotoMovimientosTab();
    await expect(stockPage.movimientosTab).toHaveAttribute('aria-selected', 'true');

    // Switch back to Inventario tab
    await stockPage.gotoInventoryTab();
    await expect(stockPage.inventarioTab).toHaveAttribute('aria-selected', 'true');
  });
});
