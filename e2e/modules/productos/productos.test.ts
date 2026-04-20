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

/**
 * Productos de Reventa — routing entre /api/productos y /api/productos-terminados.
 *
 * Estos tests usan mocks de network para evitar depender del backend, ya que el
 * objetivo es verificar a qué endpoint se rutea cada operación según el flag
 * esReventa de la categoría. Esta es la garantía contractual más importante de
 * la implementación: editar/eliminar un producto de reventa NUNCA debe pegar a
 * /api/productos/:id (el backend lo rechaza con 400).
 */
test.describe('Productos — Routing de Reventa', () => {
  // Categorías compartidas: una material, una reventa.
  const categoriaMaterial = {
    id: 100,
    nombre: 'Materias Primas',
    descripcion: 'Materiales de fabricación',
    activo: true,
    esReventa: false,
  };

  const categoriaReventa = {
    id: 200,
    nombre: 'Equipos de Reventa',
    descripcion: 'Productos terminados de terceros',
    activo: true,
    esReventa: true,
  };

  // Producto material (vive en /api/productos).
  const productoMaterial = {
    id: 1001,
    nombre: 'Material de Test E2E',
    descripcion: 'Caño de cobre',
    precio: 1500,
    costo: 800,
    stockActual: 100,
    stockMinimo: 10,
    codigo: 'MAT-E2E001',
    categoriaProductoId: categoriaMaterial.id,
    categoriaProductoNombre: categoriaMaterial.nombre,
    activo: true,
    fechaCreacion: '2026-01-01T00:00:00Z',
  };

  // Producto reventa (vive en /api/productos-terminados, mismo schema).
  const productoReventa = {
    id: 2002,
    nombre: 'Freezer de Reventa E2E',
    descripcion: 'Freezer horizontal 400L',
    precio: 850000,
    costo: 600000,
    stockActual: 5,
    stockMinimo: 2,
    codigo: 'REV-E2E001',
    categoriaProductoId: categoriaReventa.id,
    categoriaProductoNombre: categoriaReventa.nombre,
    activo: true,
    fechaCreacion: '2026-01-15T00:00:00Z',
  };

  /**
   * Instala mocks deterministas:
   *  - /api/categorias-productos → [material, reventa]
   *  - /api/productos (lista paginada)            → [productoMaterial]
   *  - /api/productos-terminados (array directo)  → [productoReventa]
   *  - movimientos-stock                          → vacío
   *
   * Estas rutas se registran ANTES del catch-all del fixture _routeMocks (LIFO),
   * así que tienen prioridad.
   */
  async function installListingMocks(page: import('@playwright/test').Page): Promise<void> {
    await page.route('**/api/categorias-productos', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([categoriaMaterial, categoriaReventa]),
      }),
    );

    await page.route(/.*\/api\/productos(\?.*)?$/, (route) => {
      // Sólo respondemos al GET de listado paginado; PUT/POST se interceptan en otra ruta.
      if (route.request().method() !== 'GET') return route.continue();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: [productoMaterial],
          totalElements: 1,
          totalPages: 1,
          number: 0,
          size: 10000,
          first: true,
          last: true,
          numberOfElements: 1,
          empty: false,
        }),
      });
    });

    await page.route(/.*\/api\/productos-terminados(\?.*)?$/, (route) => {
      if (route.request().method() !== 'GET') return route.continue();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([productoReventa]),
      });
    });

    // El StockPage carga movimientos-stock en paralelo: respondemos vacío.
    await page.route('**/api/movimientos-stock**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: 0,
          size: 10000,
          first: true,
          last: true,
          numberOfElements: 0,
          empty: true,
        }),
      }),
    );
  }

  test('listado unificado muestra ambos productos con su chip de tipo', async ({
    stockPage,
    page,
  }) => {
    await installListingMocks(page);

    await stockPage.goto();
    await stockPage.gotoInventoryTab();

    // Ambos productos deben aparecer en el listado unificado.
    await stockPage.assertProductVisible(productoMaterial.nombre);
    await stockPage.assertProductVisible(productoReventa.nombre);

    // Cada uno con su badge correcto.
    await stockPage.assertProductTipo(productoMaterial.nombre, 'Material');
    await stockPage.assertProductTipo(productoReventa.nombre, 'Reventa');
  });

  test('filtro "Tipo = Reventa" oculta materiales y muestra solo productos terminados', async ({
    stockPage,
    page,
  }) => {
    await installListingMocks(page);

    await stockPage.goto();
    await stockPage.gotoInventoryTab();
    await stockPage.filterByTipo('Reventa');

    await stockPage.assertProductVisible(productoReventa.nombre);
    await stockPage.assertProductNotVisible(productoMaterial.nombre);
  });

  test('filtro "Tipo = Materiales" oculta reventa y muestra solo materiales', async ({
    stockPage,
    page,
  }) => {
    await installListingMocks(page);

    await stockPage.goto();
    await stockPage.gotoInventoryTab();
    await stockPage.filterByTipo('Materiales');

    await stockPage.assertProductVisible(productoMaterial.nombre);
    await stockPage.assertProductNotVisible(productoReventa.nombre);
  });

  test('editar un producto de REVENTA pega PUT a /api/productos-terminados/:id (no a /api/productos)', async ({
    stockPage,
    page,
  }) => {
    await installListingMocks(page);

    // Capturamos las URLs de PUT que dispara el form de edición.
    const putUrls: string[] = [];
    page.on('request', (req) => {
      if (req.method() === 'PUT' && req.url().includes('/api/productos')) {
        putUrls.push(req.url());
      }
    });

    // Mock del PUT al endpoint correcto.
    await page.route(`**/api/productos-terminados/${productoReventa.id}`, (route) => {
      if (route.request().method() !== 'PUT') return route.continue();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...productoReventa, precio: 999000 }),
      });
    });

    // Trampa: si el código se equivoca y pega al endpoint de materiales, lo capturamos
    // como respuesta 400 para que el test falle con un mensaje claro.
    await page.route(`**/api/productos/${productoReventa.id}`, (route) => {
      if (route.request().method() !== 'PUT') return route.continue();
      return route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'BUG: editado vía endpoint de materiales' }),
      });
    });

    await stockPage.goto();
    await stockPage.gotoInventoryTab();
    await stockPage.searchProduct(productoReventa.nombre);
    await stockPage.clickEditProduct(productoReventa.nombre);
    await stockPage.fillEditForm({ precio: 999000 });
    await stockPage.saveEditForm();
    await stockPage.assertEditDialogClosed();

    // El PUT debe haber ido al endpoint de productos-terminados.
    expect(
      putUrls.some((u) => u.includes(`/api/productos-terminados/${productoReventa.id}`)),
      `Se esperaba PUT a /api/productos-terminados/${productoReventa.id}. URLs vistas: ${JSON.stringify(putUrls)}`,
    ).toBe(true);

    // Y NUNCA debe haber pegado al endpoint de materiales para este id.
    expect(
      putUrls.some((u) => u.match(new RegExp(`/api/productos/${productoReventa.id}(?!\\d)`))),
      `BUG: se editó un producto de reventa vía /api/productos/${productoReventa.id}`,
    ).toBe(false);
  });

  test('editar un producto MATERIAL pega PUT a /api/productos/:id (no al endpoint de reventa)', async ({
    stockPage,
    page,
  }) => {
    await installListingMocks(page);

    const putUrls: string[] = [];
    page.on('request', (req) => {
      if (req.method() === 'PUT' && req.url().includes('/api/productos')) {
        putUrls.push(req.url());
      }
    });

    await page.route(`**/api/productos/${productoMaterial.id}`, (route) => {
      if (route.request().method() !== 'PUT') return route.continue();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...productoMaterial, precio: 5000 }),
      });
    });

    await page.route(`**/api/productos-terminados/${productoMaterial.id}`, (route) => {
      if (route.request().method() !== 'PUT') return route.continue();
      return route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'BUG: material editado vía endpoint reventa' }),
      });
    });

    await stockPage.goto();
    await stockPage.gotoInventoryTab();
    await stockPage.searchProduct(productoMaterial.nombre);
    await stockPage.clickEditProduct(productoMaterial.nombre);
    await stockPage.fillEditForm({ precio: 5000 });
    await stockPage.saveEditForm();
    await stockPage.assertEditDialogClosed();

    expect(
      putUrls.some((u) => u.match(new RegExp(`/api/productos/${productoMaterial.id}(?!\\d)`))),
    ).toBe(true);
    expect(
      putUrls.some((u) => u.includes(`/api/productos-terminados/${productoMaterial.id}`)),
    ).toBe(false);
  });

  test('selector de categoría en form de edición de REVENTA solo muestra categorías esReventa=true', async ({
    stockPage,
    page,
  }) => {
    await installListingMocks(page);

    await stockPage.goto();
    await stockPage.gotoInventoryTab();
    await stockPage.searchProduct(productoReventa.nombre);
    await stockPage.clickEditProduct(productoReventa.nombre);

    // Abrimos el dropdown de Categoría DENTRO del diálogo de edición (no el de filtro).
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('combobox', { name: 'Categoría' }).click();
    const listbox = page.getByRole('listbox');

    await expect(listbox.getByRole('option', { name: /Equipos de Reventa/i })).toBeVisible();
    await expect(listbox.getByRole('option', { name: 'Materias Primas', exact: true })).toHaveCount(0);
  });

  test('selector de categoría en form de edición de MATERIAL excluye categorías de reventa', async ({
    stockPage,
    page,
  }) => {
    await installListingMocks(page);

    await stockPage.goto();
    await stockPage.gotoInventoryTab();
    await stockPage.searchProduct(productoMaterial.nombre);
    await stockPage.clickEditProduct(productoMaterial.nombre);

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('combobox', { name: 'Categoría' }).click();
    const listbox = page.getByRole('listbox');

    await expect(listbox.getByRole('option', { name: 'Materias Primas', exact: true })).toBeVisible();
    await expect(listbox.getByRole('option', { name: /Equipos de Reventa/i })).toHaveCount(0);
  });

  test('listado degrada elegantemente cuando /api/productos-terminados falla', async ({
    stockPage,
    page,
  }) => {
    // Solo falla productos-terminados; materiales devuelve normal.
    await page.route('**/api/categorias-productos', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([categoriaMaterial, categoriaReventa]),
      }),
    );

    await page.route(/.*\/api\/productos(\?.*)?$/, (route) => {
      if (route.request().method() !== 'GET') return route.continue();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: [productoMaterial],
          totalElements: 1, totalPages: 1, number: 0, size: 10000,
          first: true, last: true, numberOfElements: 1, empty: false,
        }),
      });
    });

    await page.route(/.*\/api\/productos-terminados(\?.*)?$/, (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"down"}' }),
    );

    await page.route('**/api/movimientos-stock**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: [], totalElements: 0, totalPages: 0, number: 0, size: 10000,
          first: true, last: true, numberOfElements: 0, empty: true,
        }),
      }),
    );

    await stockPage.goto();
    await stockPage.gotoInventoryTab();

    // El material debe seguir visible aunque productos-terminados falle.
    await stockPage.assertProductVisible(productoMaterial.nombre);
  });
});
