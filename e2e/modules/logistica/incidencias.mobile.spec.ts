import { test, expect } from '../../fixtures';
import { assertNoHorizontalOverflow } from '../../utils/mobile';

/**
 * Logística / Legajo de Vehículos (incidencias) — E2E mobile
 * (Pixel 5 / iPhone 13).
 *
 * Smoke de campo: la página carga y no hay overflow horizontal en viewport
 * de teléfono (< 600px).
 */

const PATH = '/logistica/vehiculos/incidencias';

test.describe('Incidencias de Vehículos — mobile', () => {
  test('should load without horizontal overflow', async ({ page }) => {
    await page.goto(PATH);
    await expect(page).toHaveURL(new RegExp(PATH), { timeout: 10_000 });
    await expect(page.locator('body')).not.toContainText('Error: ');
    await assertNoHorizontalOverflow(page);
  });
});
