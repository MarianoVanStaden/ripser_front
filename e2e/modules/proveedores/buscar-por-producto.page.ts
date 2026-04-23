import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../../pages/base.page';

/**
 * BuscarProveedorPorProductoPage — /proveedores/buscar
 *
 * Allows the user to find providers by product/category via an Autocomplete
 * input backed by two search endpoints:
 *   GET /api/productos/search
 *   GET /api/categorias-productos/search
 * And resolves to:
 *   GET /api/proveedores/por-producto?productoId|categoriaId
 */
export class BuscarProveedorPorProductoPage extends BasePage {
  readonly path = '/proveedores/buscar';

  readonly searchInput: Locator;
  readonly resultsTable: Locator;
  readonly errorAlert: Locator;
  readonly activeFilterChip: Locator;
  readonly clearFilterButton: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.getByPlaceholder(/buscar producto o categoría/i);
    this.resultsTable = page.getByRole('table');
    this.errorAlert = page.getByRole('alert');
    this.activeFilterChip = page.locator('.MuiChip-root.MuiChip-colorPrimary').first();
    this.clearFilterButton = page.getByRole('button', { name: /limpiar/i });
  }

  async typeQuery(q: string) {
    await this.searchInput.click();
    await this.searchInput.fill(q);
  }

  async selectOption(visibleText: string | RegExp) {
    const re = typeof visibleText === 'string'
      ? new RegExp(visibleText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      : visibleText;
    const option = this.page.getByRole('option', { name: re });
    await expect(option).toBeVisible({ timeout: 5_000 });
    await option.click();
  }

  getProveedorRow(razonSocial: string): Locator {
    return this.page.getByRole('row').filter({ hasText: razonSocial });
  }

  async assertProveedorVisible(razonSocial: string) {
    await expect(this.getProveedorRow(razonSocial)).toBeVisible({ timeout: 5_000 });
  }

  async assertEmptyStateVisible() {
    await expect(this.page.getByText(/no hay proveedores que ofrezcan/i)).toBeVisible();
  }

  async assertNoOptionsHint(hint: RegExp) {
    await expect(this.page.getByText(hint)).toBeVisible();
  }

  /** Mock the two search endpoints + the resolution endpoint in one call. */
  async mockBackend(opts: {
    productos?: Array<{ id: number; label: string; codigo?: string }>;
    categorias?: Array<{ id: number; label: string }>;
    ofertas?: Array<Record<string, unknown>>;
  }) {
    const { productos = [], categorias = [], ofertas = [] } = opts;

    await this.page.route('**/api/productos/search**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(productos.map((p) => ({ ...p, tipo: 'PRODUCTO' }))),
      }),
    );

    await this.page.route('**/api/categorias-productos/search**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(categorias.map((c) => ({ ...c, tipo: 'CATEGORIA' }))),
      }),
    );

    await this.page.route('**/api/proveedores/por-producto**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(ofertas),
      }),
    );
  }
}
