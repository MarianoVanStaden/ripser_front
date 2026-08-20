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

  test('el tablero se actualiza en vivo por SSE cuando llega comunicacion.creada (sin recargar)', async ({ page }) => {
    // La lista devuelve 1 fila al inicio; cuando llega el evento SSE, 2 filas.
    let nuevaVisible = false;
    const row = (id: number, doc: number, nro: string, nombre: string) => ({
      id, documentoComercialId: doc, facturaNumero: nro, clienteId: id,
      clienteNombreCompleto: nombre, clienteWhatsapp: '2984000000', clienteTelefono: '2984000001',
      canal: 'POST_VENTA', aplicaCobranzas: false, fechaEntrega: '2026-08-20',
      equipos: [], realizada: false,
    });
    const pageBody = (rows: unknown[]) => JSON.stringify({
      content: rows, totalElements: rows.length, totalPages: 1, size: 25, number: 0,
      first: true, last: true, numberOfElements: rows.length, empty: rows.length === 0,
    });

    await page.route('**/api/comunicaciones-postventa**', (route) => {
      if (route.request().method() !== 'GET') return route.fallback();
      const rows = nuevaVisible
        ? [row(1, 500, 'FAC-108', 'León Antonio Mellado'), row(2, 999, 'FAC-999', 'Recién Entregado')]
        : [row(1, 500, 'FAC-108', 'León Antonio Mellado')];
      return route.fulfill({ status: 200, contentType: 'application/json', body: pageBody(rows) });
    });

    // Stream SSE mockeado: cada conexión, tras 1.2s (para que la lista inicial ya renderizó
    // con 1 fila), revela la 2da fila y emite el evento. Se entrega en TODA conexión (no un
    // one-shot) porque React StrictMode monta el efecto dos veces (aborta la 1ª); así la
    // conexión viva recibe el evento. Tras un close limpio fetch-event-source no reintenta.
    await page.route('**/api/eventos/stream**', async (route) => {
      await new Promise((r) => setTimeout(r, 1200));
      nuevaVisible = true;
      return route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: 'event: postventa.comunicacion.creada\n'
            + 'data: {"type":"postventa.comunicacion.creada","empresaId":1,"timestamp":"2026-08-20T10:00:00Z"}\n\n',
      });
    });

    await page.goto('/postventa/comunicaciones-iniciales');

    // Estado inicial: 1 fila; la nueva todavía NO está.
    await expect(page.getByText('León Antonio Mellado')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Recién Entregado')).toHaveCount(0);

    // Marcador para probar que NO hubo recarga de página.
    await page.evaluate(() => { (window as unknown as { __sse: string }).__sse = 'alive'; });

    // Al llegar el evento SSE, React Query re-fetchea y aparece la nueva fila.
    await expect(page.getByText('Recién Entregado')).toBeVisible({ timeout: 15_000 });

    // El marcador sigue vivo → fue una actualización en vivo, no un reload.
    expect(await page.evaluate(() => (window as unknown as { __sse?: string }).__sse)).toBe('alive');
  });
});
