import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../../pages/base.page';

/**
 * AuthPage — Page Object for the /login route.
 *
 * Selector strategy: data-testid (primary).
 * The following attributes must be present in LoginPage.tsx:
 *
 *   <TextField inputProps={{ 'data-testid': 'login-username-input' }} />
 *   <TextField inputProps={{ 'data-testid': 'login-password-input' }} />
 *   <IconButton data-testid="login-toggle-password" />
 *   <Button    data-testid="login-submit-button">Ingresar</Button>
 *   <Alert     data-testid="login-error-alert" />
 *
 * See: src/components/Auth/LoginPage.tsx
 */
export class AuthPage extends BasePage {
  readonly path = '/login';

  // ─── Locators ──────────────────────────────────────────────────────────────

  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly togglePasswordButton: Locator;
  readonly errorAlert: Locator;
  readonly welcomeHeading: Locator;
  readonly brandingText: Locator;
  readonly loadingButton: Locator;

  constructor(page: Page) {
    super(page);

    this.usernameInput     = page.getByTestId('login-username-input');
    this.passwordInput     = page.getByTestId('login-password-input');
    this.submitButton      = page.getByTestId('login-submit-button');
    this.togglePasswordButton = page.getByTestId('login-toggle-password');
    this.errorAlert        = page.getByTestId('login-error-alert');
    this.welcomeHeading    = page.getByText('Bienvenido');
    this.brandingText      = page.getByText('Ripser').first();
    this.loadingButton     = page.getByRole('button', { name: 'Ingresando...' });
  }

  // ─── Actions ───────────────────────────────────────────────────────────────

  /**
   * Fills credentials and clicks submit.
   * Does NOT wait for navigation — caller decides what to assert next.
   */
  async login(username: string, password: string): Promise<void> {
    await this.fillField(this.usernameInput, username);
    await this.fillField(this.passwordInput, password);
    await this.submitButton.click();
  }

  /**
   * Full login flow: fills form, submits, and waits for /dashboard.
   */
  async loginAndWaitForDashboard(username: string, password: string): Promise<void> {
    await this.login(username, password);
    await expect(this.page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
  }

  async togglePasswordVisibility(): Promise<void> {
    await this.togglePasswordButton.click();
  }

  // ─── Assertions ────────────────────────────────────────────────────────────

  async assertOnLoginPage(): Promise<void> {
    await expect(this.welcomeHeading).toBeVisible();
    await expect(this.usernameInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.submitButton).toBeDisabled(); // disabled when fields are empty
  }

  async assertSubmitEnabled(): Promise<void> {
    await expect(this.submitButton).toBeEnabled();
  }

  async assertSubmitDisabled(): Promise<void> {
    await expect(this.submitButton).toBeDisabled();
  }

  async assertErrorVisible(expectedText?: string): Promise<void> {
    await expect(this.errorAlert).toBeVisible({ timeout: 8_000 });
    if (expectedText) {
      await expect(this.errorAlert).toContainText(expectedText);
    }
  }

  async assertErrorNotVisible(): Promise<void> {
    await expect(this.errorAlert).not.toBeVisible();
  }

  async assertPasswordMasked(): Promise<void> {
    await expect(this.passwordInput).toHaveAttribute('type', 'password');
  }

  async assertPasswordVisible(): Promise<void> {
    await expect(this.passwordInput).toHaveAttribute('type', 'text');
  }

  async assertLoadingState(): Promise<void> {
    await expect(this.loadingButton).toBeVisible();
    await expect(this.loadingButton).toBeDisabled();
  }
}
