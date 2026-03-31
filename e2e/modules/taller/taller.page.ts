import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../../pages/base.page';

/**
 * OrdenesServicioPage — Page Object for /taller/ordenes.
 *
 * Selectors derived from src/components/Taller/OrdenesServicioPage.tsx:
 *   - Heading: Typography h4 "Órdenes de Servicio"
 *   - Button: "Nueva Orden"
 *   - Search: TextField label "Buscar", placeholder "N° Orden, Cliente, Descripción..."
 *   - Estado filter: TextField label "Filtrar por Estado"
 *   - Detail form heading: "➕ Nueva Orden de Servicio" / "✏️ Editar Orden de Servicio"
 */
export class OrdenesServicioPage extends BasePage {
  readonly path = '/taller/ordenes';

  readonly heading: Locator;
  readonly nuevaOrdenButton: Locator;
  readonly searchInput: Locator;
  readonly estadoFilter: Locator;

  constructor(page: Page) {
    super(page);

    this.heading           = page.getByText('Órdenes de Servicio').first();
    this.nuevaOrdenButton  = page.getByRole('button', { name: /nueva orden/i });
    this.searchInput       = page.getByLabel('Buscar').first();
    this.estadoFilter      = page.getByLabel('Filtrar por Estado').first();
  }

  async assertOnPage(): Promise<void> {
    await expect(this.heading).toBeVisible({ timeout: 10_000 });
    await expect(this.nuevaOrdenButton).toBeVisible();
  }

  async buscar(term: string): Promise<void> {
    await this.fillField(this.searchInput, term);
  }

  async clickNuevaOrden(): Promise<void> {
    await this.nuevaOrdenButton.click();
    // The form opens as a side panel / dialog within the same page
    await expect(
      this.page.getByText(/nueva orden de servicio/i).first()
    ).toBeVisible({ timeout: 8_000 });
  }

  async assertFormVisible(): Promise<void> {
    await expect(
      this.page.getByText(/nueva orden de servicio/i).first()
    ).toBeVisible({ timeout: 8_000 });
  }

  async closeForm(): Promise<void> {
    // Cancel button typically closes the panel
    const cancelBtn = this.page.getByRole('button', { name: /cancelar/i });
    if (await cancelBtn.isVisible()) await cancelBtn.click();
  }
}
