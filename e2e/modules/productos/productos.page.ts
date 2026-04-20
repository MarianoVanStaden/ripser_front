import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../../pages/base.page';

/**
 * StockPage — Page Object for /logistica/inventario/stock-productos.
 *
 * The page has two tabs:
 *   - "Inventario"   (aria-labelledby="stock-tab-0")
 *   - "Bajo Stock"   (aria-labelledby="stock-tab-1")
 *
 * Each tab shows a product table. Clicking the edit icon on a row opens a
 * dialog with fields: Nombre, Precio, Stock Mínimo, and an Activo switch.
 */
export class StockPage extends BasePage {
  readonly path = '/logistica/inventario/stock-productos';

  // ─── Tab locators ──────────────────────────────────────────────────────────

  readonly inventarioTab: Locator;
  readonly movimientosTab: Locator;

  // ─── Table locators ────────────────────────────────────────────────────────

  readonly productTable: Locator;

  // ─── Edit dialog locators ─────────────────────────────────────────────────

  readonly editDialog: Locator;
  readonly editNombreInput: Locator;
  readonly editPrecioInput: Locator;
  readonly editStockMinimoInput: Locator;
  readonly editActivoSwitch: Locator;
  readonly editSaveButton: Locator;

  constructor(page: Page) {
    super(page);

    // Tabs — the page uses MUI Tabs with aria-labelledby on the tab panels
    this.inventarioTab = page.getByRole('tab', { name: 'Inventario' });
    this.movimientosTab = page.getByRole('tab', { name: 'Movimientos' });

    // The product table wrapper
    this.productTable = page.getByRole('table');

    // Edit dialog fields (visible once the dialog is open)
    this.editDialog = page.getByRole('dialog');
    this.editNombreInput = page.getByLabel('Nombre', { exact: true });
    // "Precio de Venta" is the actual label; using substring 'Precio' matches both
    // "Precio de Venta" AND "Costo (Precio de Compra)" → strict-mode failure.
    this.editPrecioInput = page.getByLabel('Precio de Venta');
    this.editStockMinimoInput = page.getByLabel('Stock Mínimo');
    // The "Activo" toggle is a FormControlLabel with a Switch
    this.editActivoSwitch = page.getByRole('checkbox', { name: /producto activo|activo/i });
    this.editSaveButton = page.getByRole('button', { name: /guardar/i });
  }

  // ─── Navigation ────────────────────────────────────────────────────────────

  /** Click the "Inventario" tab. */
  async gotoInventoryTab(): Promise<void> {
    await this.inventarioTab.click();
    await this.page.waitForLoadState('networkidle');
  }

  /** Click the "Movimientos" tab. */
  async gotoMovimientosTab(): Promise<void> {
    await this.movimientosTab.click();
    await this.page.waitForLoadState('networkidle');
  }

  // ─── Search ────────────────────────────────────────────────────────────────

  /**
   * Fill the search input (if present on the active tab) with the product name.
   * Some implementations use a TextField with placeholder or label "Buscar".
   */
  async searchProduct(nombre: string): Promise<void> {
    const searchInput = this.page
      .getByPlaceholder(/buscar/i)
      .or(this.page.getByLabel(/buscar/i))
      .first();
    await searchInput.fill(nombre);
    await this.page.waitForLoadState('networkidle');
  }

  // ─── Row helpers ───────────────────────────────────────────────────────────

  /**
   * Returns the table row locator that contains the product name as text.
   * Works for both MUI Table rows and DataGrid rows.
   */
  getProductRow(nombre: string): Locator {
    return this.page.getByRole('row').filter({ hasText: nombre });
  }

  /**
   * Clicks the edit icon (EditIcon) in the row for the given product name.
   */
  async clickEditProduct(nombre: string): Promise<void> {
    const row = this.getProductRow(nombre);
    await expect(row).toBeVisible({ timeout: 10_000 });
    // Click the edit icon button within the row
    await row.locator('[data-testid="EditIcon"]').click();
    await expect(this.editDialog).toBeVisible({ timeout: 5_000 });
  }

