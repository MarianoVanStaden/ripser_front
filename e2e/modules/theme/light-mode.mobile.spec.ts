import { test as base, expect } from '../../fixtures';

/**
 * Modo claro con SO en oscuro — regresión.
 *
 * Bug histórico: el theme declaraba `colorSchemeSelector: 'data'`, que genera
 * los selectores `[data-light]` / `[data-dark]`, mientras el script anti-FOUC
 * de index.html seteaba `data-mui-color-scheme`. Con el SO en oscuro el
 * atributo quedaba pegado en "dark" y la regla pre-JS
 * `html[data-mui-color-scheme='dark'] body` (más específica que CssBaseline)
 * pintaba el fondo negro aunque el usuario eligiera "Claro": títulos de página
 * ilegibles sobre negro y un mix claro/oscuro en toda la app.
 *
 * Este spec fija el contrato: preferencia explícita "light" GANA sobre el
 * `prefers-color-scheme: dark` del sistema, en el atributo y en el pixel.
 */
const test = base.extend({
  colorScheme: ['dark' as const, { option: true }],

  _lightStorage: [
    async ({ page }, use) => {
      await page.addInitScript(() => {
        try {
          localStorage.setItem('mui-mode', 'light');
        } catch {
          /* storage bloqueado: el test no aplica */
        }
      });
      await use();
    },
    { auto: true },
  ] as const,
});

test.describe('Modo claro sobre SO oscuro — infraestructura', () => {
  test('el atributo de esquema queda en light', async ({ page }) => {
    await page.goto('./');

    await expect(page.locator('html')).toHaveAttribute(
      'data-mui-color-scheme',
      'light',
    );
  });

  test('el body pinta el fondo claro del theme', async ({ page }) => {
    await page.goto('./');

    // #f5f5f5 — background.default del esquema light.
    await expect
      .poll(async () =>
        page.evaluate(() => getComputedStyle(document.body).backgroundColor),
      )
      .toBe('rgb(245, 245, 245)');
  });
});
