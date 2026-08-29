import { test, expect } from '../../fixtures/darkMode';

/**
 * Modo oscuro — smoke E2E mobile (Pixel 5 / iPhone 13).
 *
 * Valida la infraestructura del esquema oscuro de punta a punta:
 *   1. El script anti-FOUC de index.html setea data-mui-color-scheme="dark"
 *      (persistencia localStorage 'mui-mode' → atributo antes del primer paint).
 *   2. El fondo REAL computado del body es el token oscuro (#121212), no el
 *      claro — es decir, las CSS variables de MUI están activas y resueltas.
 *   3. El meta theme-color acompaña al esquema (barra del navegador).
 */

test.describe('Modo oscuro — infraestructura', () => {
  test('resuelve el esquema oscuro antes del primer paint', async ({ page }) => {
    await page.goto('./');

    await expect(page.locator('html')).toHaveAttribute(
      'data-mui-color-scheme',
      'dark',
    );
  });

  test('el body pinta el fondo oscuro del theme', async ({ page }) => {
    await page.goto('./');

    // #121212 — background.default del esquema dark.
    await expect
      .poll(async () =>
        page.evaluate(() => getComputedStyle(document.body).backgroundColor),
      )
      .toBe('rgb(18, 18, 18)');
  });

  test('meta theme-color sigue al esquema', async ({ page }) => {
    await page.goto('./');

    await expect
      .poll(async () =>
        page.evaluate(() =>
          document
            .querySelector('meta[name="theme-color"]')
            ?.getAttribute('content'),
        ),
      )
      .toBe('#1e1e1e');
  });
});
