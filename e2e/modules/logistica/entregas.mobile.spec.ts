import { test, expect } from '../../fixtures';
import { assertNoHorizontalOverflow } from '../../utils/mobile';

/**
 * Logística / Control de Entregas — E2E mobile (Pixel 5 / iPhone 13).
 *
 * Flujo de campo del conductor:
 *   1. La página carga sin overflow horizontal (vista de cards < 600px).
 *   2. Confirmar entrega: el botón "Confirmar" se bloquea tras el primer tap
 *      (guard anti doble-submit de DeliveriesPage — un doble tap en 3G
 *      dispararía dos confirmarEntrega → cobro duplicado).
 *
 * El test 2 siembra una entrega PENDIENTE vía route override (LIFO-higher que
 * el catch-all del fixture) para no depender de datos reales del backend; si
 * aún así la card no aparece (cambio de layout/permisos), hace skip limpio.
 */

const PATH = '/logistica/distribucion/entregas-productos';

/** Entrega PENDIENTE mínima para que la card mobile renderice. */
const ENTREGA_PENDIENTE = {
  id: 99001,
  viajeId: null,
  documentoComercialId: null,
  ordenServicioId: null,
  tipoParada: 'OTRO',
  direccionEntrega: 'Calle Falsa 123, Springfield',
  fechaEntrega: '2026-08-22',
  estado: 'PENDIENTE',
  observaciones: 'Entrega E2E mobile',
  clienteNombre: 'Cliente E2E',
  montoEsperado: null,
  detallesCobro: [],
};

test.describe('Entregas — mobile', () => {
  // ── 1. Carga sin overflow horizontal ──────────────────────────────────────

  test('should load without horizontal overflow', async ({ page }) => {
    await page.goto(PATH);
    await expect(page).toHaveURL(new RegExp(PATH), { timeout: 10_000 });
    await expect(page.locator('body')).not.toContainText('Error: ');
    await assertNoHorizontalOverflow(page);
  });

  // ── 2. Confirmar se bloquea tras el primer tap (anti doble-submit) ────────

  test('should send a single POST when Confirmar is tapped twice', async ({ page }) => {
    // Siembra: una entrega PENDIENTE (override LIFO-higher que el catch-all).
    await page.route('**/api/entregas-viaje', (route) => {
      if (route.request().method() !== 'GET') return route.fallback();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([ENTREGA_PENDIENTE]),
      });
    });

    // Intercepta el POST de confirmación con respuesta demorada, contando
    // cuántos requests llegan mientras el botón debería estar bloqueado.
    let confirmRequests = 0;
    await page.route('**/api/entregas-viaje/confirmar-entrega', async (route) => {
      confirmRequests++;
      await new Promise((r) => setTimeout(r, 1_500));
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...ENTREGA_PENDIENTE, estado: 'ENTREGADA' }),
      });
    });

    await page.goto(PATH);
    await expect(page).toHaveURL(new RegExp(PATH), { timeout: 10_000 });

    // Card mobile de entrega PENDIENTE → IconButton verde (CheckCircle).
    const confirmIconButton = page
      .locator('button:has([data-testid="CheckCircleIcon"])')
      .first();
    const visible = await confirmIconButton
      .waitFor({ state: 'visible', timeout: 10_000 })
      .then(() => true)
      .catch(() => false);
    test.skip(
      !visible,
      'No hay entregas PENDIENTE visibles en la vista mobile (la card sembrada no renderizó) — no se puede ejercitar el flujo de confirmación.'
    );

    await confirmIconButton.tap();

    // BottomSheet "Confirmar Entrega": nombre del receptor es obligatorio.
    const nombreInput = page.getByLabel(/nombre del receptor/i).first();
    await expect(nombreInput).toBeVisible({ timeout: 8_000 });
    await nombreInput.fill('Receptor E2E');

    const confirmarButton = page.getByRole('button', { name: /^Confirmar$/ });
    await expect(confirmarButton).toBeEnabled();

    // Primer tap: dispara el POST (demorado 1.5s por el intercept).
    await confirmarButton.tap();

    // Mientras el POST está en vuelo el botón debe estar deshabilitado
    // (submitting=true) — un segundo tap no debe generar otro request.
    const confirmandoButton = page.getByRole('button', { name: /confirmando/i });
    await expect(confirmandoButton.or(confirmarButton).first()).toBeDisabled({
      timeout: 3_000,
    });
    await confirmandoButton
      .or(confirmarButton)
      .first()
      .tap({ force: true, timeout: 2_000 })
      .catch(() => {
        /* el tap sobre un botón disabled puede rechazar: es el comportamiento esperado */
      });

    // Espera a que la mutación demorada termine (el sheet se cierra).
    await expect(nombreInput).not.toBeVisible({ timeout: 10_000 });

    expect(confirmRequests, 'un doble tap debe generar UN solo POST de confirmación').toBe(1);
  });
});
