import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../../pages/base.page';

/**
 * LeadsPage — Page Object for /leads/table.
 *
 * Selectors derived from src/pages/leads/LeadsTablePage.tsx:
 *   - Heading: Typography h5 "📊 Gestión de Leads"
 *   - Button: "Nuevo Lead"
 *   - Search: TextField placeholder "Buscar por nombre o teléfono..."
 *   - Estado chips: PRIMER_CONTACTO, MOSTRO_INTERES, CLIENTE_POTENCIAL, etc.
 *   - Prioridad chips: HOT, WARM, COLD
 */
export class LeadsPage extends BasePage {
  readonly path = '/leads/table';

  readonly heading: Locator;
  readonly nuevoLeadButton: Locator;
  readonly searchInput: Locator;

  // Estado filter chips
  readonly chipPrimerContacto: Locator;
  readonly chipMostroInteres: Locator;
  readonly chipHot: Locator;
  readonly chipWarm: Locator;
  readonly chipCold: Locator;

  constructor(page: Page) {
    super(page);

    this.heading        = page.getByText('Gestión de Leads');
    this.nuevoLeadButton = page.getByRole('button', { name: /nuevo lead/i });
    this.searchInput    = page.getByPlaceholder('Buscar por nombre o teléfono...');

    this.chipPrimerContacto = page.getByRole('button', { name: /primer.contacto/i });
    this.chipMostroInteres  = page.getByRole('button', { name: /mostró.interés/i });
    this.chipHot  = page.getByRole('button', { name: /caliente/i });
    this.chipWarm = page.getByRole('button', { name: /tibio/i });
    this.chipCold = page.getByRole('button', { name: /fr[ií]o/i });
  }

  async assertOnPage(): Promise<void> {
    await expect(this.heading).toBeVisible({ timeout: 10_000 });
    await expect(this.nuevoLeadButton).toBeVisible();
    await expect(this.searchInput).toBeVisible();
  }

  async buscar(term: string): Promise<void> {
    await this.fillField(this.searchInput, term);
  }

  async assertLeadVisible(nombre: string): Promise<void> {
    await expect(this.page.getByText(nombre, { exact: false }).first()).toBeVisible({ timeout: 8_000 });
  }

  async assertEmptyState(): Promise<void> {
    // When API returns empty, the table body should show no rows OR an empty-state message
    await expect(
      this.page.getByText(/no hay leads|sin resultados|no se encontraron/i)
        .or(this.page.locator('tbody tr').first())
    ).toBeVisible({ timeout: 8_000 });
  }
}

/**
 * LeadFormPage — Page Object for /leads/nuevo and /leads/:id/editar.
 */
export class LeadFormPage extends BasePage {
  readonly path = '/leads/nuevo';

  readonly nombreInput: Locator;
  readonly telefonoInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);

    this.nombreInput   = page.getByLabel(/nombre/i).first();
    this.telefonoInput = page.getByLabel(/teléfono/i).first();
    this.submitButton  = page.getByRole('button', { name: /guardar|crear lead/i });
  }

  async assertOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/leads\/nuevo/, { timeout: 10_000 });
  }
}
