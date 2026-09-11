import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../../pages/base.page';

/**
 * PresupuestosPage — Page Object for /ventas/presupuestos.
 *
 * The page shows a table/card list of presupuestos with:
 *  - A "Nuevo Presupuesto" (or similar) button to open the create dialog
 *  - Per-row icon buttons: aria-label="Ver presupuesto {numero}" and
 *    aria-label="Editar presupuesto {numero}"
 *
 * For the create dialog:
 *  - Autocomplete with label "Buscar Cliente / Lead"
 *  - Select with label "Tipo de IVA"
 *  - Detalle line items (descripcion, cantidad, precioUnitario)
 */
export class PresupuestosPage extends BasePage {
  readonly path = '/ventas/presupuestos';

  // ─── List locators ─────────────────────────────────────────────────────────

  readonly nuevoPresupuestoButton: Locator;
  readonly createDialog: Locator;

  // ─── Dialog locators ───────────────────────────────────────────────────────

  readonly clienteAutocomplete: Locator;
  readonly tipoIvaSelect: Locator;
  readonly guardarButton: Locator;

  constructor(page: Page) {
    super(page);

    this.nuevoPresupuestoButton = page.getByRole('button', {
      name: /nuevo presupuesto/i,
    });
    this.createDialog = page.getByRole('dialog');
    this.clienteAutocomplete = page.getByLabel('Buscar Cliente / Lead');
    this.tipoIvaSelect = page.getByLabel('Tipo de IVA');
    this.guardarButton = page.getByRole('button', { name: /guardar/i });
  }

  // ─── Navigation helpers for sibling pages ────────────────────────────────

  async gotoPresupuestos(): Promise<void> {
    await this.page.goto('./ventas/presupuestos');
    await this.page.waitForLoadState('networkidle');
  }

  async gotoNotasPedido(): Promise<void> {
    await this.page.goto('./ventas/notas-pedido');
    await this.page.waitForLoadState('networkidle');
  }

  async gotoFacturacion(): Promise<void> {
    // El FORM de facturar (tabs manual / desde nota).
    await this.page.goto('./ventas/facturacion');
  }

  async gotoRegistroVentas(): Promise<void> {
    // Drift sep-2026: el LISTADO de facturas ya no está en /ventas/facturacion
    // (eso es el form) sino en /ventas/registro (RegistroVentasPage).
    await this.page.goto('./ventas/registro');
    await this.page.waitForLoadState('networkidle');
  }

  async gotoNotasCredito(): Promise<void> {
    await this.page.goto('./ventas/notas-credito');
    await this.page.waitForLoadState('networkidle');
    // Drift sep-2026: la página es un contenedor de tabs — el default es el
    // flujo "Crear Nota de Crédito" (Seleccionar Factura). El LISTADO de NCs
    // emitidas vive en el tab "Anulaciones".
    const anulacionesTab = this.page.getByRole('tab', { name: /anulaciones/i });
    const tabReady = await anulacionesTab
      .waitFor({ state: 'visible', timeout: 10_000 })
      .then(() => true)
      .catch(() => false);
    if (tabReady) {
      await anulacionesTab.click();
      await this.page.waitForLoadState('networkidle').catch(() => {});
      await this.page.waitForTimeout(500);
    }
  }

  // ─── Create presupuesto via dialog ────────────────────────────────────────

  /** Open the "Nuevo Presupuesto" dialog. */
  async abrirNuevoPresupuesto(): Promise<void> {
    await this.nuevoPresupuestoButton.click();
    await expect(this.createDialog).toBeVisible({ timeout: 5_000 });
  }

  /**
   * Type in the client autocomplete and select the first matching option.
   *
   * Target element: MUI Autocomplete with label "Buscar Cliente / Lead"
   */
  async seleccionarCliente(nombre: string): Promise<void> {
    await this.clienteAutocomplete.fill(nombre);
    // Wait for the dropdown listbox to appear, then pick the first option
    const listbox = this.page.getByRole('listbox');
    await expect(listbox).toBeVisible({ timeout: 8_000 });
    await listbox.getByRole('option').first().click();
  }

  /**
   * Add a line item (detalle) to the presupuesto create dialog.
   *
   * Assumes the dialog has a repeatable section for detalles.
   * Fills the last empty descripcion, cantidad, and precioUnitario fields.
   */
  async agregarDetalle(data: {
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    productoId?: number;
  }): Promise<void> {
    // If there's an "Agregar ítem" button, click it to reveal a new row
    const addItemButton = this.page.getByRole('button', { name: /agregar.*(ítem|item|detalle)/i });
    const addButtonVisible = await addItemButton.isVisible().catch(() => false);
    if (addButtonVisible) {
      await addItemButton.click();
    }

    // Fill the last descripcion field (most recently added row)
    const descripcionInputs = this.page.getByLabel(/descripcion/i);
    const count = await descripcionInputs.count();
    const lastDescripcion = descripcionInputs.nth(count - 1);
    await this.fillField(lastDescripcion, data.descripcion);

    // Fill cantidad
    const cantidadInputs = this.page.getByLabel(/cantidad/i);
    const cantidadCount = await cantidadInputs.count();
    const lastCantidad = cantidadInputs.nth(cantidadCount - 1);
    await this.fillField(lastCantidad, String(data.cantidad));

    // Fill precioUnitario
    const precioInputs = this.page.getByLabel(/precio unitario/i);
    const precioCount = await precioInputs.count();
    const lastPrecio = precioInputs.nth(precioCount - 1);
    await this.fillField(lastPrecio, String(data.precioUnitario));
  }

