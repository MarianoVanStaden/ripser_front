import { test, expect } from '../../fixtures';
import { ENV } from '../../utils/env';
import { MOCK_LOGIN_RESPONSE } from '../../utils/mock-auth';

/**
 * Auth E2E tests — covers login, logout, session management, and access control.
 *
 * These tests start with an EMPTY storage state (no token) because they test
 * the authentication flow itself. Other modules rely on the setup project's
 * saved storageState instead.
 *
 * Why test.use({ storageState }):
 *   The 'auth' project in playwright.config.ts doesn't set a global storageState,
 *   so these tests start unauthenticated by default.
 */

// Ensure every test in this file starts with a clean, unauthenticated session
test.use({ storageState: { cookies: [], origins: [] } });

// ─── Login Page — UI & Validation ──────────────────────────────────────────

test.describe('Login page', () => {
  test.beforeEach(async ({ authPage }) => {
    await authPage.goto();
  });

  test('should render all expected elements', async ({ authPage }) => {
    await expect(authPage.brandingText).toBeVisible();
    await expect(authPage.welcomeHeading).toBeVisible();
    await expect(authPage.usernameInput).toBeVisible();
    await expect(authPage.passwordInput).toBeVisible();
    await expect(authPage.submitButton).toBeVisible();
  });

  test('should keep submit disabled when both fields are empty', async ({ authPage }) => {
    await authPage.assertSubmitDisabled();
  });

  test('should keep submit disabled with only username filled', async ({ authPage }) => {
    await authPage.fillField(authPage.usernameInput, 'admin');
    await authPage.assertSubmitDisabled();
  });

  test('should keep submit disabled with only password filled', async ({ authPage }) => {
    await authPage.fillField(authPage.passwordInput, 'password');
    await authPage.assertSubmitDisabled();
  });

  test('should enable submit when both fields are filled', async ({ authPage }) => {
    await authPage.fillField(authPage.usernameInput, 'admin');
    await authPage.fillField(authPage.passwordInput, 'password');
    await authPage.assertSubmitEnabled();
  });

  test('should mask password by default and reveal on toggle', async ({ authPage }) => {
    await authPage.fillField(authPage.passwordInput, 'mysecret');
    await authPage.assertPasswordMasked();

    await authPage.togglePasswordVisibility();
    await authPage.assertPasswordVisible();

    await authPage.togglePasswordVisibility();
    await authPage.assertPasswordMasked();
  });
});

// ─── Login Flow ────────────────────────────────────────────────────────────

test.describe('Login flow', () => {
  test.beforeEach(async ({ authPage }) => {
    await authPage.goto();
  });

  test('should redirect to /dashboard on valid credentials', async ({ authPage, page }) => {
    // Mock the login endpoint — auth tests must not depend on real credentials
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_LOGIN_RESPONSE),
      })
    );
    await authPage.loginAndWaitForDashboard(ENV.USERNAME, ENV.PASSWORD);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should show loading state while request is in flight', async ({ authPage, page }) => {
    // Throttle the login API to observe loading state
    await page.route('**/api/auth/login', async (route) => {
      await new Promise((r) => setTimeout(r, 1500));
      await route.continue();
    });

    await authPage.fillField(authPage.usernameInput, ENV.USERNAME);
    await authPage.fillField(authPage.passwordInput, ENV.PASSWORD);
    await authPage.submitButton.click();

    await authPage.assertLoadingState();
  });

  test('should show error alert on wrong credentials', async ({ authPage }) => {
    await authPage.login('wrong_user', 'wrong_pass');
    await authPage.assertErrorVisible();
  });

  test('should clear error and succeed on correct retry', async ({ authPage, page }) => {
    // First call → 401 (shows error), second call → 200 (success)
    let loginCallCount = 0;
    await page.route('**/api/auth/login', (route) => {
      loginCallCount++;
      if (loginCallCount === 1) {
        return route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Credenciales inválidas' }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_LOGIN_RESPONSE),
      });
    });

    // First attempt: wrong credentials → error shown
    await authPage.login('wrong_user', 'wrong_pass');
    await authPage.assertErrorVisible();

    // Second attempt: correct credentials — error should disappear
    await authPage.fillField(authPage.passwordInput, ENV.PASSWORD);
    await authPage.fillField(authPage.usernameInput, ENV.USERNAME);
    await authPage.submitButton.click();

    await authPage.assertErrorNotVisible();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
  });

  test('should show fallback error on server error (5xx)', async ({ authPage, page }) => {
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({ status: 500, body: '{"message":"Internal Server Error"}' })
    );

    await authPage.login('admin', 'pass');
    await authPage.assertErrorVisible();

    // Must not show raw internal details
    await expect(authPage.errorAlert).not.toContainText('undefined');
    await expect(authPage.errorAlert).not.toContainText('null');
  });

  test('should not submit with Enter when fields are empty', async ({ authPage }) => {
    await authPage.usernameInput.press('Enter');
    // No alert should appear — form was not submitted
    await authPage.assertErrorNotVisible();
    await authPage.assertSubmitDisabled();
  });

  test('should submit with Enter key from password field', async ({ authPage }) => {
    await authPage.fillField(authPage.usernameInput, 'wrong');
    await authPage.fillField(authPage.passwordInput, 'wrong');
    await authPage.passwordInput.press('Enter');

    // An error appears (wrong creds) — proves the form was submitted via keyboard
    await authPage.assertErrorVisible();
  });
});

// ─── Session Management ────────────────────────────────────────────────────

test.describe('Session management', () => {
  test('should redirect authenticated user away from /login', async ({ authPage, page }) => {
    // Mock login — this test validates app routing, not backend auth
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_LOGIN_RESPONSE),
      })
    );

    // Login first
    await authPage.goto();
    await authPage.loginAndWaitForDashboard(ENV.USERNAME, ENV.PASSWORD);

    // Navigate back to /login — full reload means AuthContext re-validates the token.
    // The fixture-level auth/validate mock (fixtures/index.ts) returns 200, so
    // AuthContext keeps the user authenticated and LoginPage redirects to /dashboard.
    await page.goto('/login');

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
  });

  test('should redirect unauthenticated user from /dashboard to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect unauthenticated user from any protected route to /login', async ({
    page,
  }) => {
    const protectedPaths = [
      '/clientes/gestion',
      '/ventas/dashboard',
      '/admin/users',
      '/fabricacion/equipos',
    ];

    for (const path of protectedPaths) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });
    }
  });
});

// ─── Logout ────────────────────────────────────────────────────────────────

test.describe('Logout', () => {
  test.beforeEach(async ({ authPage, page }) => {
    // Mock login so logout tests don't depend on real backend credentials
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_LOGIN_RESPONSE),
      })
    );
    await authPage.goto();
    await authPage.loginAndWaitForDashboard(ENV.USERNAME, ENV.PASSWORD);
  });

  test('should open confirmation dialog on logout click', async ({ page }) => {
    await page.locator('.logout-button').click({ force: true });
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Confirmar cierre de sesión')).toBeVisible();
  });

  test('should redirect to /login after confirming logout', async ({ page }) => {
    await page.locator('.logout-button').click({ force: true });
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByRole('button', { name: 'Cerrar sesión' }).click();

    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test('should clear localStorage tokens on logout', async ({ page }) => {
    await page.locator('.logout-button').click({ force: true });
    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });

    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeNull();
  });

  test('should stay on page when cancelling logout', async ({ page }) => {
    await page.locator('.logout-button').click({ force: true });
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByRole('button', { name: 'Cancelar' }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
