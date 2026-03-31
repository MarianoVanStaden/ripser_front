import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { FAKE_JWT, FAKE_USER } from '../../utils/mock-auth';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * AUTH SETUP — runs once before all authenticated test projects.
 *
 * This file is picked up by the 'setup' project in playwright.config.ts.
 *
 * Strategy: inject auth state via addInitScript rather than performing a
 * real backend login.  This makes the setup project:
 *   - Independent of backend credentials / availability
 *   - Instant (no network round-trip, no login form interaction)
 *   - Deterministic (same FAKE_JWT on every run)
 *
 * The saved storageState (e2e/.auth/user.json) contains FAKE_JWT in
 * localStorage.  All authenticated projects (chromium) load this state
 * and rely on the fixture-level auth/validate mock to prevent AuthContext
 * from calling the real backend on startup.
 *
 * See: e2e/fixtures/index.ts — page fixture mocks auth/validate globally.
 */

const authStatePath = path.resolve(__dirname, '../../.auth/user.json');

setup('authenticate as default user', async ({ page }) => {
  // Inject auth state before React mounts — addInitScript runs before any JS
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

  // Mock validate so AuthContext accepts the injected token
  await page.route('**/api/auth/validate', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  );

  // Mock all other API calls (empty paginated responses + SSE abort)
  await page.route('**/api/**', (route) => {
    const type = route.request().resourceType();
    if (type === 'script' || type === 'stylesheet' || type === 'document') {
      return route.continue();
    }
    const accept = route.request().headers()['accept'] ?? '';
    if (accept.includes('text/event-stream')) {
      return route.abort();
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        content: [],
        totalElements: 0,
        totalPages: 0,
        number: 0,
        size: 20,
      }),
    });
  });

  // Navigate to dashboard — addInitScript fires BEFORE React initialises,
  // so AuthContext will find the token in localStorage on first mount.
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

  // Persist storage state — localStorage now contains FAKE_JWT.
  // Chromium project tests load this file via storageState in playwright.config.ts.
  await page.context().storageState({ path: authStatePath });
});
