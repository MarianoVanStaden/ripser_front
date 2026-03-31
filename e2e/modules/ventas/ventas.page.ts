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
    await this.page.goto('/ventas/presupuestos');
    await this.page.waitForLoadState('networkidle');
  }

  async gotoNotasPedido(): Promise<void> {
    await this.page.goto('/ventas/notas-pedido');
    await this.page.waitForLoadState('networkidle');
  }

  async gotoFacturacion(): Promise<void> {
    await this.page.goto('/ventas/facturacion');
    await this.page.waitForLoadState('networkidle');
  }

  async gotoNotasCredito(): Promise<void> {
    await this.page.goto('/ventas/notas-credito');
    await this.page.waitForLoadState('networkidle');
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
    // Use a broad text search to find any element containing the document number
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
