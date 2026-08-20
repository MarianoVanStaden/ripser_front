import { test, expect } from '../../fixtures';

/**
 * Postventa — Control de Calidad / Comunicaciones Iniciales.
 *
 * Verifica el cambio de UX: el ícono "Ver factura" de la columna Factura ahora
 * abre un MODAL con el detalle de la factura (read-only) en vez de descargar el
 * PDF. Backend mockeado (lista de comunicaciones + documento).
 */
test.describe('Postventa - Control de Calidad', () => {
  const DOC_ID = 500;

  test('el ícono de la columna Factura abre el modal de detalle (no descarga el PDF)', async ({ page }) => {
    // Mock lista de comunicaciones: una fila de financiación propia (COBRANZAS).
    await page.route('**/api/comunicaciones-postventa**', (route) => {
      if (route.request().method() !== 'GET') return route.fallback();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: [{
            id: 1,
            documentoComercialId: DOC_ID,
            facturaNumero: 'FAC-108',
            clienteId: 9,
            clienteNombreCompleto: 'León Antonio Mellado',
            clienteWhatsapp: '2984409992',
            clienteTelefono: '2984409991',
            canal: 'COBRANZAS',
            aplicaCobranzas: true,
            fechaEntrega: '2026-08-10',
            equipos: [{ id: 1, numeroHeladera: 'HEL-0161', modelo: 'Compact 1,20', medida: '1.2m' }],
            realizada: false,
          }],
          totalElements: 1, totalPages: 1, size: 25, number: 0,
          first: true, last: true, numberOfElements: 1, empty: false,
        }),
      });
    });

    // Mock detalle del documento (lo que consulta el modal al abrir).
    await page.route(`**/api/documentos/${DOC_ID}`, (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: DOC_ID,
        numeroDocumento: 'FAC-108',
        fechaEmision: '2026-08-10T00:00:00',
        metodoPago: 'FINANCIACION_PROPIA',
        estado: 'FACTURADA',
        subtotal: 4588800, iva: 0, total: 4588800,
        cliente: { id: 9, nombre: 'León Antonio', apellido: 'Mellado' },
        detalles: [{
          id: 11, tipoItem: 'EQUIPO', recetaNombre: 'Heladera Compact 1,20',
          cantidad: 1, precioUnitario: 4588800, subtotal: 4588800,
        }],
      }),
    }));

    await page.goto('/postventa/comunicaciones-iniciales');
    await expect(page.getByText('León Antonio Mellado')).toBeVisible({ timeout: 20_000 });

    // Al clickear el ícono NO debe descargarse ningún PDF.
    const noDownload = page.waitForEvent('download', { timeout: 2_000 }).then(() => true).catch(() => false);

    // Click en el ícono "Ver factura" (VisibilityIcon) de la columna Factura.
    await page.locator('button:has([data-testid="VisibilityIcon"])').first().click();

    // El modal aparece con el detalle.
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Factura FAC-108')).toBeVisible();
    await expect(dialog.getByText('Heladera Compact 1,20')).toBeVisible();
    await expect(dialog.getByText('Total', { exact: true })).toBeVisible();

    expect(await noDownload, 'no debería descargarse el PDF').toBe(false);

    await page.screenshot({ path: 'playwright-report/postventa-modal.png' });

    // Cierra el modal.
    await dialog.getByRole('button', { name: 'Cerrar' }).click();
    await expect(dialog).not.toBeVisible();
  });
});
