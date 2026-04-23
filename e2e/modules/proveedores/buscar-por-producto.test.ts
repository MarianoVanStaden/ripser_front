import { test, expect } from '@playwright/test';
import { BuscarProveedorPorProductoPage } from './buscar-por-producto.page';

/**
 * E2E: flujo de búsqueda de proveedores por producto/categoría.
 *
 * Usa mocks de ruta directamente (no el fixture con auth real), para
 * poder ejercitar cada caso sin depender del backend.
 */
test.describe('Buscar proveedor por producto/categoría', () => {
  let page: BuscarProveedorPorProductoPage;

  test.beforeEach(async ({ page: p, context }) => {
    // Mock auth so that ProtectedRoute lets us in.
    await context.addInitScript(() => {
      localStorage.setItem('token', 'FAKE_JWT');
      localStorage.setItem('user', JSON.stringify({ id: 1, email: 'qa@test.com' }));
    });
    await p.route('**/api/auth/validate', (r) =>
      r.fulfill({ status: 200, body: '{"valid":true}' }),
    );

    page = new BuscarProveedorPorProductoPage(p);
  });

  test('muestra placeholder y no llama al backend con < 2 chars', async ({ page: p }) => {
    let called = false;
    await p.route('**/api/productos/search**', (r) => {
      called = true;
      return r.fulfill({ status: 200, body: '[]' });
    });

    await page.mockBackend({});
    await page.goto();
    await page.typeQuery('a');
    await p.waitForTimeout(600); // > debounce

    expect(called).toBe(false);
    await page.assertNoOptionsHint(/escribí al menos 2 letras/i);
  });

  test('golden path: buscar producto → seleccionar → ver proveedor con precio', async () => {
    await page.mockBackend({
      productos: [{ id: 1, label: 'Bomba sumergible 1HP', codigo: 'BOM001' }],
      ofertas: [
        {
          proveedorId: 10,
          razonSocial: 'Proveedor Alfa',
          email: 'alfa@test.com',
          telefono: '+54 11 1234-5678',
          ciudad: 'La Plata',
          provincia: 'BUENOS_AIRES',
          productoId: 1,
          productoNombre: 'Bomba sumergible 1HP',
          productoCodigo: 'BOM001',
          precioProveedor: 12345.5,
          activo: true,
        },
      ],
    });

    await page.goto();
    await page.typeQuery('bomb');
    await page.selectOption(/bomba sumergible 1hp/i);

    await page.assertProveedorVisible('Proveedor Alfa');
    await expect(page.getProveedorRow('Proveedor Alfa')).toContainText(/12\.345/);
  });

  test('categoría: dispara endpoint por categoriaId', async ({ page: p }) => {
    await page.mockBackend({
      categorias: [{ id: 99, label: 'Bombas' }],
      ofertas: [
        {
          proveedorId: 20,
          razonSocial: 'Proveedor Beta',
          productoId: 2,
          productoNombre: 'Bomba B',
          productoCodigo: 'BOM002',
          precioProveedor: null,
          activo: true,
        },
      ],
    });

    const reqPromise = p.waitForRequest((req) =>
      req.url().includes('/api/proveedores/por-producto') && req.url().includes('categoriaId=99'),
    );

    await page.goto();
    await page.typeQuery('bomb');
    await page.selectOption(/^bombas/i);

    await reqPromise;
    await page.assertProveedorVisible('Proveedor Beta');
    await expect(page.getProveedorRow('Proveedor Beta')).toContainText(/sin precio/i);
  });

  test('empty state cuando el producto no tiene proveedores', async () => {
    await page.mockBackend({
      productos: [{ id: 1, label: 'Bomba rara', codigo: 'BOM999' }],
      ofertas: [],
    });

    await page.goto();
    await page.typeQuery('bomb');
    await page.selectOption(/bomba rara/i);

    await page.assertEmptyStateVisible();
  });

  test('error del backend muestra alerta al usuario', async ({ page: p }) => {
    await page.mockBackend({
      productos: [{ id: 1, label: 'Bomba 1HP', codigo: 'BOM001' }],
    });
    await p.route('**/api/proveedores/por-producto**', (r) =>
      r.fulfill({ status: 500, body: '{"error":"boom"}' }),
    );

    await page.goto();
    await page.typeQuery('bomb');
    await page.selectOption(/bomba 1hp/i);

    await expect(page.errorAlert).toContainText(/no se pudieron cargar los proveedores/i);
  });

  test('debounce colapsa múltiples keystrokes en 1 request', async ({ page: p }) => {
    let calls = 0;
    await p.route('**/api/productos/search**', (r) => {
      calls++;
      return r.fulfill({ status: 200, body: '[]' });
    });
    await p.route('**/api/categorias-productos/search**', (r) =>
      r.fulfill({ status: 200, body: '[]' }),
    );

    await page.goto();
    // Typing 5 chars quickly
    await page.typeQuery('bomba');
    await p.waitForTimeout(500);

    // Debounce (300ms) + agrupación de keystrokes → 1-2 calls max, not 5
    expect(calls).toBeLessThanOrEqual(2);
  });
});
