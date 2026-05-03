import { test, expect } from '../../fixtures';
import type { Page } from '@playwright/test';

/**
 * Smoke tests for the FRONT-003 refactor of the Ventas module.
 *
 * Goal: catch regressions introduced when splitting the three big page files
 *  - PresupuestosPage.tsx     (2.232 LOC)
 *  - NotasPedidoPage.tsx      (2.590 LOC)
 *  - FacturacionPage.tsx      (1.938 LOC, partially split already in FRONT-002)
 *
 * The tests below run with the global mocks installed by `_routeMocks` in
 * e2e/fixtures/index.ts — every /api/** call returns an empty paginated
 * response.  That makes the smoke deliberately UI-shaped: we verify
 * scaffolding (pages mount, headings render, primary CTAs are wired,
 * dialogs open with their expected fields) without requiring a live backend.
 *
 * What this guards against during a component-by-component split:
 *   - Broken imports / props after extracting a sub-component
 *   - Dialog state desync after extracting a Dialog presentational
 *   - Tabs disappearing or swapped after splitting tab bodies
 *   - Buttons no longer wired after moving handlers
 *   - **NEW** unhandled crashes that the Sentry ErrorBoundary catches
 *
 * What this does NOT guard against (covered by other tests):
 *   - End-to-end correctness of the conversion chain
 *     (presupuesto → nota pedido → factura).  See `ventas.test.ts` for the
 *     API-driven version, and the `test.fixme` block at the bottom of this
 *     file for the planned UI-driven full-chain smoke.
 *
 * KNOWN PRE-EXISTING ISSUE (descubierto al crear este smoke, 2026-05-03):
 *   /ventas/presupuestos y /ventas/notas-pedido **crashean al primer mount
 *   con mocks vacíos** y caen al fallback del Sentry ErrorBoundary
 *   ("Algo salió mal").  Causa más probable: algún `useMemo` / `useEffect`
 *   asume un shape de respuesta que no coincide con `{content:[]}` o un
 *   `array[0]` sin guard.  Los tests de esas páginas comparan contra ese
 *   fallback con un mensaje claro: si el síntoma cambia (otro error o se
 *   arregla), el smoke alerta. Investigar fuera del alcance de FRONT-003.
 */

/** Returns the locator for the Sentry ErrorBoundary fallback ("Algo salió mal"). */
const errorBoundaryFallback = (page: Page) =>
  page.getByRole('heading', { name: /algo salió mal/i });

/**
 * Fail-fast assertion: if the ErrorBoundary is visible, fail with a clear
 * message before any other selector has a chance to time out.
 */
async function assertNoErrorBoundary(page: Page, pageName: string): Promise<void> {
  const fallback = errorBoundaryFallback(page);
  // Quick check — don't wait long; we want a fast signal, not a 30s timeout.
  if (await fallback.isVisible({ timeout: 1_500 }).catch(() => false)) {
    throw new Error(
      `Sentry ErrorBoundary fallback ("Algo salió mal") visible on ${pageName}. ` +
      `Página crasheó al montar con mocks vacíos. Ver el page snapshot adjunto al ` +
      `fallo para el árbol exacto. Issue conocido al 2026-05-03 — investigar como ` +
      `pre-requisito de FRONT-003.`,
    );
  }
}

