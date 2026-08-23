import { test as base, expect } from './index';

/**
 * Dark-mode variant of the shared fixtures. Specs that must run in dark import
 * `test`/`expect` from HERE instead of '../fixtures'.
 *
 * Two layers, matching how the app resolves the scheme in production:
 *   1. localStorage 'mui-mode' = 'dark' BEFORE any script runs — the anti-FOUC
 *      inline script in index.html and MUI's ThemeProvider both read this key.
 *   2. colorScheme 'dark' — so `prefers-color-scheme` also reports dark (covers
 *      the 'system' fallback path).
 *
 * Reuses the existing mobile projects (Pixel 5 / iPhone 13) — no extra project
 * in playwright.config.ts; dark coverage is opt-in per spec file.
 */
export const test = base.extend({
  colorScheme: ['dark' as const, { option: true }],

  _darkStorage: [
    async ({ page }, use) => {
      await page.addInitScript(() => {
        try {
          localStorage.setItem('mui-mode', 'dark');
        } catch {
          /* storage bloqueado: el colorScheme del contexto cubre el caso */
        }
      });
      await use();
    },
    { auto: true },
  ] as const,
});

export { expect };
