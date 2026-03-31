import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../../pages/base.page';

/**
 * PrestamosPage — Page Object for /prestamos/lista.
 *
 * Selectors derived from src/components/Prestamos/PrestamosListPage.tsx:
 *   - Heading: Typography "Gestión de Préstamos"
 *   - Search: TextField placeholder "Buscar por nombre o código..."
 *   - Estado chips: ACTIVO, FINALIZADO, EN_MORA, EN_LEGAL, CANCELADO
 *   - Categoría chips: NORMAL, LEGALES, PAGO_CON_MORA, ALTO_RIESGO
 */
export class PrestamosPage extends BasePage {
  readonly path = '/prestamos/lista';

  readonly heading: Locator;
  readonly searchInput: Locator;

  // Estado filter chips
  readonly chipActivo: Locator;
  readonly chipEnMora: Locator;
  readonly chipFinalizado: Locator;
  readonly chipEnLegal: Locator;

  // Categoría filter chips
  readonly chipNormal: Locator;
  readonly chipAltoRiesgo: Locator;

  constructor(page: Page) {
    super(page);

    this.heading     = page.getByText('Gestión de Préstamos');
    this.searchInput = page.getByPlaceholder('Buscar por nombre o código...');

    // Estado chips — MUI Chips act as toggle buttons
    this.chipActivo    = page.getByRole('button', { name: /^activo$/i });
    this.chipEnMora    = page.getByRole('button', { name: /en mora/i });
    this.chipFinalizado = page.getByRole('button', { name: /finalizado/i });
    this.chipEnLegal   = page.getByRole('button', { name: /en legal/i });

    this.chipNormal     = page.getByRole('button', { name: /^normal$/i });
    this.chipAltoRiesgo = page.getByRole('button', { name: /alto riesgo/i });
  }

  async assertOnPage(): Promise<void> {
    await expect(this.heading).toBeVisible({ timeout: 10_000 });
    await expect(this.searchInput).toBeVisible();
  }

  async buscar(term: string): Promise<void> {
    await this.fillField(this.searchInput, term);
  }

  async filterByEstado(chip: Locator): Promise<void> {
    await chip.click();
  }
}

/**
 * PrestamosResumenPage — Page Object for /prestamos/resumen.
 */
export class PrestamosResumenPage extends BasePage {
  readonly path = '/prestamos/resumen';

  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByText(/resumen/i).first();
  }

  async assertOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/prestamos\/resumen/, { timeout: 10_000 });
  }
}
