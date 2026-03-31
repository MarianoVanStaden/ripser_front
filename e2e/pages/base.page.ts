import { Page, Locator, expect } from '@playwright/test';

/**
 * BasePage — abstract class that every Page Object must extend.
 *
 * Responsibilities:
 * - Hold a reference to the Playwright Page
 * - Provide a canonical URL for the module
 * - Offer shared navigation and utility methods
 *
 * Convention: concrete Page Objects declare all locators as readonly
 * class properties using getByTestId() as the primary strategy.
 */
export abstract class BasePage {
  readonly page: Page;

  /** The canonical path for this module (used by goto()). */
  abstract readonly path: string;

  constructor(page: Page) {
    this.page = page;
  }

  // ─── Navigation ────────────────────────────────────────────────────────────

  async goto() {
    await this.page.goto(this.path);
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  // ─── Shared UI interactions ─────────────────────────────────────────────────

  /**
   * Fills a text field and waits for it to have the filled value.
   * Prefer this over .fill() directly — it retries on transient focus issues.
   */
  async fillField(locator: Locator, value: string) {
    await locator.click();
    await locator.fill(value);
    await expect(locator).toHaveValue(value);
  }

  /**
   * Clicks a button and optionally waits for a navigation or network idle.
   */
  async clickAndWait(
    locator: Locator,
    options: { waitFor?: 'navigation' | 'networkidle' } = {}
  ) {
    const { waitFor } = options;
    if (waitFor === 'navigation') {
      await Promise.all([this.page.waitForURL('**/*'), locator.click()]);
    } else if (waitFor === 'networkidle') {
      await Promise.all([this.page.waitForLoadState('networkidle'), locator.click()]);
    } else {
      await locator.click();
    }
  }

  // ─── Assertions ────────────────────────────────────────────────────────────

  async assertOnPage() {
    await expect(this.page).toHaveURL(new RegExp(this.path));
  }

  async assertToastVisible(text?: string) {
    // MUI Snackbar / Alert used for feedback messages
    const toast = this.page.locator('[role="alert"]').last();
    await expect(toast).toBeVisible();
    if (text) {
      await expect(toast).toContainText(text);
    }
  }

  // ─── Dialogs ───────────────────────────────────────────────────────────────

  async confirmDialog(confirmButtonName = 'Confirmar') {
    const dialog = this.page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: confirmButtonName }).click();
    await expect(dialog).not.toBeVisible();
  }

  async cancelDialog(cancelButtonName = 'Cancelar') {
    const dialog = this.page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: cancelButtonName }).click();
    await expect(dialog).not.toBeVisible();
  }
}