  /** Click the "Guardar" button in the create dialog. */
  async guardarPresupuesto(): Promise<void> {
    await this.guardarButton.click();
    await expect(this.createDialog).not.toBeVisible({ timeout: 10_000 });
  }

  // ─── Row/document locators ────────────────────────────────────────────────

  /**
   * Returns the table row or card locator that contains the document number.
   * Works for both the ventas list pages and the detail views.
   */
  getDocumentoRow(numero: string | number): Locator {
    return this.page
      .getByRole('row')
      .filter({ hasText: String(numero) })
      .or(
        this.page.locator('[class*="Card"],[data-testid*="documento"]').filter({
          hasText: String(numero),
        })
      );
  }

  /**
   * Returns the row/card for the given document number on any page
   * by matching any element that contains the number as text.
   */
  getDocumentoElement(numero: string | number): Locator {
    return this.page.locator('*').filter({ hasText: String(numero) }).last();
  }

  // ─── Assertions ───────────────────────────────────────────────────────────

  /**
   * Assert that a document with the given estado chip text is visible
   * in the row identified by numero.
   */
  async assertDocumentoEstado(numero: string | number, estado: string): Promise<void> {
    const row = this.getDocumentoRow(numero);
    await expect(row).toBeVisible({ timeout: 10_000 });
    await expect(row.locator('[class*="Chip"],[data-testid*="chip"]').filter({ hasText: estado }))
      .toBeVisible({ timeout: 5_000 });
  }

  /**
   * Assert that a document row/card identified by numero is visible on the
   * current page.
   */
  async assertDocumentoVisible(numero: string | number): Promise<void> {
    // Las listas reales tienen cientos de documentos paginados — el sembrado
    // puede no estar en la página 1. Si la página tiene buscador, filtramos
    // por número primero (el filtro es server-side y debounced).
    // Los listados filtran por estado "Pendiente" por default: un documento ya
    // convertido (APROBADO/FACTURADO) queda oculto. Si hay filtro de Estado,
    // lo abrimos y elegimos "Todos".
    // count()/isVisible() NO auto-esperan: si el assert corre apenas navegada
    // la página, los filtros todavía no están en el DOM y se saltean. Esperar
    // a que la UI de filtros exista antes de interactuar.
    await this.page
      .getByRole('combobox')
      .first()
      .waitFor({ state: 'visible', timeout: 10_000 })
      .catch(() => {});
    await this.page.waitForTimeout(300);

    // El MUI Select de Estado no expone accessible name — se identifica por su
    // valor visible ("Pendiente", el default que oculta documentos convertidos).
    const estadoCombo = this.page
      .getByRole('combobox')
      .filter({ hasText: /^pendiente$/i })
      .first();
    if (
      (await estadoCombo.count()) > 0 &&
      (await estadoCombo.isVisible().catch(() => false))
    ) {
      await estadoCombo.click();
      const todos = this.page.getByRole('option', { name: /todos/i }).first();
      if ((await todos.count()) > 0) {
        await todos.click();
      } else {
        await this.page.keyboard.press('Escape');
      }
      await this.page.waitForTimeout(600);
    }

    // OJO: el sidebar tiene su propio "Buscar… (Ctrl K)" — hay que excluirlo.
    const candidates = this.page.locator('input[placeholder]');
    const total = await candidates.count();
    for (let i = 0; i < total; i++) {
      const input = candidates.nth(i);
      const ph = (await input.getAttribute('placeholder')) ?? '';
      if (/ctrl/i.test(ph) || !/n[úu]mero|buscar/i.test(ph)) continue;
      if (!(await input.isVisible().catch(() => false))) continue;
      await input.fill(String(numero));
      await this.page.waitForTimeout(800); // debounce + fetch server-side
      break;
    }
    await expect(
      this.page.getByText(String(numero), { exact: false }).first()
    ).toBeVisible({ timeout: 10_000 });
  }

  /**
   * Assert that a document is NOT visible on the current page.
   */
  async assertDocumentoNotVisible(numero: string | number): Promise<void> {
    await expect(this.getDocumentoRow(numero)).not.toBeVisible({ timeout: 5_000 });
  }
}
