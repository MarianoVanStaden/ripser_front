import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../../pages/base.page';

/**
 * GarantiasPage — Page Object for /garantias/registro.
 *
 * Selectors derived from src/components/Garantia/GarantiasPage.tsx:
 *   - Heading: Typography "Registro Garantías"
 *   - Button: "Nueva Garantía"
 *   - Search: TextField label "Buscar por modelo, serie"
 *   - Estado filter: Select with options VIGENTE, VENCIDA, ANULADA
 */
export class GarantiasPage extends BasePage {
  readonly path = '/garantias/registro';

  readonly heading: Locator;
  readonly nuevaGarantiaButton: Locator;
  readonly searchInput: Locator;
  readonly estadoFilter: Locator;

  constructor(page: Page) {
    super(page);

    this.heading              = page.getByRole('heading', { name: /gestión de garantías/i });
    this.nuevaGarantiaButton  = page.getByRole('button', { name: /nueva garantía/i });
    this.searchInput          = page.getByLabel(/buscar por modelo/i).first();
    this.estadoFilter         = page.locator('label').filter({ hasText: /^Estado$/ }).first();
  }

  async assertOnPage(): Promise<void> {
    await expect(this.heading).toBeVisible({ timeout: 10_000 });
  }

  async buscar(term: string): Promise<void> {
    await this.fillField(this.searchInput, term);
  }

  async assertGarantiaVisible(text: string): Promise<void> {
    await expect(this.page.getByText(text, { exact: false }).first()).toBeVisible({ timeout: 8_000 });
  }
}

/**
 * ReclamosPage — Page Object for /garantias/reclamos.
 */
export class ReclamosPage extends BasePage {
  readonly path = '/garantias/reclamos';

  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByText(/reclamos/i).first();
  }

  async assertOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/garantias\/reclamos/, { timeout: 10_000 });
  }
}
