import { test, expect } from '../../fixtures';
import { assertNoHorizontalOverflow } from '../../utils/mobile';

/**
 * Garantías / Registro — E2E mobile (Pixel 5 / iPhone 13).
 *
 * Smoke de campo:
 *   1. La página carga sin overflow horizontal en viewport de teléfono.
 *   2. La página es operable en mobile: heading + acción principal visibles
 *      (la lista colapsa a cards / layout apilado en < 600px).
 */

test.describe('Garantías — mobile', () => {
  test('should load /garantias/registro without horizontal overflow', async ({
    garantiasPage,
    page,
  }) => {
    await garantiasPage.goto();
    await garantiasPage.assertOnPage();
    await expect(page.locator('body')).not.toContainText('Error: ');
    await assertNoHorizontalOverflow(page);
  });

  test('should be operable on a mobile viewport', async ({ garantiasPage, page }) => {
    await garantiasPage.goto();
    await garantiasPage.assertOnPage();

    // Acción principal accesible en mobile (sin scroll lateral).
    await expect(garantiasPage.nuevaGarantiaButton).toBeVisible();
    await expect(garantiasPage.searchInput).toBeVisible();

    // Vista mobile: no debe quedar una tabla desktop desbordando el viewport.
    // Si hay <table>, tiene que caber (o vivir en un contenedor con scroll
    // propio); el documento en sí no puede scrollear horizontal.
    await assertNoHorizontalOverflow(page);
  });
});
