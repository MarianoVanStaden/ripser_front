import { Page } from '@playwright/test';

/**
 * Shared mock utilities for auth-related E2E tests.
 *
 * These allow tests to run without a live backend by intercepting
 * the auth/login and auth/validate endpoints with predictable responses.
 *
 * Why not use real credentials?
 *   The 'auth' project tests validate UI/app behaviour — they should not
 *   depend on backend availability or specific user accounts.  Only the
 *   'setup' project (auth.setup.ts) needs the real backend, and that file
 *   uses addInitScript to bypass the login form entirely.
 */

/**
 * A minimal JWT with no `exp` field.
 * AuthContext's client-side check returns `false` (not expired) when `exp` is absent,
 * so this token will always be accepted without backend validation.
 * Payload decodes to: { "sub": "1" }
 */
export const FAKE_JWT =
  'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.fakesignature';

/** Auth user stored in localStorage alongside FAKE_JWT. */
export const FAKE_USER = {
  id: 1,
  username: 'testadmin',
  email: 'admin@test.com',
  roles: ['ADMIN'],
  esSuperAdmin: false,
  empresaId: 1,
  sucursalId: 1,
};

/**
 * Shape returned by POST /api/auth/login.
 * Matches what AuthContext.login() expects (accessToken + user fields).
 */
export const MOCK_LOGIN_RESPONSE = {
  ...FAKE_USER,
  accessToken: FAKE_JWT,
};

/**
 * Registers Playwright route mocks that simulate a fully-functional backend.
 *
 * Call this BEFORE page.goto() so the mocks are active when React boots.
 *
 * Priority (Playwright uses LIFO — last registered wins):
 *   1. catch-all: empty paginated response for any /api/** call
 *   2. auth/validate: always 200
 *   3. auth/login: always 200 with MOCK_LOGIN_RESPONSE  ← highest priority
 *
 * Special cases handled:
 *   - Vite source files (/src/api/**.ts etc.) are passed through untouched.
 *   - SSE requests (Accept: text/event-stream) are aborted to prevent
 *     fetchEventSource infinite retry loops.
 */
export async function mockAuthRoutes(page: Page): Promise<void> {
  // 1. Catch-all (lowest priority — registered first)
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

  // 2. validate endpoint
  await page.route('**/api/auth/validate', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  );

  // 3. login endpoint (highest priority)
  await page.route('**/api/auth/login', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_LOGIN_RESPONSE),
    })
  );
}
