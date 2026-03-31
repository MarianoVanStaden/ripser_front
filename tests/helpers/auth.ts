import { Page } from '@playwright/test';

export const FAKE_USER = {
  id: 1,
  username: 'testadmin',
  email: 'admin@test.com',
  roles: ['ADMIN'],
  esSuperAdmin: false,
};

/**
 * A padding-safe fake JWT.
 * Payload {"sub":"12"} = 12 bytes → 16 base64url chars (no padding needed).
 * AuthContext.isTokenExpired() returns false when `exp` is absent → treated as valid.
 */
export const FAKE_JWT = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMiJ9.fakesig';

/** @deprecated Use FAKE_JWT constant instead. */
export function makeFakeJwt(): string {
  return FAKE_JWT;
}

/**
 * Sets up an authenticated browser session WITHOUT navigating to /login first.
 *
 * Key fixes vs the previous implementation:
 *
 * 1. addInitScript() instead of evaluate()
 *    evaluate() runs AFTER React has already initialized, so AuthContext never
 *    sees the injected token on the first mount.
 *    addInitScript() runs BEFORE any JavaScript — storage is already populated
 *    when React mounts for the first time.
 *
 * 2. SSE requests are aborted
 *    useFinancialEvents() opens a Server-Sent Events stream via fetchEventSource.
 *    Returning a JSON body for an SSE request causes the library to retry
 *    indefinitely, preventing the page from ever settling.  Aborting these
 *    requests lets the page finish loading normally.
 *
 * 3. Route priority (last registered = highest priority)
 *    Catch-all is registered FIRST (lowest priority).
 *    Specific overrides are registered LAST (highest priority).
 *
 * Usage:
 *   await loginAs(page);
 *   await page.goto('/dashboard');  // ← navigate directly — no need for /login
 */
export async function loginAs(page: Page, user = FAKE_USER): Promise<void> {
  // ── 1. Inject storage state before React initialises ──────────────────────
  await page.addInitScript(
    ({ token, user }) => {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
      sessionStorage.setItem('empresaId', '1');
      sessionStorage.setItem('sucursalId', '1');
      sessionStorage.setItem('esSuperAdmin', 'false');
    },
    { token: FAKE_JWT, user }
  );

  // ── 2. Catch-all API mock (lowest priority) — aborts SSE ─────────────────
  // IMPORTANT: '**/api/**' also matches Vite's source files served at
  // /src/api/*.ts in dev mode. Skip script/stylesheet resources so Vite can
  // continue serving them normally; only mock fetch/XHR (real API calls).
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

  // ── 3. Specific overrides (highest priority) ──────────────────────────────
  await page.route('**/api/auth/validate', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  );
}
