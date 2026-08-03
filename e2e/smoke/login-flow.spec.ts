import { test, expect } from '@playwright/test';
import { FAKE_JWT, FAKE_USER } from './helpers/auth';

// Playwright route priority: LAST registered = HIGHEST priority (checked first).
// Always register the catch-all FIRST, specific mocks LAST.

const MOCK_LOGIN_RESPONSE = {
  id: 1,
  username: 'testadmin',
  email: 'admin@test.com',
  roles: ['ADMIN'],
  esSuperAdmin: false,
  empresaId: 1,
  sucursalId: 1,
  accessToken: FAKE_JWT,
  refreshToken: 'fake-refresh-token',
};

/**
 * Registers a catch-all that returns empty paginated data (and aborts SSE),
 * then registers specific endpoint overrides at higher priority.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function mockApis(page: import('@playwright/test').Page, overrides: Record<string, object | number> = {}) {
  // Catch-all first (lowest priority) — skip Vite source files, abort SSE
  await page.route('**/api/**', (route) => {
    const type = route.request().resourceType();
    if (type === 'script' || type === 'stylesheet' || type === 'document') return route.continue();
    const accept = route.request().headers()['accept'] ?? '';
    if (accept.includes('text/event-stream')) return route.abort();
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: [], totalElements: 0, totalPages: 0 }),
    });
  });
  // Specific overrides last (highest priority)
  for (const [pattern, response] of Object.entries(overrides)) {
    const status = typeof response === 'number' ? response : 200;
    const body = typeof response === 'number' ? '{}' : JSON.stringify(response);
    await page.route(pattern, (route) =>
      route.fulfill({ status, contentType: 'application/json', body })
    );
  }
}

test.describe('Login flow', () => {
  test('successful login redirects to /dashboard', async ({ page }) => {
    // Catch-all first (skips Vite sources, aborts SSE), login override last
    await page.route('**/api/**', (route) => {
      const type = route.request().resourceType();
      if (type === 'script' || type === 'stylesheet' || type === 'document') return route.continue();
      const accept = route.request().headers()['accept'] ?? '';
      if (accept.includes('text/event-stream')) return route.abort();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ content: [], totalElements: 0, totalPages: 0 }),
      });
    });
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_LOGIN_RESPONSE),
      })
    );

    await page.goto('/login');
    await page.getByLabel('Usuario o Correo').fill('testadmin');
    await page.getByLabel('Contraseña').fill('password123');
    await page.getByRole('button', { name: 'Ingresar' }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
  });

  test('submit button shows "Ingresando..." while request is in flight', async ({ page }) => {
    await page.route('**/api/auth/login', async (route) => {
      await new Promise((r) => setTimeout(r, 1500));
      await route.fulfill({ status: 401, body: '{"error":"bad"}' });
    });

    await page.goto('/login');
    await page.getByLabel('Usuario o Correo').fill('testadmin');
    await page.getByLabel('Contraseña').fill('password');
    await page.getByRole('button', { name: 'Ingresar' }).click();

    await expect(page.getByRole('button', { name: 'Ingresando...' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ingresando...' })).toBeDisabled();
  });

  test('button returns to "Ingresar" after failed login', async ({ page }) => {
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({ status: 401, body: '{"error":"bad"}' })
    );

    await page.goto('/login');
    await page.getByLabel('Usuario o Correo').fill('bad');
    await page.getByLabel('Contraseña').fill('bad');
    await page.getByRole('button', { name: 'Ingresar' }).click();

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('button', { name: 'Ingresar' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ingresando...' })).not.toBeVisible();
  });

  test('error clears on next submit attempt', async ({ page }) => {
    let callCount = 0;
    // Catch-all first (skips Vite sources, aborts SSE)
    await page.route('**/api/**', (route) => {
      const type = route.request().resourceType();
      if (type === 'script' || type === 'stylesheet' || type === 'document') return route.continue();
      const accept = route.request().headers()['accept'] ?? '';
      if (accept.includes('text/event-stream')) return route.abort();
      return route.fulfill({
        status: 200,
        body: JSON.stringify({ content: [], totalElements: 0, totalPages: 0 }),
      });
    });
    // Login override last (highest priority)
    await page.route('**/api/auth/login', (route) => {
      callCount++;
      if (callCount === 1) {
        return route.fulfill({ status: 401, body: '{"error":"bad creds"}' });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_LOGIN_RESPONSE),
      });
    });

    await page.goto('/login');
    await page.getByLabel('Usuario o Correo').fill('admin');
    await page.getByLabel('Contraseña').fill('wrongpass');
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5_000 });

    // Fix the password and retry — alert should be gone before the second request resolves
    await page.getByLabel('Contraseña').fill('correctpass');
    await page.getByRole('button', { name: 'Ingresar' }).click();

    await expect(page.getByRole('alert')).not.toBeVisible({ timeout: 5_000 });
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
  });

  test('already authenticated user is redirected away from /login', async ({ page }) => {
    // Inject storage state BEFORE React initialises — no reload needed
    await page.addInitScript(
      ({ token, user }) => {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(user));
        sessionStorage.setItem('empresaId', '1');
        sessionStorage.setItem('sucursalId', '1');
        sessionStorage.setItem('esSuperAdmin', 'false');
      },
      { token: FAKE_JWT, user: FAKE_USER }
    );

    // Catch-all first (skips Vite sources, aborts SSE), validate override last
    await page.route('**/api/**', (route) => {
      const type = route.request().resourceType();
      if (type === 'script' || type === 'stylesheet' || type === 'document') return route.continue();
      const accept = route.request().headers()['accept'] ?? '';
      if (accept.includes('text/event-stream')) return route.abort();
      return route.fulfill({
        status: 200,
        body: JSON.stringify({ content: [], totalElements: 0, totalPages: 0 }),
      });
    });
    await page.route('**/api/auth/validate', (route) =>
      route.fulfill({ status: 200, body: '{}' })
    );

    // Navigate directly — AuthContext sees the token on first mount and redirects
    await page.goto('/login');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
  });

  test('server error (500) shows fallback error message', async ({ page }) => {
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({ status: 500, body: '{}' })
    );

    await page.goto('/login');
    await page.getByLabel('Usuario o Correo').fill('admin');
    await page.getByLabel('Contraseña').fill('pass');
    await page.getByRole('button', { name: 'Ingresar' }).click();

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('alert')).not.toContainText('undefined');
    await expect(page.getByRole('alert')).not.toContainText('null');
  });

  test('logout clears session and redirects to /login', async ({ page }) => {
    // Cannot use loginAs() here — addInitScript() re-injects storage on every
    // navigation, so clearing storage then navigating again would re-authenticate.
    // Instead, do a real form login with a mocked backend.
    await page.route('**/api/**', (route) => {
      const type = route.request().resourceType();
      if (type === 'script' || type === 'stylesheet' || type === 'document') return route.continue();
      const accept = route.request().headers()['accept'] ?? '';
      if (accept.includes('text/event-stream')) return route.abort();
      return route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ content: [], totalElements: 0, totalPages: 0 }) });
    });
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify(MOCK_LOGIN_RESPONSE) })
    );

    await page.goto('/login');
    await page.getByLabel('Usuario o Correo').fill('testadmin');
    await page.getByLabel('Contraseña').fill('password123');
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

    // Simulate logout by clearing storage (what AuthContext.logout() does)
    await page.evaluate(() => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      sessionStorage.clear();
    });

    // Navigate to a protected route — no token → should redirect to /login
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });
  });
});
