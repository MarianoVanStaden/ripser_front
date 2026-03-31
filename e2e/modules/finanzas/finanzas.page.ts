import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../../pages/base.page';

/**
 * FlujoCajaPage — Page Object for /admin/flujo-caja.
 *
 * Selectors derived from src/components/Admin/FlujoCaja/FlujoCajaPage.tsx:
 *   - Heading: "Flujo de Caja - Dashboard Profesional" (desktop) / "Flujo de Caja" (mobile)
 *   - Date filters: "Desde", "Hasta" labels
 */
export class FlujoCajaPage extends BasePage {
  readonly path = '/admin/flujo-caja';

  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByText(/flujo de caja/i).first();
  }

  async assertOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/admin\/flujo-caja/, { timeout: 10_000 });
    await expect(this.heading).toBeVisible();
  }
}

/**
 * BalanceAnualPage — Page Object for /admin/balance.
 *
 * Selectors derived from src/components/Admin/BalanceAnual/BalanceAnualPage.tsx:
 *   - Heading: varies — uses URL match
 */
export class BalanceAnualPage extends BasePage {
  readonly path = '/admin/balance';

  constructor(page: Page) {
    super(page);
  }

  async assertOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/admin\/balance/, { timeout: 10_000 });
  }
}
