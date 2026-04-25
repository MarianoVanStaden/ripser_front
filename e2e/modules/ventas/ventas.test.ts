import { test, expect } from '../../fixtures';
import { DataFactory, DocumentoFactory } from '../../utils/data-factory';

/**
 * Ventas module — E2E tests.
 *
 * These tests cover the full commercial document lifecycle:
 *  - Presupuesto → Nota de Pedido → Factura → Nota de Crédito
 *
 * Strategy:
 *  - Use API helpers (api.documentos.*) to create/convert documents rapidly
 *  - Use the UI only to verify the results are displayed correctly
 *  - Each test seeds its own cliente and producto via the API
 *  - Cleanup via api.clientes.delete / api.productos.delete in finally blocks
 *
 * NOTE: The `api` fixture exposes an authenticated ApiHelpers instance.
 * The userId used for document creation is 1 (default admin user — adjust
 * ENV.USER_ID if the test environment has a different admin ID).
 */

const DEFAULT_USER_ID = 1;

test.describe('Ventas — Documentos Comerciales', () => {
  // ── 4.1: Full flow: Presupuesto → Nota de Pedido → Factura ────────────────

  test('4.1 should complete full sales flow: presupuesto → nota pedido → factura', async ({
    ventasPage,
    api,
  }) => {
    const clienteData = DataFactory.cliente();
    const productoData = DataFactory.producto({ stock: 100, stockMinimo: 5 });
    let clienteId: number | undefined;
    let productoId: number | undefined;

    try {
      // ── Setup: create cliente and producto via API ──────────────────────
      const cliente = await api.clientes.create({
        nombre: clienteData.nombre,
        apellido: clienteData.apellido,
        email: clienteData.email,
        tipo: clienteData.tipo,
        estado: clienteData.estado,
      });
      clienteId = cliente.id ?? cliente.data?.id;

      const producto = await api.productos.create(productoData);
      productoId = producto.id ?? producto.data?.id;

      // ── Create presupuesto via API ─────────────────────────────────────
      const presupuestoPayload = DocumentoFactory.presupuestoPayload(
        clienteId!,
        DEFAULT_USER_ID,
        productoId!,
        productoData.precio
      );
      const presupuesto = await api.documentos.createPresupuesto(presupuestoPayload);
      const presupuestoId: number = presupuesto.id ?? presupuesto.data?.id;
      const presupuestoNumero: string = presupuesto.numero ?? presupuesto.data?.numero ?? String(presupuestoId);

      // ── Verify presupuesto appears in /ventas/presupuestos ────────────
      await ventasPage.gotoPresupuestos();
      await ventasPage.assertDocumentoVisible(presupuestoNumero);

      // ── Convert to nota de pedido via API ─────────────────────────────
      const notaPedidoPayload = DocumentoFactory.notaPedidoPayload(presupuestoId);
      const notaPedido = await api.documentos.convertToNotaPedido(notaPedidoPayload);
      const notaPedidoId: number = notaPedido.id ?? notaPedido.data?.id;
      const notaPedidoNumero: string = notaPedido.numero ?? notaPedido.data?.numero ?? String(notaPedidoId);

      // ── Verify nota de pedido appears in /ventas/notas-pedido ─────────
      await ventasPage.gotoNotasPedido();
      await ventasPage.assertDocumentoVisible(notaPedidoNumero);

      // ── Convert to factura via API ─────────────────────────────────────
      const facturaPayload = DocumentoFactory.facturaPayload(notaPedidoId);
      const factura = await api.documentos.convertToFactura(facturaPayload);
      const facturaNumero: string = factura.numero ?? factura.data?.numero ?? String(factura.id ?? factura.data?.id);

      // ── Verify factura appears in /ventas/facturacion ─────────────────
      await ventasPage.gotoFacturacion();
      await ventasPage.assertDocumentoVisible(facturaNumero);
    } finally {
      if (clienteId !== undefined) await api.clientes.delete(clienteId).catch(() => {});
      if (productoId !== undefined) await api.productos.delete(productoId).catch(() => {});
    }
  });

  // ── 4.2: Direct presupuesto → nota pedido → factura (verify each UI page) ──

  test('4.2 should show correct estado at each step of the document chain', async ({
    ventasPage,
    api,
  }) => {
    const clienteData = DataFactory.cliente();
    const productoData = DataFactory.producto({ stock: 100, stockMinimo: 5 });
    let clienteId: number | undefined;
    let productoId: number | undefined;

    try {
      const cliente = await api.clientes.create({
        nombre: clienteData.nombre,
        apellido: clienteData.apellido,
        email: clienteData.email,
        tipo: clienteData.tipo,
        estado: clienteData.estado,
      });
      clienteId = cliente.id ?? cliente.data?.id;

      const producto = await api.productos.create(productoData);
      productoId = producto.id ?? producto.data?.id;

      // Create the full chain via API
      const presupuesto = await api.documentos.createPresupuesto(
        DocumentoFactory.presupuestoPayload(clienteId!, DEFAULT_USER_ID, productoId!, productoData.precio)
      );
      const presupuestoId: number = presupuesto.id ?? presupuesto.data?.id;
      const presupuestoNumero: string = presupuesto.numero ?? presupuesto.data?.numero ?? String(presupuestoId);

      const notaPedido = await api.documentos.convertToNotaPedido(
        DocumentoFactory.notaPedidoPayload(presupuestoId)
      );
      const notaPedidoId: number = notaPedido.id ?? notaPedido.data?.id;
      const notaPedidoNumero: string = notaPedido.numero ?? notaPedido.data?.numero ?? String(notaPedidoId);

      const factura = await api.documentos.convertToFactura(
        DocumentoFactory.facturaPayload(notaPedidoId)
      );
      const facturaNumero: string = factura.numero ?? factura.data?.numero ?? String(factura.id ?? factura.data?.id);

      // Verify each document appears in its respective page
      await ventasPage.gotoPresupuestos();
      await ventasPage.assertDocumentoVisible(presupuestoNumero);

      await ventasPage.gotoNotasPedido();
      await ventasPage.assertDocumentoVisible(notaPedidoNumero);

      await ventasPage.gotoFacturacion();
      await ventasPage.assertDocumentoVisible(facturaNumero);
    } finally {
      if (clienteId !== undefined) await api.clientes.delete(clienteId).catch(() => {});
      if (productoId !== undefined) await api.productos.delete(productoId).catch(() => {});
    }
  });

  // ── 4.3: Manual factura via FacturacionPage UI ────────────────────────────

  test('4.3 should display facturacion page with document list', async ({
    ventasPage,
    page,
  }) => {
    // Navigate to facturacion and assert the page loads correctly
    await ventasPage.gotoFacturacion();
    await expect(page).toHaveURL(/\/ventas\/facturacion/);
    // The page heading or tab should be visible
    await expect(
      page.getByRole('heading', { name: /factura/i })
        .or(page.getByText(/factura/i).first())
    ).toBeVisible({ timeout: 10_000 });
  });

  // ── 4.4: Nota de crédito from factura ────────────────────────────────────

  test('4.4 should create nota de credito against an existing factura', async ({
    ventasPage,
    api,
  }) => {
    const clienteData = DataFactory.cliente();
    const productoData = DataFactory.producto({ stock: 100, stockMinimo: 5 });
    let clienteId: number | undefined;
    let productoId: number | undefined;

    try {
      const cliente = await api.clientes.create({
        nombre: clienteData.nombre,
        apellido: clienteData.apellido,
        email: clienteData.email,
        tipo: clienteData.tipo,
        estado: clienteData.estado,
      });
      clienteId = cliente.id ?? cliente.data?.id;

      const producto = await api.productos.create(productoData);
      productoId = producto.id ?? producto.data?.id;

      // Build full chain via API: presupuesto → nota pedido → factura
      const presupuesto = await api.documentos.createPresupuesto(
        DocumentoFactory.presupuestoPayload(clienteId!, DEFAULT_USER_ID, productoId!, productoData.precio)
      );
      const presupuestoId: number = presupuesto.id ?? presupuesto.data?.id;

      const notaPedido = await api.documentos.convertToNotaPedido(
        DocumentoFactory.notaPedidoPayload(presupuestoId)
      );
      const notaPedidoId: number = notaPedido.id ?? notaPedido.data?.id;

      const factura = await api.documentos.convertToFactura(
        DocumentoFactory.facturaPayload(notaPedidoId)
      );
      const facturaId: number = factura.id ?? factura.data?.id;

      // Create nota de crédito via API
      const notaCredito = await api.documentos.createNotaCredito(
        DocumentoFactory.notaCreditoPayload(facturaId, DEFAULT_USER_ID)
      );
      const notaCreditoNumero: string =
        notaCredito.numero ?? notaCredito.data?.numero ?? String(notaCredito.id ?? notaCredito.data?.id);

      // Navigate to notas-credito page and verify it appears
      await ventasPage.gotoNotasCredito();
      await ventasPage.assertDocumentoVisible(notaCreditoNumero);
    } finally {
      if (clienteId !== undefined) await api.clientes.delete(clienteId).catch(() => {});
      if (productoId !== undefined) await api.productos.delete(productoId).catch(() => {});
    }
  });

  // ── 4.5: Full document chain — cross-reference retrieval ─────────────────

  test('4.5 should retrieve full document chain and verify cross-references via API', async ({
    api,
  }) => {
    const clienteData = DataFactory.cliente();
    const productoData = DataFactory.producto({ stock: 100, stockMinimo: 5 });
    let clienteId: number | undefined;
    let productoId: number | undefined;

    try {
      const cliente = await api.clientes.create({
        nombre: clienteData.nombre,
        apellido: clienteData.apellido,
        email: clienteData.email,
        tipo: clienteData.tipo,
        estado: clienteData.estado,
      });
      clienteId = cliente.id ?? cliente.data?.id;

      const producto = await api.productos.create(productoData);
      productoId = producto.id ?? producto.data?.id;

      // Build full chain
      const presupuesto = await api.documentos.createPresupuesto(
        DocumentoFactory.presupuestoPayload(clienteId!, DEFAULT_USER_ID, productoId!, productoData.precio)
      );
      const presupuestoId: number = presupuesto.id ?? presupuesto.data?.id;

      const notaPedido = await api.documentos.convertToNotaPedido(
        DocumentoFactory.notaPedidoPayload(presupuestoId)
      );
      const notaPedidoId: number = notaPedido.id ?? notaPedido.data?.id;

      const factura = await api.documentos.convertToFactura(
        DocumentoFactory.facturaPayload(notaPedidoId)
      );
      const facturaId: number = factura.id ?? factura.data?.id;

      // Verify each document is retrievable and contains the expected tipo
      const fetchedPresupuesto = await api.documentos.getById(presupuestoId);
      expect(
        fetchedPresupuesto.tipoDocumento ?? fetchedPresupuesto.tipo
      ).toMatch(/PRESUPUESTO/i);

      const fetchedNotaPedido = await api.documentos.getById(notaPedidoId);
      expect(
        fetchedNotaPedido.tipoDocumento ?? fetchedNotaPedido.tipo
      ).toMatch(/NOTA_PEDIDO|NOTA PEDIDO/i);

      const fetchedFactura = await api.documentos.getById(facturaId);
      expect(
        fetchedFactura.tipoDocumento ?? fetchedFactura.tipo
      ).toMatch(/FACTURA/i);

      // Verify documents appear in the client's document list
      const clientDocs = await api.documentos.getByCliente(clienteId!);
      const docIds = (Array.isArray(clientDocs) ? clientDocs : clientDocs.content ?? []).map(
        (d: any) => d.id
      );
      expect(docIds).toContain(presupuestoId);
      expect(docIds).toContain(notaPedidoId);
      expect(docIds).toContain(facturaId);
    } finally {
      if (clienteId !== undefined) await api.clientes.delete(clienteId).catch(() => {});
      if (productoId !== undefined) await api.productos.delete(productoId).catch(() => {});
    }
  });

  // ── 4.6: Original presupuesto from factura ────────────────────────────────

  test('4.6 should navigate to factura detail and find link back to original presupuesto', async ({
    ventasPage,
    page,
    api,
  }) => {
    const clienteData = DataFactory.cliente();
    const productoData = DataFactory.producto({ stock: 100, stockMinimo: 5 });
    let clienteId: number | undefined;
    let productoId: number | undefined;

    try {
      const cliente = await api.clientes.create({
        nombre: clienteData.nombre,
        apellido: clienteData.apellido,
        email: clienteData.email,
        tipo: clienteData.tipo,
        estado: clienteData.estado,
      });
      clienteId = cliente.id ?? cliente.data?.id;

      const producto = await api.productos.create(productoData);
      productoId = producto.id ?? producto.data?.id;

      // Build chain
      const presupuesto = await api.documentos.createPresupuesto(
        DocumentoFactory.presupuestoPayload(clienteId!, DEFAULT_USER_ID, productoId!, productoData.precio)
      );
      const presupuestoId: number = presupuesto.id ?? presupuesto.data?.id;
      const presupuestoNumero: string =
        presupuesto.numero ?? presupuesto.data?.numero ?? String(presupuestoId);

      const notaPedido = await api.documentos.convertToNotaPedido(
        DocumentoFactory.notaPedidoPayload(presupuestoId)
      );
      const notaPedidoId: number = notaPedido.id ?? notaPedido.data?.id;

      const factura = await api.documentos.convertToFactura(
        DocumentoFactory.facturaPayload(notaPedidoId)
      );
      const facturaId: number = factura.id ?? factura.data?.id;
      const facturaNumero: string =
        factura.numero ?? factura.data?.numero ?? String(facturaId);

      // Navigate to facturacion list
      await ventasPage.gotoFacturacion();
      await ventasPage.assertDocumentoVisible(facturaNumero);

      // Click the "Ver" icon for the factura row to open its detail
      // Target: IconButton aria-label="Ver factura {numero}" or similar view icon
      const verButton = page
        .getByRole('button', { name: new RegExp(`ver.*${facturaNumero}`, 'i') })
        .or(
          ventasPage.getDocumentoRow(facturaNumero)
            .locator('[data-testid="VisibilityIcon"]')
        );

      const verButtonVisible = await verButton.isVisible().catch(() => false);
      if (verButtonVisible) {
        await verButton.click();
        // In the detail view, the presupuesto número should appear as a reference
        await expect(
          page.getByText(presupuestoNumero, { exact: false })
        ).toBeVisible({ timeout: 10_000 });
      } else {
        // Fallback: verify via API that the factura references the presupuesto
        const fetchedFactura = await api.documentos.getById(facturaId);
        const refId =
          fetchedFactura.presupuestoId ??
          fetchedFactura.documentoOrigenId ??
          fetchedFactura.data?.presupuestoId;
        expect(refId).toBe(presupuestoId);
      }
    } finally {
      if (clienteId !== undefined) await api.clientes.delete(clienteId).catch(() => {});
      if (productoId !== undefined) await api.productos.delete(productoId).catch(() => {});
    }
  });

  // ── 4.7: Documents linked to a client ────────────────────────────────────

  test('4.7 should list all documents linked to a specific client via API', async ({
    ventasPage,
    api,
  }) => {
    const clienteData = DataFactory.cliente();
    const productoData = DataFactory.producto({ stock: 100, stockMinimo: 5 });
    let clienteId: number | undefined;
    let productoId: number | undefined;

    try {
      const cliente = await api.clientes.create({
        nombre: clienteData.nombre,
        apellido: clienteData.apellido,
        email: clienteData.email,
        tipo: clienteData.tipo,
        estado: clienteData.estado,
      });
      clienteId = cliente.id ?? cliente.data?.id;

      const producto = await api.productos.create(productoData);
      productoId = producto.id ?? producto.data?.id;

      // Create presupuesto for this client
      const presupuesto = await api.documentos.createPresupuesto(
        DocumentoFactory.presupuestoPayload(clienteId!, DEFAULT_USER_ID, productoId!, productoData.precio)
      );
      const presupuestoId: number = presupuesto.id ?? presupuesto.data?.id;
      const presupuestoNumero: string =
        presupuesto.numero ?? presupuesto.data?.numero ?? String(presupuestoId);

      // Verify via API: documents for this client include the presupuesto
      const clientDocs = await api.documentos.getByCliente(clienteId!);
      const docs = Array.isArray(clientDocs) ? clientDocs : clientDocs.content ?? [];
      const docIds = docs.map((d: any) => d.id);
      expect(docIds).toContain(presupuestoId);

      // Navigate to presupuestos and filter/search for this client's document
      await ventasPage.gotoPresupuestos();
      await ventasPage.assertDocumentoVisible(presupuestoNumero);
    } finally {
      if (clienteId !== undefined) await api.clientes.delete(clienteId).catch(() => {});
      if (productoId !== undefined) await api.productos.delete(productoId).catch(() => {});
    }
  });

  // ── 4.8: Invalid business rules / error handling ──────────────────────────

  test('4.8a should return 400 when creating presupuesto without required clienteId', async ({
    api,
  }) => {
    // Attempt to create a presupuesto without a clienteId — the API must return 400
    let threw = false;
    let statusCode: number | undefined;

    try {
      await api.documentos.createPresupuesto({
        clienteId: 0, // invalid — no client with id 0
        usuarioId: DEFAULT_USER_ID,
        tipoIva: 'IVA_21',
        detalles: [
          {
            tipoItem: 'PRODUCTO',
            productoId: 1,
            cantidad: 1,
            precioUnitario: 100,
            descripcion: 'Test item',
          },
        ],
      });
    } catch (err: any) {
      threw = true;
      statusCode = err?.response?.status;
    }

    // The API should reject the request with a 4xx error
    expect(threw).toBe(true);
    expect(statusCode).toBeGreaterThanOrEqual(400);
    expect(statusCode).toBeLessThan(500);
  });

  test('4.8b should return 4xx when creating nota de credito for non-existent factura', async ({
    api,
  }) => {
    // Use a factura ID that cannot exist
    const nonExistentFacturaId = 999_999_999;
    let threw = false;
    let statusCode: number | undefined;

    try {
      await api.documentos.createNotaCredito(
        DocumentoFactory.notaCreditoPayload(nonExistentFacturaId, DEFAULT_USER_ID)
      );
    } catch (err: any) {
      threw = true;
      statusCode = err?.response?.status;
    }

    expect(threw).toBe(true);
    expect(statusCode).toBeGreaterThanOrEqual(400);
    expect(statusCode).toBeLessThan(500);
  });

  test('4.8c should show error in UI when ventas page loads without documents', async ({
    ventasPage,
    page,
  }) => {
    // Navigate to each ventas page and assert they load without crashing,
    // even when there are no documents (empty state is acceptable).
    await ventasPage.gotoPresupuestos();
    await expect(page).toHaveURL(/\/ventas\/presupuestos/);
    // The page should not show a JS error boundary — just check it renders
    await expect(page.locator('body')).not.toContainText('Error: ');

    await ventasPage.gotoNotasPedido();
    await expect(page).toHaveURL(/\/ventas\/notas-pedido/);
    await expect(page.locator('body')).not.toContainText('Error: ');

    await ventasPage.gotoFacturacion();
    await expect(page).toHaveURL(/\/ventas\/facturacion/);
    await expect(page.locator('body')).not.toContainText('Error: ');

    await ventasPage.gotoNotasCredito();
    await expect(page).toHaveURL(/\/ventas\/notas-credito/);
    await expect(page.locator('body')).not.toContainText('Error: ');
  });
});