  // ─── Edit dialog ───────────────────────────────────────────────────────────

  /**
   * Fill the edit dialog with the provided values.
   * Only fields that are defined in data are modified.
   */
  async fillEditForm(data: {
    nombre?: string;
    precio?: number | string;
    stockMinimo?: number | string;
    activo?: boolean;
  }): Promise<void> {
    if (data.nombre !== undefined) {
      await this.fillField(this.editNombreInput, String(data.nombre));
    }

    if (data.precio !== undefined) {
      await this.fillField(this.editPrecioInput, String(data.precio));
    }

    if (data.stockMinimo !== undefined) {
      await this.fillField(this.editStockMinimoInput, String(data.stockMinimo));
    }

    if (data.activo !== undefined) {
      const isCurrentlyChecked = await this.editActivoSwitch.isChecked();
      if (isCurrentlyChecked !== data.activo) {
        await this.editActivoSwitch.click();
      }
    }
  }

  /** Click "Guardar" in the edit dialog to save the changes. */
  async saveEditForm(): Promise<void> {
    await this.editSaveButton.click();
    await expect(this.editDialog).not.toBeVisible({ timeout: 10_000 });
  }

  // ─── Assertions ────────────────────────────────────────────────────────────

  /** Assert that a product row with the given name is visible. */
  async assertProductVisible(nombre: string): Promise<void> {
    await expect(this.getProductRow(nombre)).toBeVisible({ timeout: 10_000 });
  }

  /** Assert that no product row with the given name is visible. */
  async assertProductNotVisible(nombre: string): Promise<void> {
    await expect(this.getProductRow(nombre)).not.toBeVisible({ timeout: 10_000 });
  }

  /**
   * Assert that the product appears in the "Movimientos" tab.
   * Switches to the tab first, then checks for the row.
   */
  async assertInMovimientos(nombre: string): Promise<void> {
    await this.gotoMovimientosTab();
    await expect(this.getProductRow(nombre)).toBeVisible({ timeout: 10_000 });
  }

  /**
   * Assert that the product appears in the "Bajo Stock" tab/section.
   * The current implementation uses tabs labelled Inventario / Movimientos,
   * but bajo-stock items can be detected by the row's "Stock Bajo" / "Sin Stock" chip.
   */
  async assertInBajoStock(nombre: string): Promise<void> {
    await this.gotoInventoryTab();
    await this.searchProduct(nombre);
    const row = this.getProductRow(nombre);
    await expect(row).toBeVisible({ timeout: 10_000 });
    await expect(row).toContainText(/stock bajo|sin stock/i);
  }

  /**
   * Assert that the row for a product shows the Reventa chip
   * (added by the productos-terminados routing implementation).
   */
  async assertProductTipo(nombre: string, tipo: 'Material' | 'Reventa'): Promise<void> {
    const row = this.getProductRow(nombre);
    await expect(row).toBeVisible({ timeout: 10_000 });
    await expect(row).toContainText(tipo);
  }

  /**
   * Filter the inventory by tipo entidad.
   * Uses the "Tipo" MUI Select introduced by the reventa-routing change.
   * Pattern matches the rest of the project (e.g. ClienteFormPage estadoSelect).
   */
  async filterByTipo(tipo: 'Todos' | 'Materiales' | 'Reventa'): Promise<void> {
    await this.page.getByLabel('Tipo', { exact: true }).click();
    await this.page.getByRole('option', { name: tipo, exact: true }).click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Assert that the edit dialog has closed (StockPage does not emit a toast on save).
   * Use this instead of assertToastVisible after saveEditForm.
   */
  async assertEditDialogClosed(): Promise<void> {
    await expect(this.editDialog).not.toBeVisible({ timeout: 10_000 });
  }
}
