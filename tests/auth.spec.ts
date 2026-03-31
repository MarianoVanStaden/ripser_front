import { test, expect } from '@playwright/test';

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('renders branding and form', async ({ page }) => {
    await expect(page.getByText('Ripser').first()).toBeVisible();
    await expect(page.getByText('Bienvenido')).toBeVisible();
    await expect(page.getByLabel('Usuario o Correo')).toBeVisible();
    await expect(page.getByLabel('Contraseña')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ingresar' })).toBeVisible();
  });

  test('submit button is disabled when fields are empty', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Ingresar' })).toBeDisabled();
  });

  test('submit button enables when both fields are filled', async ({ page }) => {
    await page.getByLabel('Usuario o Correo').fill('testuser');
    await page.getByLabel('Contraseña').fill('password');
    await expect(page.getByRole('button', { name: 'Ingresar' })).toBeEnabled();
  });

  test('submit button stays disabled with only username filled', async ({ page }) => {
    await page.getByLabel('Usuario o Correo').fill('testuser');
    await expect(page.getByRole('button', { name: 'Ingresar' })).toBeDisabled();
  });

  test('submit button stays disabled with only password filled', async ({ page }) => {
    await page.getByLabel('Contraseña').fill('password');
    await expect(page.getByRole('button', { name: 'Ingresar' })).toBeDisabled();
  });

  test('password toggle shows and hides password', async ({ page }) => {
    const passwordInput = page.getByLabel('Contraseña');
    await passwordInput.fill('mysecret');

    await expect(passwordInput).toHaveAttribute('type', 'password');

    // MUI IconButton has no accessible name — locate via the password input's parent wrapper
    const toggleBtn = page
      .locator('input[autocomplete="current-password"]')
      .locator('xpath=..')
      .getByRole('button');

    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('shows error alert on invalid credentials', async ({ page }) => {
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Credenciales inválidas' }),
      })
    );

    await page.getByLabel('Usuario o Correo').fill('wronguser');
    await page.getByLabel('Contraseña').fill('wrongpass');
    await page.getByRole('button', { name: 'Ingresar' }).click();

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10_000 });
  });

  test('tab order: username → password → submit', async ({ page }) => {
    // Fill both fields first so the submit button is enabled (disabled buttons
    // are not in the tab order and would be skipped).
    await page.getByLabel('Usuario o Correo').fill('testuser');
    await page.getByLabel('Contraseña').fill('testpass');

    // Focus username, Tab into password
    await page.getByLabel('Usuario o Correo').focus();
    await page.keyboard.press('Tab');

    // MUI v6 focuses the underlying <input> — check via document.activeElement
    // rather than toBeFocused() which can be flaky with MUI's focus management.
    const passwordFocused = await page.evaluate(() => {
      const active = document.activeElement;
      return (
        active?.getAttribute('autocomplete') === 'current-password' ||
        active?.getAttribute('type') === 'password'
      );
    });
    expect(passwordFocused).toBe(true);

    // Tab twice: password → visibility toggle → submit
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    const submitFocused = await page.evaluate(() => {
      const active = document.activeElement;
      return active?.tagName === 'BUTTON' && (active.textContent ?? '').includes('Ingresar');
    });
    expect(submitFocused).toBe(true);
  });

  test('Enter key submits the form', async ({ page }) => {
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({ status: 401, body: '{"error":"bad"}' })
    );

    await page.getByLabel('Usuario o Correo').fill('user');
    await page.getByLabel('Contraseña').fill('pass');
    await page.getByLabel('Contraseña').press('Enter');

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Protected routes', () => {
  test('redirects unauthenticated user from /dashboard to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('redirects unauthenticated user from / to /login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('redirects unauthenticated user from /clientes/gestion to /login', async ({ page }) => {
    await page.goto('/clientes/gestion');
    await expect(page).toHaveURL(/\/login/);
  });

  test('redirects unauthenticated user from /admin/users to /login', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page).toHaveURL(/\/login/);
  });
});