test.describe('FRONT-003 smoke — Ventas pages render & primary CTAs wired', () => {
  /**
   * Override the fixture's catch-all (which returns `{content:[]}` for every
   * endpoint) for endpoints that actually return a *flat array*.  Crashes
   * surface when consumers call `array.find(...)` on a paginated response
   * — see TenantContext:158 (`relaciones.find(...)`).
   *
   * Approach: keep the fixture's paginated default for unspecified endpoints
   * (matches existing test contracts), and route the known flat-array URLs
   * to `[]`.  The list grew empirically — any endpoint that triggers a
   * "X.find is not a function" or "X.map is not a function" crash on these
   * pages should be added.
   *
   * Registered later than the fixture's catch-all → LIFO priority → wins.
   */
  test.beforeEach(async ({ page }) => {
    // Use regex to match URLs WITH query strings — globs like
    // `**/api/colores` don't match `/api/colores?activo=true`.
    const flatArrayPatterns: RegExp[] = [
      // Tenant context / org plumbing — hit on every authenticated page
      /\/api\/usuario-empresa\/usuario\//,
      /\/api\/usuario-empresa\/empresa\//,
      /\/api\/sucursales(\?|\/|$)/,
      /\/api\/empresas(\?|\/|$)/,
      // Catalogs
      /\/api\/productos(\?|\/|$)/,
      /\/api\/categorias-productos(\?|\/|$)/,
      /\/api\/categorias(\?|\/|$)/,
      /\/api\/recetas-fabricacion(\?|\/|$)/,
      /\/api\/equipos-fabricados(\?|\/|$)/,
      /\/api\/colores(\?|\/|$)/,
      /\/api\/medidas(\?|\/|$)/,
      /\/api\/parametros(\?|\/|$)/,
      // Financiamiento templates and options
      /\/api\/opciones-financiamiento(\?|\/|$)/,
      /\/api\/opciones-financiamiento-templates(\?|\/|$)/,
      // Active sub-listings (return arrays even where parent is paginated)
      /\/api\/bancos\/activos/,
      /\/api\/cuentas-bancarias(\?|\/|$)/,
      /\/api\/usuarios(\?|\/|$)/,
      /\/api\/empleados\/activos/,
      // Cliente/Lead helpers used by the autocomplete in the dialog
      /\/api\/clientes\/(search|buscar)/,
      /\/api\/leads\/(search|buscar)/,
    ];

    await page.route(/\/api\//, (route) => {
      const url = route.request().url();
      // Only intercept if any flat-array pattern matches; otherwise fall
      // through to the fixture's catch-all (paginated empty response).
      if (flatArrayPatterns.some((re) => re.test(url))) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: '[]',
        });
      }
      return route.fallback();
    });
  });

  // ── Presupuestos: heading, "Nuevo Presupuesto" CTA, dialog opens with form ──
  test('Presupuestos page mounts and the create dialog opens with cliente field', async ({
    ventasPage,
    page,
  }) => {
    // KNOWN: el dialog "Nuevo Presupuesto" abre y luego algo dentro del
    // árbol de componentes crashea (Sentry ErrorBoundary lo captura sin
    // emitir console.error). El mock infrastructure ya cubrió `colores`,
    // `usuario-empresa`, `sucursales`, `productos`, `recetas`, `medidas`,
    // `opciones-financiamiento` y demás catalogos. La causa restante
    // requiere debug runtime (probablemente una integración con dayjs,
    // ColorPicker, ClienteAutocomplete o algún useMemo no defensivo
    // contra estado vacío). Marcado test.fail() — al resolver, sacar.
    test.fail();

    await ventasPage.gotoPresupuestos();
    await assertNoErrorBoundary(page, '/ventas/presupuestos');

    // Heading renders. PresupuestosPage uses a single h1 styled as h4.
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 });

    // Primary CTA — `aria-label="Crear nuevo presupuesto"` (PresupuestosPage.tsx:987).
    const nuevoPresupuesto = page.getByRole('button', { name: 'Crear nuevo presupuesto' });
    await expect(nuevoPresupuesto).toBeVisible();

    // Dialog opens — confirms the dialog component still mounts after the split.
    await nuevoPresupuesto.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // The cliente autocomplete is the first identity-bearing field; if this
    // breaks, downstream "create flow" tests would all fail.
    await expect(dialog.getByLabel('Buscar Cliente / Lead')).toBeVisible();

    // Close cleanly so the next test starts from a known state.
    await dialog.getByRole('button', { name: /cancelar/i }).click();
    await expect(dialog).not.toBeVisible();
  });

  // ── Notas de Pedido: heading, "Convertir Presupuesto" CTA renders ──────────
  test('Notas Pedido page mounts and surfaces the "Convertir Presupuesto" CTA', async ({
    ventasPage,
    page,
  }) => {
    // KNOWN: con los mocks actuales el page tree termina en el ErrorBoundary
    // antes de que el botón "Convertir Presupuesto" se renderice. La hipótesis
    // es la misma que en el test anterior: algún componente dentro de la lista
    // de notas asume datos que el mock no provee. Ver el TODO del test
    // anterior. Marcado test.fail() — al resolver, sacar.
    test.fail();

    await ventasPage.gotoNotasPedido();
    await assertNoErrorBoundary(page, '/ventas/notas-pedido');

    await expect(page.getByRole('heading', { name: /notas de pedido/i, level: 1 }))
      .toBeVisible({ timeout: 10_000 });

    // CTA — "Convertir Presupuesto" (NotasPedidoPage.tsx:1339).
    // Disabled when there are no pending presupuestos (and our mocks return
    // empty), so we only assert the button is *rendered*, not enabled.
    const convertirBtn = page.getByRole('button', { name: /convertir presupuesto/i });
    await expect(convertirBtn).toBeVisible();
  });

  // ── Facturación: heading + both tabs (Manual / Desde Nota de Pedido) ───────

  test('Facturacion page mounts with both tabs ("Facturación Manual" + "Desde Nota de Pedido")', async ({
    ventasPage,
    page,
  }) => {
    await ventasPage.gotoFacturacion();
    await assertNoErrorBoundary(page, '/ventas/facturacion');

    // FacturacionPage.tsx:1677 uses `variant="h4"` without `component="h1"`,
    // so it isn't reachable as a heading. Match the visible text instead.
    await expect(page.getByText('Facturación', { exact: false }).first())
      .toBeVisible({ timeout: 10_000 });

    // Tabs — FacturacionPage.tsx:1731-1732.  These are the seam most at risk
    // when extracting tab bodies into <FacturarManualTab> / <DesdeNotaPedidoTab>.
    await expect(page.getByRole('tab', { name: /facturación manual/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /desde nota de pedido/i })).toBeVisible();
  });

  // ── No JS error / ErrorBoundary across all four ventas pages ───────────────

  test('Cross-page navigation does not crash any ventas page', async ({ ventasPage, page }) => {
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(`console.error: ${msg.text()}`);
    });

    // Visit each route AND assert ErrorBoundary fallback is not shown.
    // If any page crashes, the assertion fails with the page name.
    for (const [pathName, navigate] of [
      ['/ventas/presupuestos',  () => ventasPage.gotoPresupuestos()],
      ['/ventas/notas-pedido',  () => ventasPage.gotoNotasPedido()],
      ['/ventas/facturacion',   () => ventasPage.gotoFacturacion()],
      ['/ventas/notas-credito', () => ventasPage.gotoNotasCredito()],
    ] as const) {
      await navigate();
      // Use expect.soft so we collect *all* crashing pages instead of stopping
      // at the first one — more useful diagnosis after a refactor.
      await expect.soft(
        errorBoundaryFallback(page),
        `ErrorBoundary fallback visible on ${pathName} — page crashed at mount`,
      ).not.toBeVisible({ timeout: 1_500 });
    }

    // Filter out the noise we expect (Sentry breadcrumbs, network 401 from
    // the fixture's auth/validate mock interplay, etc.) but flag genuine
    // React errors that bypassed the ErrorBoundary.
    const realErrors = consoleErrors.filter(
      (e) =>
        !/Failed to load resource/i.test(e) &&
        !/sentry/i.test(e) &&
        !/Sentry Logger/i.test(e),
    );
    expect.soft(
      realErrors,
      `Unexpected JS errors during navigation:\n${realErrors.join('\n')}`,
    ).toEqual([]);
  });

  // ── STRETCH: full conversion chain via UI clicks ──────────────────────────
  //
  // Pendiente — necesita observar en runtime los endpoints exactos que cada
  // página llama durante la conversión (search de presupuestos pendientes,
  // POST /api/documentos/.../convertir-a-nota-pedido, POST .../factura, …).
  // Mockearlos en orden con datos sintéticos evolutivos (presupuesto activo →
  // nota creada → factura emitida) requiere correr el dev server local +
  // capturar tráfico real una vez, no se puede inferir de ojo desde los
  // services del front.
  //
  // Plan para activarlo:
  //   1. Levantar `npm run dev` localmente, hacer la conversión P→NP→F real.
  //   2. Capturar las request URLs y payloads exactos (DevTools Network).
  //   3. Reemplazar este `fixme` por `test()` con `page.route` que devuelva
  //      datos sintéticos coherentes con esas URLs.
  //   4. Verificar tabla → click "Convertir" → dialog → confirm → tabla
  //      siguiente página → click "Convertir a Factura" → estado.
  // ───────────────────────────────────────────────────────────────────────
  test.fixme('Full chain via UI: presupuesto → nota pedido → factura', async () => {
    // Implementation deferred — see the long comment above.
  });
});
